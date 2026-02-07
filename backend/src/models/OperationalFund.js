import mongoose from 'mongoose';

const operationalFundSchema = new mongoose.Schema({
    fundType: {
        type: String,
        enum: ['API_TOKENS', 'INFRASTRUCTURE', 'DEV_GRANT'],
        default: 'API_TOKENS'
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        enum: ['SOL', 'USD', 'USDC'],
        default: 'SOL'
    },
    transactions: [{
        amount: Number,
        type: { type: String, enum: ['DEPOSIT', 'WITHDRAWAL'] },
        source: String, // e.g., "Subscription Revenue: sub_123"
        timestamp: { type: Date, default: Date.now }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Helper to add funds
operationalFundSchema.methods.addFunds = async function (amount, source) {
    this.balance += amount;
    this.transactions.push({
        amount,
        type: 'DEPOSIT',
        source
    });
    this.lastUpdated = Date.now();
    return this.save();
};

const OperationalFund = mongoose.model('OperationalFund', operationalFundSchema);

export default OperationalFund;
