import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env từ service root, fallback sang backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../../backend/.env') });
}

// Validate required environment variables at startup
const requiredEnvVars = [
  'DATABASE_URL',
  'FORUM_API_URL',
  'BOT_PASSWORD',
  'GEMINI_API_KEY',
];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('   Copy vibe-content/.env.example to vibe-content/.env and fill in the values.');
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || '',
  forumApiUrl: process.env.FORUM_API_URL || 'http://localhost:5000/api/v1',
  databaseUrl: process.env.DATABASE_URL || '',
  cron: {
    schedule: process.env.CRON_SCHEDULE || '*/30 * * * *',
    batchSize: parseInt(process.env.BATCH_SIZE || '1', 10),
  },
  limits: {
    maxPostsPerUserDay: parseInt(process.env.MAX_POSTS_PER_USER_DAY || '3', 10),
    maxCommentsPerUserDay: parseInt(process.env.MAX_COMMENTS_PER_USER_DAY || '6', 10),
    maxVotesPerUserDay: parseInt(process.env.MAX_VOTES_PER_USER_DAY || '15', 10),
  },
  llm: {
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    beeknoeeApiKey: process.env.BEEKNOEE_API_KEY || '',
    groqApiKey: process.env.GROQ_API_KEY || '',
    cerebrasApiKey: process.env.CEREBRAS_API_KEY || '',
    nvidiaApiKey: process.env.NVIDIA_API_KEY || '',
    providerTimeoutMs: parseInt(process.env.PROVIDER_TIMEOUT_MS || '30000', 10),
  },
  botPassword: process.env.BOT_PASSWORD || '',
};

export default config;
