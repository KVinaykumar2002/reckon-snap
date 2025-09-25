import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ExtractedData {
  merchant: string;
  date: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  category: string;
}

export default function ReceiptUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    toast({
      title: "Files uploaded",
      description: `${acceptedFiles.length} file(s) added for processing.`,
    });
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const processReceipts = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate OCR processing
    for (let i = 0; i < uploadedFiles.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProcessingProgress(((i + 1) / uploadedFiles.length) * 100);
      
      // Mock extracted data
      const mockData: ExtractedData = {
        merchant: ["Whole Foods", "Target", "Walmart", "CVS Pharmacy"][Math.floor(Math.random() * 4)],
        date: new Date().toISOString().split('T')[0],
        total: Math.round((Math.random() * 200 + 10) * 100) / 100,
        items: [
          { name: "Organic Bananas", quantity: 2, price: 3.99 },
          { name: "Greek Yogurt", quantity: 1, price: 5.49 },
          { name: "Whole Wheat Bread", quantity: 1, price: 2.99 }
        ],
        category: "Food & Dining"
      };
      
      setExtractedData(prev => [...prev, mockData]);
    }

    setIsProcessing(false);
    toast({
      title: "Processing complete",
      description: `Successfully extracted data from ${uploadedFiles.length} receipt(s).`,
    });
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setExtractedData([]);
    setProcessingProgress(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Receipt Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload receipt images or PDFs to automatically extract transaction data using OCR
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Receipts
          </CardTitle>
          <CardDescription>
            Drag and drop receipt images (PNG, JPG) or PDF files, or click to browse
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
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary font-medium">Drop the files here...</p>
            ) : (
              <div>
                <p className="font-medium mb-2">Choose files or drag and drop</p>
                <p className="text-sm text-muted-foreground">
                  Supports PNG, JPG, and PDF files up to 10MB each
                </p>
              </div>
            )}
          </div>
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
                  {file.type.startsWith('image/') ? (
                    <Image className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-red-500" />
                  )}
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
              <Button onClick={processReceipts} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Process Receipts
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
                  <span className="text-sm">Processing receipts with OCR...</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Extracted Data */}
      {extractedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Extracted Data
            </CardTitle>
            <CardDescription>
              Review the extracted transaction data before adding to your records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {extractedData.map((data, index) => (
                <div key={index} className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{data.merchant}</h3>
                      <p className="text-sm text-muted-foreground">{data.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-expense">
                        ${data.total.toFixed(2)}
                      </div>
                      <Badge>{data.category}</Badge>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Items:</h4>
                    {data.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span>${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm">Add Transaction</Button>
                    <Button size="sm" variant="outline">Edit Details</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}