import express from 'express';

const router = express.Router();

const optimizeLatency = async (req, res, next) => {
    try {
        // Simulate data fetching with optimized query
        const data = await fetchDataOptimized();
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

// Example optimized function, replace with actual implementation
const fetchDataOptimized = async () => {
    // Implement data fetching logic here, use indexes, caching, etc.
    return { message: 'Data fetched successfully!' };
};

router.get('/optimized', optimizeLatency);

export default router;