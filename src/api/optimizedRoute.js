import express from 'express';
import { getData } from './dataService.js';

const router = express.Router();

// Optimize route handling with asynchronous data retrievalouter.get('/data', async (req, res) => {
    try {
        // Fetch data asynchronously
        const data = await getData();
        // Return response
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;