import { z } from 'zod';

import logging from './utils/logger';

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends z.infer<typeof ZodEnvironmentVariables> {}
  }
}

const ZodEnvironmentVariables = z.object({
  TOKEN: z.string(), // Discord bot token
  // Sentry error reporting
  SENTRY_DSN: z.string(), // Sentry DSN
  // MongoDB for database.
  MONGODB_URL: z.string(), // MongoDB URL
  // Slash commands
  CLIENT_ID: z.string(), // Discord client ID
  // Discord bot owner
  OWNER_USER_ID: z.string(), // Discord bot owner ID
  OWNER_GUILD_ID: z.string(), // Discord owner's guild ID
  // OpenAI
  OPENAI_BASE_URL: z.string().optional(), // OpenAI API host (https://api.openai.com)
  OPENAI_API_KEY: z.string(), // OpenAI API key
});

ZodEnvironmentVariables.parse(process.env);

logging.info('✅ Environment variables verified!');
