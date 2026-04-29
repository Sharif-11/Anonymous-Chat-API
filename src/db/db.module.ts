import { Global, Module, OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas';

let dbPool: Pool | null = null;

@Global()
@Module({
  providers: [
    {
      provide: 'DRIZZLE',
      useFactory: async () => {
        dbPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 20, // Max connections in pool
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });

        // Test connection
        try {
          const client = await dbPool.connect();
          client.release();
          console.log('✅ Database connected successfully');
        } catch (error) {
          console.error('❌ Database connection failed:', error);
          throw error;
        }

        return drizzle(dbPool, { schema });
      },
    },
  ],
  exports: ['DRIZZLE'],
})
export class DbModule implements OnApplicationShutdown {
  async onApplicationShutdown(signal?: string) {
    // Close pool when app shuts down
    if (dbPool) {
      await dbPool.end();
      console.log('Database connection closed');
    }
  }
}
