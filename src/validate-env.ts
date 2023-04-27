import { z } from 'zod';

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends z.infer<typeof ZodEnvironmentVariables> {}
  }
}

const ZodEnvironmentVariables = z.object({
  TOKEN: z.string(),
  // Poe.com reverse engineered API
  POE_COOKIE: z.string(),
  POE_QUORA_FORMKEY: z.string(),
  // Sentry error reporting
  SENTRY_DSN: z.string(),
  // MongoDB for database.
  MONGODB_URL: z.string(),
});

ZodEnvironmentVariables.parse(process.env);

console.log('✅ Environment variables verified!');
