import { Router, Response } from 'express';
import { db } from '../db';
import { stadiums, stadiumImages, availabilityRules } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest, authenticate, adminOnly } from '../middleware/auth';

const router = Router();

// Get the base URL for constructing full image URLs
const getBaseUrl = () => {
    // Use environment variable or default to localhost
    return process.env.BASE_URL || 'http://192.168.1.36:3000';
};

// Helper to convert relative image URLs to full URLs
const getFullImageUrl = (url: string): string => {
    if (!url) return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800';
    // If already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Convert relative path to full URL
    return `${getBaseUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
};

// GET /api/stadiums - List all stadiums
router.get('/', async (req, res) => {
    try {
        const allStadiums = await db.select().from(stadiums);

        // Get images for each stadium
        const stadiumsWithImages = await Promise.all(
            allStadiums.map(async (stadium) => {
                const images = await db.select().from(stadiumImages).where(eq(stadiumImages.stadiumId, stadium.id));
                const imageUrls = images.map(img => getFullImageUrl(img.url));
                return {
                    ...stadium,
                    images: imageUrls,
                    image: imageUrls[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
                };
            })
        );

        res.json(stadiumsWithImages);
    } catch (error) {
        console.error('Get stadiums error:', error);
        res.status(500).json({ error: 'Failed to get stadiums' });
    }
});

// GET /api/stadiums/:id - Get stadium details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [stadium] = await db.select().from(stadiums).where(eq(stadiums.id, id));
        if (!stadium) {
            return res.status(404).json({ error: 'Stadium not found' });
        }

        const images = await db.select().from(stadiumImages).where(eq(stadiumImages.stadiumId, id));
        const rules = await db.select().from(availabilityRules).where(eq(availabilityRules.stadiumId, id));
        const imageUrls = images.map(img => getFullImageUrl(img.url));

        res.json({
            ...stadium,
            images: imageUrls,
            image: imageUrls[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
            availabilityRules: rules,
        });
    } catch (error) {
        console.error('Get stadium error:', error);
        res.status(500).json({ error: 'Failed to get stadium' });
    }
});

// POST /api/stadiums - Create stadium (admin only)
router.post('/', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const {
            name, description, address, city, lat, lng,
            capacity, surface, type, pricePerHour, premiumMultiplier,
            isPremium, facilities, imageUrls
        } = req.body;

        if (!name || !pricePerHour) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const [newStadium] = await db.insert(stadiums).values({
            name,
            description,
            address,
            city,
            lat: lat || null,
            lng: lng || null,
            capacity: capacity || null,
            surface,
            type: type || 'outdoor',
            pricePerHour,
            premiumMultiplier: premiumMultiplier || 1.0,
            isPremium: isPremium || false,
            facilities: facilities || [],
        }).returning();

        // Add images if provided
        if (imageUrls && imageUrls.length > 0) {
            await db.insert(stadiumImages).values(
                imageUrls.map((url: string, index: number) => ({
                    stadiumId: newStadium.id,
                    url,
                    order: index,
                }))
            );
        }

        res.status(201).json(newStadium);
    } catch (error) {
        console.error('Create stadium error:', error);
        res.status(500).json({ error: 'Failed to create stadium' });
    }
});

// PUT /api/stadiums/:id - Update stadium (admin only)
router.put('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name, description, address, city, lat, lng,
            capacity, surface, type, pricePerHour, premiumMultiplier,
            isPremium, facilities
        } = req.body;

        const [updated] = await db.update(stadiums)
            .set({
                name,
                description,
                address,
                city,
                lat,
                lng,
                capacity,
                surface,
                type,
                pricePerHour,
                premiumMultiplier,
                isPremium,
                facilities,
            })
            .where(eq(stadiums.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Stadium not found' });
        }

        res.json(updated);
    } catch (error) {
        console.error('Update stadium error:', error);
        res.status(500).json({ error: 'Failed to update stadium' });
    }
});

// DELETE /api/stadiums/:id - Delete stadium (admin only)
router.delete('/:id', authenticate, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const [deleted] = await db.delete(stadiums)
            .where(eq(stadiums.id, id))
            .returning();

        if (!deleted) {
            return res.status(404).json({ error: 'Stadium not found' });
        }

        res.json({ message: 'Stadium deleted' });
    } catch (error) {
        console.error('Delete stadium error:', error);
        res.status(500).json({ error: 'Failed to delete stadium' });
    }
});

export default router;
