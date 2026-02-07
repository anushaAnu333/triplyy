import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import env from './config/environment';
import routes from './routes';
import errorHandler from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { languageMiddleware } from './middleware/language';
import logger from './utils/logger';

// Initialize Express app
const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow localhost on any port
      if (env.NODE_ENV === 'development') {
        if (!origin || origin.startsWith('http://localhost:') || origin === env.FRONTEND_URL) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      } else {
        // In production, only allow the configured frontend URL
        if (origin === env.FRONTEND_URL) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  })
);

// Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// Compression
app.use(compression());

// Language middleware
app.use(languageMiddleware);

// Rate limiting
app.use(`/api/${env.API_VERSION}`, apiLimiter);

// API Routes
app.use(`/api/${env.API_VERSION}`, routes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to TRIPLY API',
    version: env.API_VERSION,
    documentation: '/api/v1/docs',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Global error handler
app.use(errorHandler);

export default app;

