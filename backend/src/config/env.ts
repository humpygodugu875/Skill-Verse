import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file at the backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
}

const validateAndLoadEnv = (): EnvConfig => {
  const requiredEnvs: (keyof EnvConfig)[] = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET',
  ];

  const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);

  if (missingEnvs.length > 0) {
    throw new Error(
      `FATAL CONFIGURATION ERROR: Missing required environment variables in .env: ${missingEnvs.join(', ')}`
    );
  }

  return {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    SUPABASE_URL: process.env.SUPABASE_URL as string,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
  };
};

export const env = validateAndLoadEnv();
