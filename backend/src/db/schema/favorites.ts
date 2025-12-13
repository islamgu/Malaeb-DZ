import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { stadiums } from './stadiums';

// Favorites table
export const favorites = pgTable('favorites', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    stadiumId: uuid('stadium_id').notNull().references(() => stadiums.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
    uniqueUserStadium: unique('unique_user_stadium_favorite').on(table.userId, table.stadiumId),
}));

// Types
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
