import mongoose from 'mongoose';
import { User, RSVP } from './server/models.js';
import connectDB from './server/config/db.js';

const testPopulate = async () => {
    await connectDB();
    console.log('--- POPULATE TEST ---');

    // Fetch with populate
    const rsvps = await RSVP.find().populate('userId');

    if (rsvps.length === 0) {
        console.log('No RSVPs found to test.');
    } else {
        rsvps.forEach(r => {
            console.log(`RSVP ID: ${r._id}`);
            console.log(`RSVP userId (Raw): ${r.userId}`); // Should be object if populated, or string/null if failed
            if (r.userId && r.userId.name) {
                console.log(`✅ Populated User: ${r.userId.name}`);
            } else {
                console.log(`❌ Failed to Populate User`);
            }
        });
    }

    console.log('--- TEST END ---');
    process.exit(0);
};

testPopulate();
