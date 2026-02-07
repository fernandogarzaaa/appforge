import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'expired', 'past_due'],
        default: 'active'
    },
    paymentMethod: {
        type: String,
        enum: ['solana_wallet', 'stripe', 'base44'],
        default: 'solana_wallet'
    },
    transactionSignature: {
        type: String,
        unique: true, // Prevent double-spending with same signature
        sparse: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    amountPaid: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'SOL'
    },
    autoRenew: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
