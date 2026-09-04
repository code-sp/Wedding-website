import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { env } from './config/env.js';
import { User, Content } from './models.js';
import * as defaults from './defaults.js';
import { csrfProtection } from './middleware/csrf.js';

import sessionRoutes from './routes/sessionRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import seatRoutes from './routes/seatRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import rsvpRoutes from './routes/rsvpRoutes.js';
import guestRoutes from './routes/guestRoutes.js';
import clientRoutes from './routes/clientRoutes.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(csrfProtection);

if (!env.isProduction) {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

app.get('/ping', (_req, res) => res.send('pong'));

await connectDB();


app.use('/api', sessionRoutes);
app.use('/api', invitationRoutes);
app.use('/api', assetRoutes);
app.use('/api', seatRoutes);
app.use('/api', profileRoutes);
app.use('/api', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api', rsvpRoutes);
app.use('/api', guestRoutes);
app.use('/api', clientRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', db: 'mongodb' }));

const seed = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0 && !env.isProduction) {
      await User.create(defaults.defaultUsers.map((u) => ({ _id: u.id, ...u })));
    }

    const contentKeys = [
      { key: 'events', value: defaults.defaultEvents },
      { key: 'gallery', value: defaults.defaultGalleryPhotos },
      { key: 'moments', value: [] },
      { key: 'stories', value: defaults.defaultStories },
      { key: 'home_data', value: defaults.defaultHomeData },
      { key: 'contact_data', value: defaults.defaultContactData },
      { key: 'client_settings', value: defaults.defaultClientSettings },
      { key: 'family_people', value: [] },
      { key: 'family_families', value: [] },
      { key: 'family_links', value: [] },
      { key: 'groom_family_people', value: [] },
      { key: 'groom_family_families', value: [] },
      { key: 'groom_family_links', value: [] }
    ];

    if (!env.isProduction) {
      for (const item of contentKeys) {
        const exists = await Content.exists({ key: item.key, clientId: 'default_client' });
        if (!exists) await Content.create({ key: item.key, clientId: 'default_client', value: item.value });
      }
    }
  } catch (error) {
    console.error('Seed failed', error);
  }
};

await seed();

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
