import mongoose from 'mongoose';
import { User, RSVP, AllowedGuest } from './server/models.js';
import connectDB from './server/config/db.js';

const clean = async () => {
    await connectDB();
    console.log('--- CLEAN START ---');

    console.log('Deleting all Users...');
    await User.deleteMany({});

    console.log('Deleting all Guests...');
    await AllowedGuest.deleteMany({});

    console.log('Deleting all RSVPs...');
    await RSVP.deleteMany({});

    console.log('--- CLEAN COMPLETE ---');
    process.exit(0);
};

clean();
