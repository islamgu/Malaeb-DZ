import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import 'dotenv/config';

import * as schema from './schema';
import * as relations from './relations';

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Create the Neon SQL client
const sql = neon(process.env.DATABASE_URL!);

// Create the Drizzle database instance with schema
export const db = drizzle(sql, {
    schema: { ...schema, ...relations }
});

// Export schema and types for convenience
export * from './schema';
export * from './relations';

