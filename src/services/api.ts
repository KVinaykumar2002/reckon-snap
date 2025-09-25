const API_BASE_URL = 'http://localhost:3001/api';

export interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStats {
  totalBalance: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  savingsRate: string;
}

export interface MonthlyOverview {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  color: string;
}

// Transaction API functions
export const transactionApi = {
  // Get all transactions
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await fetch(`${API_BASE_URL}/transactions`);
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    return response.json();
  },

  // Add new transaction
  addTransaction: async (transaction: Omit<Transaction, '_id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) {
      throw new Error('Failed to add transaction');
    }
    return response.json();
  },

  // Bulk add transactions
  addBulkTransactions: async (transactions: Omit<Transaction, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/transactions/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions }),
    });
    if (!response.ok) {
      throw new Error('Failed to add bulk transactions');
    }
    return response.json();
  },

  // Get transaction stats
  getStats: async (): Promise<TransactionStats> => {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return response.json();
  },

  // Get monthly overview
  getMonthlyOverview: async (): Promise<MonthlyOverview[]> => {
    const response = await fetch(`${API_BASE_URL}/monthly-overview`);
    if (!response.ok) {
      throw new Error('Failed to fetch monthly overview');
    }
    return response.json();
  },

  // Get category breakdown
  getCategoryBreakdown: async (): Promise<CategoryBreakdown[]> => {
    const response = await fetch(`${API_BASE_URL}/category-breakdown`);
    if (!response.ok) {
      throw new Error('Failed to fetch category breakdown');
    }
    return response.json();
  },
};
