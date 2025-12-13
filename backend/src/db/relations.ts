import { relations } from 'drizzle-orm';
import { users } from './schema/users';
import { stadiums, stadiumImages, availabilityRules, availabilityExceptions } from './schema/stadiums';
import { bookings } from './schema/bookings';
import { reviews } from './schema/reviews';
import { favorites } from './schema/favorites';
import { payments } from './schema/payments';

// User relations
export const usersRelations = relations(users, ({ many }) => ({
    bookings: many(bookings),
    reviews: many(reviews),
    favorites: many(favorites),
}));

// Stadium relations
export const stadiumsRelations = relations(stadiums, ({ many }) => ({
    images: many(stadiumImages),
    availabilityRules: many(availabilityRules),
    availabilityExceptions: many(availabilityExceptions),
    bookings: many(bookings),
    reviews: many(reviews),
    favorites: many(favorites),
}));

// Stadium Images relations
export const stadiumImagesRelations = relations(stadiumImages, ({ one }) => ({
    stadium: one(stadiums, {
        fields: [stadiumImages.stadiumId],
        references: [stadiums.id],
    }),
}));

// Availability Rules relations
export const availabilityRulesRelations = relations(availabilityRules, ({ one }) => ({
    stadium: one(stadiums, {
        fields: [availabilityRules.stadiumId],
        references: [stadiums.id],
    }),
}));

// Availability Exceptions relations
export const availabilityExceptionsRelations = relations(availabilityExceptions, ({ one }) => ({
    stadium: one(stadiums, {
        fields: [availabilityExceptions.stadiumId],
        references: [stadiums.id],
    }),
}));

// Booking relations
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
    stadium: one(stadiums, {
        fields: [bookings.stadiumId],
        references: [stadiums.id],
    }),
    user: one(users, {
        fields: [bookings.userId],
        references: [users.id],
    }),
    payments: many(payments),
}));

// Review relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
    stadium: one(stadiums, {
        fields: [reviews.stadiumId],
        references: [stadiums.id],
    }),
    user: one(users, {
        fields: [reviews.userId],
        references: [users.id],
    }),
}));

// Favorite relations
export const favoritesRelations = relations(favorites, ({ one }) => ({
    user: one(users, {
        fields: [favorites.userId],
        references: [users.id],
    }),
    stadium: one(stadiums, {
        fields: [favorites.stadiumId],
        references: [stadiums.id],
    }),
}));

// Payment relations
export const paymentsRelations = relations(payments, ({ one }) => ({
    booking: one(bookings, {
        fields: [payments.bookingId],
        references: [bookings.id],
    }),
}));
