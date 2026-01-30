import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function updateAdmin() {
    try {
        await sql`UPDATE users SET phone = '+213558099019' WHERE email = 'admin@gmail.com'`;
        console.log('✅ Admin phone number updated to +213558099019');

        // Verify the update
        const result = await sql`SELECT id, email, phone, role FROM users WHERE email = 'admin@gmail.com'`;
        console.log('Admin user:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

updateAdmin();
