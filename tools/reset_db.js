import mongoose from 'mongoose';
import { User, RSVP, AllowedGuest } from './server/models.js';
import connectDB from './server/config/db.js';

const reset = async () => {
    await connectDB();
    console.log('🗑️  Clearing Database...');

    await User.deleteMany({});
    console.log('✅ Users Cleared');

    await RSVP.deleteMany({});
    console.log('✅ RSVPs Cleared');

    await AllowedGuest.deleteMany({});
    console.log('✅ Whitelist Cleared');

    console.log('🔄 System ready for fresh seed (Restart Server)');
    process.exit(0);
};

reset();
