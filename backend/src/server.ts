import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';

import authRoutes from './routes/auth';
import stadiumRoutes from './routes/stadiums';
import bookingRoutes from './routes/bookings';
import favoritesRoutes from './routes/favorites';
import reviewsRoutes from './routes/reviews';
import uploadRoutes from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stadiums', stadiumRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🏟️  Stadium Manager API running on http://localhost:${PORT}`);
    console.log(`📚 Endpoints:`);
    console.log(`   POST   /api/auth/sync (Firebase token)`);
    console.log(`   PATCH  /api/auth/verify-email`);
    console.log(`   GET    /api/auth/me`);
    console.log(`   GET    /api/stadiums`);
    console.log(`   GET    /api/stadiums/:id`);
    console.log(`   POST   /api/stadiums (admin)`);
    console.log(`   PUT    /api/stadiums/:id (admin)`);
    console.log(`   DELETE /api/stadiums/:id (admin)`);
    console.log(`   GET    /api/bookings`);
    console.log(`   GET    /api/bookings/all (admin)`);
    console.log(`   POST   /api/bookings`);
    console.log(`   PATCH  /api/bookings/:id/status (admin)`);
    console.log(`   GET    /api/favorites`);
    console.log(`   POST   /api/favorites`);
    console.log(`   DELETE /api/favorites/:stadiumId`);
    console.log(`   GET    /api/reviews/:stadiumId`);
    console.log(`   POST   /api/reviews`);
    console.log(`   POST   /api/upload/stadium/:stadiumId (admin)`);
});

export default app;
