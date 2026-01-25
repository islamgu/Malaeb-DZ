import { pgTable, uuid, text, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';

// User role enum
export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'PREMIUM']);

// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name'),
    phone: text('phone').unique(),
    password: text('password'),
    phoneVerified: boolean('phone_verified').default(false),
    role: userRoleEnum('role').notNull().default('USER'),
    facebookId: text('facebook_id').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

