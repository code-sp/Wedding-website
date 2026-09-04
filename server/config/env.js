import 'dotenv/config';

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/wedding-rsvp'),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  sessionSecret: required('SESSION_SECRET', process.env.NODE_ENV === 'production' ? undefined : 'dev-only-change-me-please-32-characters'),
  accessTokenTtlMinutes: Number(process.env.ACCESS_TOKEN_TTL_MINUTES || 15),
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30),
  isProduction: process.env.NODE_ENV === 'production'
};
