import { Request, Response, NextFunction } from 'express';
import admin from '../firebase';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'USER' | 'ADMIN' | 'PREMIUM';
    };
    firebaseUid?: string;
}

// Verify Firebase ID token and attach user to request
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const email = decodedToken.email;

        if (!email) {
            return res.status(401).json({ error: 'Token does not contain an email' });
        }

        req.firebaseUid = decodedToken.uid;

        // Look up user in local DB by email
        const [dbUser] = await db.select().from(users).where(eq(users.email, email));

        if (dbUser) {
            req.user = {
                id: dbUser.id,
                email: dbUser.email,
                role: dbUser.role,
            };
        } else {
            // Auto-create user record if they authenticated via Firebase but don't exist in DB yet
            const [newUser] = await db.insert(users).values({
                email,
                name: decodedToken.name || null,
                role: 'USER',
                emailVerified: decodedToken.email_verified || false,
            }).returning();

            req.user = {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
            };
        }

        next();
    } catch (error: any) {
        console.error('Firebase auth error:', error.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Admin only middleware
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
