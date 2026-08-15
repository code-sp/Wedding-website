import mongoose from 'mongoose';
import { Content } from './server/models.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/wedding-rsvp';

const checkContent = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const count = await Content.countDocuments();
        console.log(`Total Content Documents: ${count}`);

        if (count > 0) {
            const all = await Content.find({}, { key: 1, _id: 0 });
            console.log('Keys found:', all.map(d => d.key));
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkContent();
