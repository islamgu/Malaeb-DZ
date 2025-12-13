import { Router, Response } from 'express';
import { db } from '../db';
import { favorites, stadiums, stadiumImages } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// Get the base URL for constructing full image URLs
const getBaseUrl = () => {
    return process.env.BASE_URL || 'http://192.168.1.36:3000';
};

// Helper to convert relative image URLs to full URLs
const getFullImageUrl = (url: string): string => {
    if (!url) return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${getBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
};

// GET /api/favorites - Get user's favorites
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userFavorites = await db
            .select({
                id: favorites.id,
                stadiumId: favorites.stadiumId,
                createdAt: favorites.createdAt,
                stadiumName: stadiums.name,
                stadiumCity: stadiums.city,
                stadiumAddress: stadiums.address,
                stadiumPricePerHour: stadiums.pricePerHour,
                stadiumIsPremium: stadiums.isPremium,
                stadiumType: stadiums.type,
                stadiumCapacity: stadiums.capacity,
            })
            .from(favorites)
            .leftJoin(stadiums, eq(favorites.stadiumId, stadiums.id))
            .where(eq(favorites.userId, req.user!.id));

        // Get images for each stadium
        const favoritesWithImages = await Promise.all(
            userFavorites.map(async (fav) => {
                const images = await db
                    .select()
                    .from(stadiumImages)
                    .where(eq(stadiumImages.stadiumId, fav.stadiumId));
                const imageUrl = images[0]?.url;
                return {
                    ...fav,
                    image: imageUrl ? getFullImageUrl(imageUrl) : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
                };
            })
        );

        res.json(favoritesWithImages);
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'Failed to get favorites' });
    }
});

// POST /api/favorites - Add to favorites
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { stadiumId } = req.body;

        if (!stadiumId) {
            return res.status(400).json({ error: 'Stadium ID is required' });
        }

        // Check if already favorited
        const existing = await db
            .select()
            .from(favorites)
            .where(
                and(eq(favorites.userId, req.user!.id), eq(favorites.stadiumId, stadiumId))
            );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already in favorites' });
        }

        const [newFavorite] = await db
            .insert(favorites)
            .values({
                userId: req.user!.id,
                stadiumId,
            })
            .returning();

        res.status(201).json(newFavorite);
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
});

// DELETE /api/favorites/:stadiumId - Remove from favorites
router.delete('/:stadiumId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { stadiumId } = req.params;

        const [deleted] = await db
            .delete(favorites)
            .where(
                and(eq(favorites.userId, req.user!.id), eq(favorites.stadiumId, stadiumId))
            )
            .returning();

        if (!deleted) {
            return res.status(404).json({ error: 'Favorite not found' });
        }

        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
});

// GET /api/favorites/check/:stadiumId - Check if stadium is favorited
router.get('/check/:stadiumId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { stadiumId } = req.params;

        const existing = await db
            .select()
            .from(favorites)
            .where(
                and(eq(favorites.userId, req.user!.id), eq(favorites.stadiumId, stadiumId))
            );

        res.json({ isFavorite: existing.length > 0 });
    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({ error: 'Failed to check favorite' });
    }
});

export default router;
