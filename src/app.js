import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import githubRoutes from './routes/githubRoutes.js';
import { errorHandler, routeNotFound } from './middleware/errorMiddleware.js';
import { swaggerDocument } from './config/swagger.js';

const app = express();

// --- 1. Global Middleware Security & Standard Practices ---

// helmet helps secure the app by setting various HTTP headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing (CORS) for external frontends
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logger middleware using morgan
app.use(morgan('dev'));

// Parse incoming requests with JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static('public'));

// Global Rate Limiter to guard against DDoS or abuse (100 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', apiLimiter);

// --- 2. API Routes ---

// Base route for sanity check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the GitHub Profile Analyzer API! Explore documentation at /api-docs'
  });
});

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// GitHub profile analyzer routes
app.use('/api/github', githubRoutes);

// --- 3. Error and Fallback Handlers ---

// Route Not Found Handler
app.use(routeNotFound);

// Centralized error handling middleware
app.use(errorHandler);

export default app;
