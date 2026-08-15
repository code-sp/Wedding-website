import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { User, Content } from './models.js'; // Kept for seeding only
import * as defaults from './defaults.js';

import authRoutes from './routes/authRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import rsvpRoutes from './routes/rsvpRoutes.js';
import guestRoutes from './routes/guestRoutes.js';
import clientRoutes from './routes/clientRoutes.js';

const app = express();
const PORT = 3000;

// Debug Logging - VERY FIRST
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/ping', (req, res) => res.send('pong'));

// Security: Strict CORS
// Allows localhost:5173 (Dev) and potentially production domain later
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:5175'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connect to MongoDB
connectDB();

// --- ROUTES ---
app.use('/api', authRoutes); // /api/login, /api/users
app.use('/api/content', contentRoutes); // /api/content/:key
app.use('/api', rsvpRoutes); // /api/rsvp, /api/rsvps
app.use('/api', guestRoutes); // /api/guests
app.use('/api', clientRoutes); // /api/clients

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'mongodb' }));

// --- SEEDING LOGIC (Kept for simplicity, could be moved to utils) ---
const seed = async () => {
    try {
        // 1. Seed Users
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('Seeding Users...');
            await User.create(defaults.defaultUsers.map(u => ({
                _id: u.id,
                ...u
            })));
        }

        // 2. Seed Content (Granular Check)
        const contentKeys = [
            { key: 'events', value: defaults.defaultEvents },
            { key: 'gallery', value: defaults.defaultGalleryPhotos },
            { key: 'stories', value: defaults.defaultStories },
            { key: 'home_data', value: defaults.defaultHomeData },
            { key: 'family_people', value: [] },
            { key: 'family_families', value: [] },
            { key: 'family_links', value: [] },
            { key: 'groom_family_people', value: [] },
            { key: 'groom_family_families', value: [] },
            { key: 'groom_family_links', value: [] }
        ];

        for (const item of contentKeys) {
            const exists = await Content.exists({ key: item.key });
            if (!exists) {
                console.log(`Seeding Content: ${item.key}`);
                await Content.create({ key: item.key, value: item.value });
            }
        }
        console.log('Seeding Check Complete.');
    } catch (err) {
        console.error('Seeding Error:', err);
    }
};

setTimeout(seed, 1000);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
