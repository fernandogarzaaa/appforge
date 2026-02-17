import express from 'express';
import { performance } from 'perf_hooks';

const router = express.Router();

// Sample endpoint demonstrating performance optimization
router.get('/data', async (req, res) => {
    const start = performance.now();

    try {
        // Simulating optimized data retrieval
        const data = await getDataFromDatabase(); // Assume this is an optimized function

        const end = performance.now();
        const latency = end - start;
        console.log(`API latency: ${latency}ms`);

        res.status(200).json(data);
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function getDataFromDatabase() {
    // Implement caching or streaming to optimize database response
    // Let's assume this function returns the data in a performance-optimized manner
    return new Promise((resolve) => {
        setTimeout(() => resolve({ message: 'Data retrieved successfully!'}), 100); // Simulating fast retrieval
    });
}

export default router;
