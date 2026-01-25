import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, or } from 'drizzle-orm';
import { AuthRequest, authenticate, generateToken } from '../middleware/auth';

const router = Router();

// Validate Algerian phone number format: +213 followed by 5, 6, or 7 and 8 more digits
const isValidAlgerianPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    return /^\+213[567]\d{8}$/.test(cleaned);
};

// Normalize phone number (remove spaces, ensure +213 prefix)
const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/\s/g, '');
    // Handle case where user enters 0 instead of +213
    if (cleaned.startsWith('0')) {
        cleaned = '+213' + cleaned.substring(1);
    }
    // Handle case where user enters just the number without +
    if (!cleaned.startsWith('+')) {
        cleaned = '+213' + cleaned;
    }
    return cleaned;
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user exists by email
        const existingByEmail = await db.select().from(users).where(eq(users.email, email));
        if (existingByEmail.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // If phone is provided, validate and check if it exists
        let normalizedPhone: string | null = null;
        if (phone) {
            normalizedPhone = normalizePhone(phone);
            if (!isValidAlgerianPhone(normalizedPhone)) {
                return res.status(400).json({
                    error: 'Invalid Algerian phone number. Format: +213 5XX XXX XXX or +213 6XX XXX XXX or +213 7XX XXX XXX'
                });
            }
            const existingByPhone = await db.select().from(users).where(eq(users.phone, normalizedPhone));
            if (existingByPhone.length > 0) {
                return res.status(400).json({ error: 'Phone number already registered' });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with proper password field
        const [newUser] = await db.insert(users).values({
            email,
            name,
            phone: normalizedPhone,
            password: hashedPassword,
            phoneVerified: false,
            role: 'USER',
        }).returning();

        const token = generateToken(newUser);

        res.status(201).json({
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                phone: newUser.phone,
                phoneVerified: newUser.phoneVerified,
                role: newUser.role,
            },
            token,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Failed to register' });
    }
});

// POST /api/auth/login
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
                    phoneVerified: user.phoneVerified,
                    role: user.role,
                },
                token,
            });
        }

        // For regular users, verify password (check both new password field and legacy phone field)
        const passwordToCheck = user.password || user.phone || '';
        const isValid = await bcrypt.compare(password, passwordToCheck);
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
                phoneVerified: user.phoneVerified,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// POST /api/auth/send-otp - Request OTP for phone verification
// Note: In production, this would integrate with Firebase Admin SDK or Twilio
router.post('/send-otp', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhone(phone);
        if (!isValidAlgerianPhone(normalizedPhone)) {
            return res.status(400).json({
                error: 'Invalid Algerian phone number. Format: +213 5XX XXX XXX'
            });
        }

        // Check if phone is already used by another user
        const existingUser = await db.select().from(users).where(eq(users.phone, normalizedPhone));
        if (existingUser.length > 0 && existingUser[0].id !== req.user!.id) {
            return res.status(400).json({ error: 'Phone number already registered to another account' });
        }

        // In production, this would trigger Firebase/Twilio to send OTP
        // For now, we just return success - OTP will be handled client-side via Firebase
        res.json({
            success: true,
            message: 'OTP request initiated. Use Firebase client SDK to complete verification.',
            phone: normalizedPhone
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// POST /api/auth/verify-phone - Verify phone after Firebase OTP verification
router.post('/verify-phone', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { phone, firebaseUid } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhone(phone);
        if (!isValidAlgerianPhone(normalizedPhone)) {
            return res.status(400).json({ error: 'Invalid Algerian phone number' });
        }

        // Update user's phone and mark as verified
        const [updatedUser] = await db.update(users)
            .set({
                phone: normalizedPhone,
                phoneVerified: true
            })
            .where(eq(users.id, req.user!.id))
            .returning();

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                phone: updatedUser.phone,
                phoneVerified: updatedUser.phoneVerified,
                role: updatedUser.role,
            }
        });
    } catch (error) {
        console.error('Verify phone error:', error);
        res.status(500).json({ error: 'Failed to verify phone' });
    }
});

// POST /api/auth/phone-login - Login with verified phone number
router.post('/phone-login', async (req, res) => {
    try {
        const { phone, firebaseIdToken } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhone(phone);

        // In production, verify firebaseIdToken with Firebase Admin SDK
        // For now, we trust the client-side Firebase verification

        // Find user by phone
        const [user] = await db.select().from(users).where(eq(users.phone, normalizedPhone));

        if (!user) {
            return res.status(404).json({ error: 'No account found with this phone number' });
        }

        if (!user.phoneVerified) {
            return res.status(403).json({ error: 'Phone number not verified' });
        }

        const token = generateToken(user);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                phoneVerified: user.phoneVerified,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Phone login error:', error);
        res.status(500).json({ error: 'Failed to login with phone' });
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
            phoneVerified: user.phoneVerified,
            role: user.role,
        });
    } catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;
