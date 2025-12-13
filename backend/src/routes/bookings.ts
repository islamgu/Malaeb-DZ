import { Router, Response } from 'express';
import { db } from '../db';
import { bookings, stadiums, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthRequest, authenticate, adminOnly } from '../middleware/auth';

const router = Router();

// GET /api/bookings - Get user's bookings
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userBookings = await db.select({
            id: bookings.id,
            stadiumId: bookings.stadiumId,
            startAt: bookings.startAt,
            endAt: bookings.endAt,
            status: bookings.status,
            price: bookings.price,
            isPremium: bookings.isPremium,
            createdAt: bookings.createdAt,
            stadiumName: stadiums.name,
            stadiumAddress: stadiums.address,
        })
            .from(bookings)
            .leftJoin(stadiums, eq(bookings.stadiumId, stadiums.id))
            .where(eq(bookings.userId, req.user!.id))
            .orderBy(desc(bookings.createdAt));

        res.json(userBookings);
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Failed to get bookings' });
    }
});

// GET /api/bookings/all - Get all bookings (admin only)
router.get('/all', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const allBookings = await db.select({
            id: bookings.id,
            stadiumId: bookings.stadiumId,
            userId: bookings.userId,
            startAt: bookings.startAt,
            endAt: bookings.endAt,
            status: bookings.status,
            price: bookings.price,
            isPremium: bookings.isPremium,
            createdAt: bookings.createdAt,
            stadiumName: stadiums.name,
            userName: users.name,
            userEmail: users.email,
        })
            .from(bookings)
            .leftJoin(stadiums, eq(bookings.stadiumId, stadiums.id))
            .leftJoin(users, eq(bookings.userId, users.id))
            .orderBy(desc(bookings.createdAt));

        res.json(allBookings);
    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({ error: 'Failed to get bookings' });
    }
});

// POST /api/bookings - Create booking
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { stadiumId, startAt, endAt, price, isPremium } = req.body;

        if (!stadiumId || !startAt || !endAt || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [newBooking] = await db.insert(bookings).values({
            stadiumId,
            userId: req.user!.id,
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            price,
            isPremium: isPremium || false,
            status: 'PENDING',
        }).returning();

        res.status(201).json(newBooking);
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// PATCH /api/bookings/:id/status - Update booking status (admin only)
router.patch('/:id/status', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const [updated] = await db.update(bookings)
            .set({ status, updatedAt: new Date() })
            .where(eq(bookings.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(updated);
    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Check if booking belongs to user or user is admin
        const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const [updated] = await db.update(bookings)
            .set({ status: 'CANCELLED', updatedAt: new Date() })
            .where(eq(bookings.id, id))
            .returning();

        res.json(updated);
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

export default router;
