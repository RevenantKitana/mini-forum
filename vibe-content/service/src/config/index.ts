import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env từ service root, fallback sang backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../../backend/.env') });
}

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  forumApiUrl: process.env.FORUM_API_URL || 'http://localhost:5000/api',
  databaseUrl: process.env.DATABASE_URL || '',
  cron: {
    schedule: process.env.CRON_SCHEDULE || '*/30 * * * *',
    batchSize: parseInt(process.env.BATCH_SIZE || '1', 10),
  },
  limits: {
    maxPostsPerUserDay: parseInt(process.env.MAX_POSTS_PER_USER_DAY || '3', 10),
    maxCommentsPerUserDay: parseInt(process.env.MAX_COMMENTS_PER_USER_DAY || '6', 10),
    maxVotesPerUserDay: parseInt(process.env.MAX_VOTES_PER_USER_DAY || '15', 10),
    dailyLlmBudgetUsd: parseFloat(process.env.DAILY_LLM_BUDGET_USD || '0.50'),
  },
  llm: {
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    groqApiKey: process.env.GROQ_API_KEY || '',
    cerebrasApiKey: process.env.CEREBRAS_API_KEY || '',
    providerTimeoutMs: parseInt(process.env.PROVIDER_TIMEOUT_MS || '30000', 10),
  },
  botPassword: process.env.BOT_PASSWORD || 'BotUser@123',
};

export default config;
