import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const getAdminCredentials = () => {
    const username = (process.env.ADMIN_USERNAME || 'admin').trim();
    const passwordEnv = (process.env.ADMIN_PASSWORD_HASH || 'admin123').trim();

    // If it's not a bcrypt hash (doesn't start with $), hash it now
    const passwordHash = passwordEnv.startsWith('$')
        ? passwordEnv
        : bcrypt.hashSync(passwordEnv, 10);

    return { username, passwordHash };
};

export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const { username: ADMIN_USERNAME, passwordHash: ADMIN_PASSWORD_HASH } = getAdminCredentials();
    const JWT_SECRET = process.env.JWT_SECRET || 'bhakti-bits-secret-key-2024';

    console.log(`Login attempt for username: ${username}`);

    if (username !== ADMIN_USERNAME) {
        console.log(`Invalid username. Expected: ${ADMIN_USERNAME}, Received: ${username}`);
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isPasswordValid) {
        console.log(`Invalid password for user: ${username}`);
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
