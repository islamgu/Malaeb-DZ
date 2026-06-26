import { Router, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest, authenticate } from '../middleware/auth';
import admin from '../firebase';

const router = Router();

// POST /api/auth/sync - Sync Firebase user with local database
// Called after Firebase sign-up or sign-in to ensure the user exists in the local DB
router.post('/sync', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { name, phone } = req.body;
        const email = req.user!.email;

        // Check if user already exists
        const [existingUser] = await db.select().from(users).where(eq(users.email, email));

        if (existingUser) {
            // Update name/phone if provided
            if (name || phone) {
                const [updatedUser] = await db.update(users)
                    .set({
                        ...(name && { name }),
                        ...(phone && { phone }),
                    })
                    .where(eq(users.id, existingUser.id))
                    .returning();

                return res.json({
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    role: updatedUser.role,
                    emailVerified: updatedUser.emailVerified,
                });
            }

            return res.json({
                id: existingUser.id,
                email: existingUser.email,
                name: existingUser.name,
                phone: existingUser.phone,
                role: existingUser.role,
                emailVerified: existingUser.emailVerified,
            });
        }

        // Create new user record
        const [newUser] = await db.insert(users).values({
            email,
            name: name || null,
            phone: phone || null,
            role: 'USER',
            emailVerified: false,
        }).returning();

        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            phone: newUser.phone,
            role: newUser.role,
            emailVerified: newUser.emailVerified,
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Failed to sync user' });
    }
});

// PATCH /api/auth/verify-email - Mark user email as verified
router.patch('/verify-email', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const [updatedUser] = await db.update(users)
            .set({ emailVerified: true })
            .where(eq(users.id, req.user!.id))
            .returning();

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            phone: updatedUser.phone,
            role: updatedUser.role,
            emailVerified: updatedUser.emailVerified,
        });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            emailVerified: user.emailVerified,
        });
    } catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// DELETE /api/auth/account - Permanently delete the authenticated user's account
// Removes the Firebase Auth user and the local DB record (cascades to the user's
// bookings, favorites, reviews and payments). Required by Google Play policy for
// apps that let users create an account.
router.delete('/account', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Delete the Firebase Auth user using the uid from the verified token
        if (req.firebaseUid) {
            try {
                await admin.auth().deleteUser(req.firebaseUid);
            } catch (fbError: any) {
                // If the Firebase user is already gone, continue with DB cleanup
                if (fbError?.code !== 'auth/user-not-found') {
                    console.error('Firebase delete error:', fbError);
                }
            }
        }

        // Delete the local DB record (cascades to bookings, favorites, reviews, payments)
        await db.delete(users).where(eq(users.id, req.user!.id));

        res.json({ success: true });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

export default router;
