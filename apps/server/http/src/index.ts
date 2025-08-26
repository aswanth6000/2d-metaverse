import express from 'express'
import type{ Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import httpStatus from 'http-status';
import passport from 'passport'; // Import passport
import v1Routes from './routes/v1';
import { googleStrategy } from './config/passport'; // Import passport config
import { ApiError } from './utils/ApiError';
import { errorHandler } from './middlewares/errorMiddleware';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// --- Passport Configuration ---
passport.use(googleStrategy);

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000', // Adjust for your frontend URL
  credentials: true,
}));

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Initialize passport
app.use(passport.initialize());

// --- API Routes ---
app.use('/api/v1', v1Routes);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(httpStatus.OK).send('API is running!');
});

// Send back a 404 error for any unknown api request
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});
