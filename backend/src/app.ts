import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import { sendSuccess } from './utils/responses';
import { globalErrorHandler } from './middlewares/error.middleware';
import authRouter from './routes/auth.routes';
import goalsRouter from './routes/goals.routes';
import roadmapsRouter from './routes/roadmaps.routes';
import progressRouter from './routes/progress.routes';

const app = express();

// 1. Trust proxy if behind a load balancer (Vercel, AWS ALB, Nginx)
app.set('trust proxy', 1);

// 2. Global Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Request Logging Middleware (Morgan piped into Winston)
const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
app.use(
  morgan(
    env.NODE_ENV === 'development'
      ? ':method :url :status :response-time ms - :res[content-length]'
      : ':remote-addr - :method :url :status :response-time ms',
    { stream: morganStream }
  )
);

// 5. API Routes
app.use('/api/auth', authRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/roadmaps', roadmapsRouter);
app.use('/api/progress', progressRouter);


// 6. System Health Check Route
app.get('/health', (_req, res) => {
  const healthInfo = {
    uptime: process.uptime(),
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  };
  return sendSuccess(res, healthInfo, 200);
});

// 6. Catch-all: Route Not Found
app.use('*', (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// 7. Global Exception Handlers
app.use(globalErrorHandler);

export default app;
