import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Database } from "lucide-react";
import * as XLSX from 'xlsx';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ExcelTransaction {
  type: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

interface ProcessedData {
  success: ExcelTransaction[];
  errors: Array<{ row: number; error: string; data: any }>;
}

export default function ReceiptUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    toast({
      title: "Files uploaded",
      description: `${acceptedFiles.length} Excel file(s) added for processing.`,
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: true
  });

  const parseExcelFile = async (file: File): Promise<ExcelTransaction[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Skip header row and process data
          const transactions: ExcelTransaction[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            if (row.length >= 5 && row[0] && row[1] && row[2] && row[3] && row[4]) {
              transactions.push({
                type: String(row[0]).toLowerCase(),
                amount: parseFloat(row[1]) || 0,
                category: String(row[2]),
                date: String(row[3]),
                description: String(row[4])
              });
            }
          }
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const validateTransaction = (transaction: ExcelTransaction, rowIndex: number): string | null => {
    // Validate type
    if (!['income', 'expense'].includes(transaction.type)) {
      return `Invalid type: ${transaction.type}. Must be 'income' or 'expense'`;
    }

    // Validate amount
    if (isNaN(transaction.amount) || transaction.amount <= 0) {
      return `Invalid amount: ${transaction.amount}. Must be a positive number`;
    }

    // Validate category
    if (!transaction.category || transaction.category.trim() === '') {
      return `Category is required`;
    }

    // Validate date
    const date = new Date(transaction.date);
    if (isNaN(date.getTime())) {
      return `Invalid date format: ${transaction.date}`;
    }

    // Validate description
    if (!transaction.description || transaction.description.trim() === '') {
      return `Description is required`;
    }

    return null;
  };

  const processExcelFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    const allTransactions: ExcelTransaction[] = [];
    const errors: Array<{ row: number; error: string; data: any }> = [];

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const transactions = await parseExcelFile(file);
        
        // Validate each transaction
        transactions.forEach((transaction, index) => {
          const error = validateTransaction(transaction, index + 2); // +2 because we skip header and 0-indexed
          if (error) {
            errors.push({ row: index + 2, error, data: transaction });
          } else {
            allTransactions.push(transaction);
          }
        });

        setProcessingProgress(((i + 1) / uploadedFiles.length) * 100);
      }

      setProcessedData({
        success: allTransactions,
        errors: errors
      });

      toast({
        title: "Processing complete",
        description: `Processed ${allTransactions.length} valid transactions. ${errors.length} errors found.`,
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "Failed to process Excel files. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadTransactions = async () => {
    if (!processedData || processedData.success.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const transaction of processedData.success) {
        try {
          const response = await fetch('http://localhost:3001/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...transaction,
              date: new Date(transaction.date).toISOString()
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${successCount} transactions. ${errorCount} failed.`,
      });

      // Clear processed data after successful upload
      setProcessedData(null);
      setUploadedFiles([]);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setProcessedData(null);
    setProcessingProgress(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Excel Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload Excel files (.xlsx, .xls) or CSV files to bulk import transaction data
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Excel Files
          </CardTitle>
          <CardDescription>
            Drag and drop Excel files (.xlsx, .xls) or CSV files, or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="font-medium mb-2">Choose files or drag and drop</p>
                <p className="text-sm text-muted-foreground">
                  Supports Excel (.xlsx, .xls) and CSV files up to 10MB each
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expected Format */}
      <Card>
        <CardHeader>
          <CardTitle>Expected Excel Format</CardTitle>
          <CardDescription>
            Your Excel file should have the following columns in order:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Type</TableCell>
                <TableCell>Transaction type</TableCell>
                <TableCell>income or expense</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Amount</TableCell>
                <TableCell>Transaction amount</TableCell>
                <TableCell>100.50</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Category</TableCell>
                <TableCell>Transaction category</TableCell>
                <TableCell>Food & Dining</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Date</TableCell>
                <TableCell>Transaction date</TableCell>
                <TableCell>2024-01-15</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Description</TableCell>
                <TableCell>Transaction description</TableCell>
                <TableCell>Grocery shopping</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
            <CardDescription>
              Files ready for processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Badge variant="outline">Ready</Badge>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button onClick={processExcelFiles} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Process Files
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearAll} disabled={isProcessing}>
                Clear All
              </Button>
            </div>

            {isProcessing && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing Excel files...</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processed Data */}
      {processedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-success" />
              Processed Data
            </CardTitle>
            <CardDescription>
              Review the processed transaction data before uploading to your database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Success Summary */}
              <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">
                    {processedData.success.length} Valid Transactions
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Ready to upload to database
                  </p>
                </div>
              </div>

              {/* Errors Summary */}
              {processedData.errors.length > 0 && (
                <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200">
                      {processedData.errors.length} Errors Found
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      These rows will be skipped during upload
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {processedData.success.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Preview (First 10 transactions):</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedData.success.slice(0, 10).map((transaction, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              ${transaction.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>{transaction.category}</TableCell>
                            <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{transaction.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {processedData.success.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ... and {processedData.success.length - 10} more transactions
                    </p>
                  )}
                </div>
              )}

              {/* Error Details */}
              {processedData.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Error Details:</h4>
                  <div className="space-y-2">
                    {processedData.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Row {error.row}: {error.error}
                        </p>
                      </div>
                    ))}
                    {processedData.errors.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        ... and {processedData.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={uploadTransactions} 
                  disabled={isUploading || processedData.success.length === 0}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Upload {processedData.success.length} Transactions
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearAll} disabled={isUploading}>
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}