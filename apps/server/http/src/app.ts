import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import httpStatus from 'http-status';
import { ApiError } from './utils/ApiError';
import v1Routes from './routes/v1';
import { googleStrategy } from './config/passport';
import { errorHandler } from './middlewares/errorMiddleware';


// --- Create Express App ---
const app: Express = express();

// --- Passport Configuration ---
passport.use(googleStrategy);

// --- Global Middlewares ---
// Set security HTTP headers
app.use(helmet());

// Enable CORS with specific options
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Initialize passport for authentication strategies
app.use(passport.initialize());

// --- API Routes ---
// Mount all v1 routes under /api/v1
app.use('/api/v1', v1Routes);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(httpStatus.OK).send('API is healthy and running!');
});

// --- Error Handling ---
// Handle 404 for any unknown API requests
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Use the centralized error handler for all other errors
app.use(errorHandler);

export default app;
