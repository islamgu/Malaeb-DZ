import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest, authenticate, generateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register - Register with email and password
// Phone is optional. Frontend handles Firebase email verification.
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Validate password length
        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        // Check if user exists
        const existing = await db.select().from(users).where(eq(users.email, email));
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with hashed password
        const [newUser] = await db.insert(users).values({
            email,
            password: hashedPassword,
            name,
            phone: phone || null,
            role: 'USER',
            emailVerified: false,
        }).returning();

        const token = generateToken(newUser);

        res.status(201).json({
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                phone: newUser.phone,
                role: newUser.role,
                emailVerified: newUser.emailVerified,
            },
            token,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register' });
    }
});

// POST /api/auth/login - Login with email and password
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // For admin, check hardcoded credentials
        if (email === 'admin@gmail.com' && password === '1234') {
            const token = generateToken(user);
            return res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                    emailVerified: true, // Admin is always verified
                },
                token,
            });
        }

        // Verify password
        if (!user.password) {
            return res.status(401).json({ error: 'Invalid credentials. Please register first.' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                emailVerified: user.emailVerified,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
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

// GET /api/auth/me
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

export default router;
