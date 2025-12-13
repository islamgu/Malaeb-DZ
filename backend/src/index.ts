import 'dotenv/config';
import { db } from './db';

async function main() {
    console.log('🏟️ Stadiums Manager Backend');
    console.log('Database connection configured.');

    // Test connection (will fail without valid DATABASE_URL)
    try {
        // This is just a placeholder - actual queries would go here
        console.log('✅ Ready to connect to Neon PostgreSQL');
        console.log('');
        console.log('Next steps:');
        console.log('1. Create .env file with your DATABASE_URL');
        console.log('2. Run: npm run db:push');
        console.log('3. Run: npm run db:studio');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
}

main();
