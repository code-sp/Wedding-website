import mongoose from 'mongoose';
import { Content } from './server/models.js';
import connectDB from './server/config/db.js';

async function check() {
    await connectDB();
    const doc = await Content.findOne({ key: 'stories' });
    console.log('Stories:', JSON.stringify(doc?.value || [], null, 2));
    process.exit(0);
}

check();
