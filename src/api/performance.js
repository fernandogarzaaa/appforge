import express from 'express';
import { performance } from 'perf_hooks';

const router = express.Router();

const optimizeMiddleware = (req, res, next) => {
    // Start measuring performance
    const start = performance.now();

    res.on('finish', () => {
        const duration = performance.now() - start;
        console.log(`Request duration: ${duration.toFixed(2)} ms`);
    });
    next();
};

router.use(optimizeMiddleware);

router.get('/data', async (req, res) => {
    // Simulated data fetching with the intention to optimize
    try {
        const data = await fetchData();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const fetchData = async () => {
    // Here we could implement caching or optimized data retrieval logic
    // Simulating high latency for illustration
    await new Promise(resolve => setTimeout(resolve, 100));
    return { message: 'Data retrieved successfully' };
};

export default router;
