import { pgTable, uuid, timestamp, doublePrecision, boolean, pgEnum, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { stadiums } from './stadiums';

// Booking status enum
export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED']);

// Bookings table
export const bookings = pgTable('bookings', {
    id: uuid('id').primaryKey().defaultRandom(),
    stadiumId: uuid('stadium_id').notNull().references(() => stadiums.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    status: bookingStatusEnum('status').notNull().default('PENDING'),
    price: doublePrecision('price').notNull(),
    isPremium: boolean('is_premium').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    startBeforeEnd: check('start_before_end', sql`${table.startAt} < ${table.endAt}`),
}));

// Types
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
