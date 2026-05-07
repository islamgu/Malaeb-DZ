import 'dotenv/config';
import { db } from './db';
import { users, bookings, favorites, reviews, payments } from './db/schema';

async function resetUsers() {
    console.log('🧹 Starting database user reset...\n');

    try {
        console.log('🗑️ Deleting all favorites...');
        await db.delete(favorites);

        console.log('🗑️ Deleting all reviews...');
        await db.delete(reviews);
        
        console.log('🗑️ Deleting all payments...');
        await db.delete(payments);

        console.log('🗑️ Deleting all bookings...');
        await db.delete(bookings);

        console.log('🗑️ Deleting all users...');
        await db.delete(users);

        console.log('\n✨ Database reset completed successfully!');
    } catch (error) {
        console.error('❌ Reset failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

resetUsers();
