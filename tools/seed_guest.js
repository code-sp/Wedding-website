import mongoose from 'mongoose';
import { AllowedGuest } from './server/models.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/wedding-rsvp';

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clean up previous test
        await AllowedGuest.deleteMany({ name: 'Verified Guest' });

        // Add verified guest
        await AllowedGuest.create({
            name: 'Verified Guest',
            isClaimed: false
        });

        console.log('Seeded "Verified Guest" into Allowed List.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seed();
