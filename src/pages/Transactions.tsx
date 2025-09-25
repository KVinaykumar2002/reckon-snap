import { useState } from "react";
import { format } from "date-fns";
import { Search, Filter, Download, Eye } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock transaction data
const mockTransactions = [
  { id: 1, description: "Grocery Shopping", category: "Food & Dining", amount: -85.50, date: "2024-01-15", type: "expense" },
  { id: 2, description: "Freelance Payment", category: "Income", amount: 1200.00, date: "2024-01-14", type: "income" },
  { id: 3, description: "Gas Station", category: "Transportation", amount: -45.20, date: "2024-01-13", type: "expense" },
  { id: 4, description: "Netflix Subscription", category: "Entertainment", amount: -15.99, date: "2024-01-12", type: "expense" },
  { id: 5, description: "Salary", category: "Income", amount: 4500.00, date: "2024-01-01", type: "income" },
  { id: 6, description: "Coffee Shop", category: "Food & Dining", amount: -4.50, date: "2024-01-11", type: "expense" },
  { id: 7, description: "Electric Bill", category: "Bills & Utilities", amount: -120.00, date: "2024-01-10", type: "expense" },
  { id: 8, description: "Investment Dividend", category: "Investment", amount: 250.00, date: "2024-01-09", type: "income" },
];

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const filteredTransactions = mockTransactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = [...new Set(mockTransactions.map(t => t.category))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            View and manage your financial transactions
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter your transactions by type, category, or search term
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setFilterCategory("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found matching your criteria.
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium">{transaction.description}</h3>
                      <Badge 
                        variant="outline"
                        className={cn(
                          transaction.type === "income" 
                            ? "border-income text-income bg-income/5" 
                            : "border-expense text-expense bg-expense/5"
                        )}
                      >
                        {transaction.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{transaction.category}</span>
                      <span>•</span>
                      <span>{format(new Date(transaction.date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "text-right font-semibold text-lg",
                      transaction.type === "income" ? "text-income" : "text-expense"
                    )}>
                      {transaction.type === "income" ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}