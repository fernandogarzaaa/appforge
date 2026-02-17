import express from 'express';
import { performance } from 'perf_hooks';

const router = express.Router();

// Middleware to log performance
router.use((req, res, next) => {
    const start = performance.now();
    res.on('finish', () => {
        const duration = performance.now() - start;
        console.log(`API Call to ${req.path} took ${duration.toFixed(2)}ms`);
    });
    next();
});

// Example optimized endpoint
router.get('/optimized-endpoint', async (req, res) => {
    // Simulate optimized operation
    const result = await someOptimizedFunction();
    res.json(result);
});

async function someOptimizedFunction() {
    // Implement caching or optimized database access here
    return { data: 'Optimized response' };
}

export default router;
