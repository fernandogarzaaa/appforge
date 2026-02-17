import express from 'express';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';

const app = express();

// Enable gzip compression for faster response times
app.use(compression());

// Logging HTTP requests for better understanding of performance
app.use(morgan('tiny'));

// Rate limiting to reduce server load and improve performance
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.get('/api/data', (req, res) => {
  const response = { message: 'Hello, world!' };
  res.json(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
