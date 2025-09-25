import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from "recharts";

// Mock data for demonstration
const monthlyData = [
  { month: "Jan", income: 4500, expenses: 3200 },
  { month: "Feb", income: 4200, expenses: 3100 },
  { month: "Mar", income: 4800, expenses: 3400 },
  { month: "Apr", income: 4600, expenses: 3300 },
  { month: "May", income: 5000, expenses: 3600 },
  { month: "Jun", income: 4900, expenses: 3500 }
];

const categoryData = [
  { name: "Food & Dining", value: 800, color: "#ef4444" },
  { name: "Transportation", value: 600, color: "#f97316" },
  { name: "Shopping", value: 500, color: "#eab308" },
  { name: "Bills & Utilities", value: 700, color: "#22c55e" },
  { name: "Entertainment", value: 300, color: "#3b82f6" },
  { name: "Healthcare", value: 200, color: "#8b5cf6" }
];

const recentTransactions = [
  { id: 1, description: "Grocery Shopping", category: "Food & Dining", amount: -85.50, date: "2024-01-15", type: "expense" },
  { id: 2, description: "Freelance Payment", category: "Income", amount: 1200.00, date: "2024-01-14", type: "income" },
  { id: 3, description: "Gas Station", category: "Transportation", amount: -45.20, date: "2024-01-13", type: "expense" },
  { id: 4, description: "Netflix Subscription", category: "Entertainment", amount: -15.99, date: "2024-01-12", type: "expense" },
  { id: 5, description: "Salary", category: "Income", amount: 4500.00, date: "2024-01-01", type: "income" }
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Balance"
          value="$12,458.32"
          change="+12.5%"
          icon={DollarSign}
          variant="default"
        />
        <StatCard
          title="Monthly Income"
          value="$4,900.00"
          change="+8.2%"
          icon={TrendingUp}
          variant="income"
        />
        <StatCard
          title="Monthly Expenses"
          value="$3,500.00"
          change="-2.4%"
          icon={TrendingDown}
          variant="expense"
        />
        <StatCard
          title="Savings Rate"
          value="28.6%"
          change="+5.1%"
          icon={PieChart}
          variant="default"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Overview Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>
              Income vs Expenses for the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="income" fill="hsl(var(--income))" name="Income" />
                <Bar dataKey="expenses" fill="hsl(var(--expense))" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>
              Breakdown of your spending by category this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Tooltip />
                <RechartsPieChart data={categoryData}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your latest financial activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.category} • {transaction.date}
                  </p>
                </div>
                <div className={`font-semibold ${
                  transaction.type === "income" ? "text-income" : "text-expense"
                }`}>
                  {transaction.type === "income" ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}