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
  // Poe.com reverse engineered API
  POE_COOKIE: z.string(), // Poe.com cookie
  POE_QUORA_FORMKEY: z.string(), // Poe.com Quora form key
  // Sentry error reporting
  SENTRY_DSN: z.string(), // Sentry DSN
  // MongoDB for database.
  MONGODB_URL: z.string(), // MongoDB URL
  // Slash commands
  GUILD_ID: z.string(), // Discord guild ID
  CLIENT_ID: z.string(), // Discord client ID
  // Discord bot owner
  OWNER_ID: z.string(), // Discord bot owner ID
  // Bing
  BING_COOKIE: z.string(), // Bing cookie
});

ZodEnvironmentVariables.parse(process.env);

logging.info('✅ Environment variables verified!');
