import { pgTable, uuid, text, timestamp, integer, doublePrecision, boolean, date, pgEnum } from 'drizzle-orm/pg-core';

// Stadium type enum
export const stadiumTypeEnum = pgEnum('stadium_type', ['indoor', 'outdoor']);

// Exception type enum
export const exceptionTypeEnum = pgEnum('exception_type', ['BLOCK', 'SPECIAL_PRICE']);

// Stadiums table
export const stadiums = pgTable('stadiums', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    address: text('address'),
    city: text('city'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    capacity: integer('capacity'),
    surface: text('surface'),
    type: stadiumTypeEnum('type').default('outdoor'),
    pricePerHour: doublePrecision('price_per_hour').notNull().default(0),
    premiumMultiplier: doublePrecision('premium_multiplier').notNull().default(1.0),
    isPremium: boolean('is_premium').notNull().default(false),
    // Store facilities as a JSON array for simplicity
    facilities: text('facilities').array(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Stadium Images table
export const stadiumImages = pgTable('stadium_images', {
    id: uuid('id').primaryKey().defaultRandom(),
    stadiumId: uuid('stadium_id').notNull().references(() => stadiums.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    altText: text('alt_text'),
    order: integer('order').notNull().default(0),
});

// Availability Rules (weekly recurring rules)
export const availabilityRules = pgTable('availability_rules', {
    id: uuid('id').primaryKey().defaultRandom(),
    stadiumId: uuid('stadium_id').notNull().references(() => stadiums.id, { onDelete: 'cascade' }),
    weekday: integer('weekday').notNull(), // 0 = Sunday .. 6 = Saturday
    startTime: text('start_time').notNull(), // "08:00"
    endTime: text('end_time').notNull(), // "22:00"
    isPremium: boolean('is_premium').notNull().default(false),
});

// Availability Exceptions (one-off blocks or special prices)
export const availabilityExceptions = pgTable('availability_exceptions', {
    id: uuid('id').primaryKey().defaultRandom(),
    stadiumId: uuid('stadium_id').notNull().references(() => stadiums.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    type: exceptionTypeEnum('type').notNull().default('BLOCK'),
    price: doublePrecision('price'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Types
export type Stadium = typeof stadiums.$inferSelect;
export type NewStadium = typeof stadiums.$inferInsert;
export type StadiumImage = typeof stadiumImages.$inferSelect;
export type NewStadiumImage = typeof stadiumImages.$inferInsert;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert;
export type AvailabilityException = typeof availabilityExceptions.$inferSelect;
export type NewAvailabilityException = typeof availabilityExceptions.$inferInsert;
