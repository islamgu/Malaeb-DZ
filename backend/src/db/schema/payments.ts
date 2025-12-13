import { pgTable, uuid, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';
import { bookings } from './bookings';

// Payments table
export const payments = pgTable('payments', {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
    providerId: text('provider_id'), // External payment provider ID (e.g., Stripe intent ID)
    amount: doublePrecision('amount').notNull(),
    currency: text('currency').notNull().default('DZD'),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Types
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
