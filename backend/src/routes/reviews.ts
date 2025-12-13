import { Router, Response } from 'express';
import { db } from '../db';
import { reviews, users } from '../db/schema';
import { eq, desc, avg } from 'drizzle-orm';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// GET /api/reviews/:stadiumId - Get reviews for a stadium
router.get('/:stadiumId', async (req, res) => {
    try {
        const { stadiumId } = req.params;

        const stadiumReviews = await db
            .select({
                id: reviews.id,
                rating: reviews.rating,
                comment: reviews.comment,
                createdAt: reviews.createdAt,
                userName: users.name,
                userEmail: users.email,
            })
            .from(reviews)
            .leftJoin(users, eq(reviews.userId, users.id))
            .where(eq(reviews.stadiumId, stadiumId))
            .orderBy(desc(reviews.createdAt));

        // Calculate average rating
        const [avgResult] = await db
            .select({ avgRating: avg(reviews.rating) })
            .from(reviews)
            .where(eq(reviews.stadiumId, stadiumId));

        res.json({
            reviews: stadiumReviews,
            averageRating: avgResult?.avgRating ? parseFloat(avgResult.avgRating) : null,
            totalReviews: stadiumReviews.length,
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Failed to get reviews' });
    }
});

// POST /api/reviews - Add a review
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { stadiumId, rating, comment } = req.body;

        if (!stadiumId || !rating) {
            return res.status(400).json({ error: 'Stadium ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check if user already reviewed this stadium
        const existing = await db
            .select()
            .from(reviews)
            .where(eq(reviews.stadiumId, stadiumId));

        const userReview = existing.find((r) => r.userId === req.user!.id);
        if (userReview) {
            // Update existing review
            const [updated] = await db
                .update(reviews)
                .set({ rating, comment, updatedAt: new Date() })
                .where(eq(reviews.id, userReview.id))
                .returning();
            return res.json(updated);
        }

        // Create new review
        const [newReview] = await db
            .insert(reviews)
            .values({
                stadiumId,
                userId: req.user!.id,
                rating,
                comment,
            })
            .returning();

        res.status(201).json(newReview);
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await db.delete(reviews).where(eq(reviews.id, id));

        res.json({ message: 'Review deleted' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

export default router;
