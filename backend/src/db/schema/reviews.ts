import { pgTable, uuid, text, timestamp, integer, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { stadiums } from './stadiums';

// Reviews table
export const reviews = pgTable('reviews', {
    id: uuid('id').primaryKey().defaultRandom(),
    stadiumId: uuid('stadium_id').notNull().references(() => stadiums.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    ratingRange: check('rating_range', sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
}));

// Types
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
