import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'bhakti-bits-secret-key-2024';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// Default password is 'admin123' hashed (in production use env)
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('admin123', 10);

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    console.log(username, password)

    if (username !== ADMIN_USERNAME) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { username: ADMIN_USERNAME, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        token,
        user: {
            username: ADMIN_USERNAME,
            role: 'admin'
        }
    });
};

export const verifyToken = (req: Request, res: Response) => {
    // This is just a helper to check if a token is still valid
    res.json({ valid: true, user: (req as any).user });
};
