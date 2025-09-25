const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = 3001;

// Middleware
app.use(express.json());

app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:8083"],  // frontend URLs
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


// MongoDB connection
mongoose.connect('mongodb://localhost:27017/budgettracking')
.then(() => {
    console.log('Connected to MongoDB');
    // Start server only after successful connection
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
})
.catch(err => console.error('MongoDB connection error:', err));

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 200
    }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

// API Endpoints

// Get all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .sort({ date: -1 })
            .limit(10); // Get last 10 transactions
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching transactions' });
    }
});

// Get monthly overview data
app.get('/api/monthly-overview', async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyData = await Transaction.aggregate([
            {
                $match: {
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$date' },
                        year: { $year: '$date' }
                    },
                    income: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
                        }
                    },
                    expenses: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
                        }
                    }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedData = monthlyData.map(item => ({
            month: months[item._id.month - 1],
            income: item.income,
            expenses: item.expenses
        }));

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching monthly overview' });
    }
});

// Get category breakdown
app.get('/api/category-breakdown', async (req, res) => {
    try {
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

        const categoryData = await Transaction.aggregate([
            {
                $match: {
                    type: 'expense',
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: '$category',
                    value: { $sum: '$amount' }
                }
            }
        ]);

        // Add colors to categories
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
        const formattedData = categoryData.map((item, index) => ({
            name: item._id,
            value: item.value,
            color: colors[index % colors.length]
        }));

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching category breakdown' });
    }
});

// Get stats overview
app.get('/api/stats', async (req, res) => {
    try {
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

        const [totalBalance, monthlyStats] = await Promise.all([
            Transaction.aggregate([
                {
                    $group: {
                        _id: null,
                        balance: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$type', 'income'] },
                                    '$amount',
                                    { $multiply: ['$amount', -1] }
                                ]
                            }
                        }
                    }
                }
            ]),
            Transaction.aggregate([
                {
                    $match: {
                        date: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' }
                    }
                }
            ])
        ]);

        const monthlyIncome = monthlyStats.find(stat => stat._id === 'income')?.total || 0;
        const monthlyExpenses = monthlyStats.find(stat => stat._id === 'expense')?.total || 0;
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) : '0.0';

        res.json({
            totalBalance: (totalBalance[0]?.balance || 0).toFixed(2),
            monthlyIncome: monthlyIncome.toFixed(2),
            monthlyExpenses: monthlyExpenses.toFixed(2),
            savingsRate
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stats' });
    }
});

// Add new transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const { type, amount, category, date, description } = req.body;

        console.log('POST /api/transactions hit with body:', req.body); // Debug log

        // Validate input
        if (!type || !amount || !category || !date || !description) {
            console.log('Validation failed: Missing fields');
            return res.status(400).json({ error: 'All fields are required' });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            console.log('Validation failed: Invalid amount');
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            console.log('Validation failed: Invalid date');
            return res.status(400).json({ error: 'Date must be a valid date' });
        }

        if (type !== 'income' && type !== 'expense') {
            console.log('Validation failed: Invalid type');
            return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
        }

        if (description.length > 200) {
            console.log('Validation failed: Description too long');
            return res.status(400).json({ error: 'Description must not exceed 200 characters' });
        }

        const transaction = new Transaction({
            type,
            amount: parsedAmount,
            category,
            date: parsedDate,
            description
        });

        await transaction.save();
        console.log('Transaction saved successfully:', transaction._id);
        res.status(201).json(transaction);
    } catch (error) {
        console.error('Error in POST /api/transactions:', error); // Debug log
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error creating transaction' }); // Changed to 500 for non-validation errors
    }
});

// Bulk add transactions from Excel
app.post('/api/transactions/bulk', async (req, res) => {
    try {
        const { transactions } = req.body;

        console.log('POST /api/transactions/bulk hit with:', transactions.length, 'transactions');

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({ error: 'Transactions array is required and cannot be empty' });
        }

        const results = {
            success: [],
            errors: []
        };

        // Process each transaction
        for (let i = 0; i < transactions.length; i++) {
            const transactionData = transactions[i];
            
            try {
                // Validate required fields
                if (!transactionData.type || !transactionData.amount || !transactionData.category || !transactionData.date || !transactionData.description) {
                    results.errors.push({
                        index: i,
                        error: 'Missing required fields',
                        data: transactionData
                    });
                    continue;
                }

                // Validate transaction type
                if (transactionData.type !== 'income' && transactionData.type !== 'expense') {
                    results.errors.push({
                        index: i,
                        error: 'Invalid type. Must be "income" or "expense"',
                        data: transactionData
                    });
                    continue;
                }

                // Validate amount
                const parsedAmount = parseFloat(transactionData.amount);
                if (isNaN(parsedAmount) || parsedAmount < 0) {
                    results.errors.push({
                        index: i,
                        error: 'Invalid amount. Must be a positive number',
                        data: transactionData
                    });
                    continue;
                }

                // Validate date
                const parsedDate = new Date(transactionData.date);
                if (isNaN(parsedDate.getTime())) {
                    results.errors.push({
                        index: i,
                        error: 'Invalid date format',
                        data: transactionData
                    });
                    continue;
                }

                // Validate description length
                if (transactionData.description.length > 200) {
                    results.errors.push({
                        index: i,
                        error: 'Description must not exceed 200 characters',
                        data: transactionData
                    });
                    continue;
                }

                // Create transaction
                const transaction = new Transaction({
                    type: transactionData.type,
                    amount: parsedAmount,
                    category: transactionData.category,
                    date: parsedDate,
                    description: transactionData.description
                });

                const savedTransaction = await transaction.save();
                results.success.push({
                    index: i,
                    transaction: savedTransaction
                });

                console.log(`Transaction ${i + 1} saved successfully:`, savedTransaction._id);

            } catch (error) {
                console.error(`Error processing transaction ${i + 1}:`, error);
                results.errors.push({
                    index: i,
                    error: error.message || 'Unknown error',
                    data: transactionData
                });
            }
        }

        console.log(`Bulk upload completed: ${results.success.length} successful, ${results.errors.length} errors`);

        res.status(200).json({
            message: `Bulk upload completed: ${results.success.length} successful, ${results.errors.length} errors`,
            successCount: results.success.length,
            errorCount: results.errors.length,
            results: results
        });

    } catch (error) {
        console.error('Error in POST /api/transactions/bulk:', error);
        res.status(500).json({ error: 'Error processing bulk transactions' });
    }
});