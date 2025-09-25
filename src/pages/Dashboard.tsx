import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalBalance: "0.00",
    monthlyIncome: "0.00",
    monthlyExpenses: "0.00",
    savingsRate: "0.0"
  });

  useEffect(() => {
    // Fetch monthly overview
    fetch('http://localhost:3001/api/monthly-overview')
      .then(res => res.json())
      .then(data => setMonthlyData(data))
      .catch(err => console.error('Error fetching monthly data:', err));

    // Fetch category breakdown
    fetch('http://localhost:3001/api/category-breakdown')
      .then(res => res.json())
      .then(data => setCategoryData(data))
      .catch(err => console.error('Error fetching category data:', err));

    // Fetch recent transactions
    fetch('http://localhost:3001/api/transactions')
      .then(res => res.json())
      .then(data => setRecentTransactions(data))
      .catch(err => console.error('Error fetching transactions:', err));

    // Fetch stats
    fetch('http://localhost:3001/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));
  }, []);

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Balance"
          value={`$${stats.totalBalance}`}
          change="+12.5%"
          icon={DollarSign}
          variant="default"
        />
        <StatCard
          title="Monthly Income"
          value={`$${stats.monthlyIncome}`}
          change="+8.2%"
          icon={TrendingUp}
          variant="income"
        />
        <StatCard
          title="Monthly Expenses"
          value={`$${stats.monthlyExpenses}`}
          change="-2.4%"
          icon={TrendingDown}
          variant="expense"
        />
        <StatCard
          title="Savings Rate"
          value={`${stats.savingsRate}%`}
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
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
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
              <div key={transaction._id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-semibold ${
                  transaction.type === "income" ? "text-income" : "text-expense"
                }`}>
                  {transaction.type === "income" ? "+" : ""}${transaction.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}