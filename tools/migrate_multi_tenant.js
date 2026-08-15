import mongoose from 'mongoose';
import { User, Content } from './server/models.js';
import connectDB from './server/config/db.js';
import * as defaults from './server/defaults.js';

async function migrate() {
    try {
        await connectDB();
        console.log("Connected to MongoDB for migration...");

        const CLIENT_ID = 'default_client';

        // 1. Update existing Users
        const userUpdate = await User.updateMany(
            { clientId: { $exists: false } },
            { $set: { clientId: CLIENT_ID } }
        );
        console.log(`Updated ${userUpdate.modifiedCount} users.`);

        // 2. Update existing Content
        const contentUpdate = await Content.updateMany(
            { clientId: { $exists: false } },
            { $set: { clientId: CLIENT_ID } }
        );
        console.log(`Updated ${contentUpdate.modifiedCount} content records.`);

        // 3. Ensure Admin exists with correct role/clientId
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            admin.clientId = 'all'; // Global Admin
            await admin.save();
            console.log("Admin clientId set to 'all'");
        }

        // 4. Create default settings for the client
        const settingsExists = await Content.exists({ key: 'client_settings', clientId: CLIENT_ID });
        if (!settingsExists) {
            await Content.create({
                key: 'client_settings',
                clientId: CLIENT_ID,
                value: {
                    enabledTabs: ['home', 'story', 'events', 'gallery', 'moments', 'rsvp', 'contact', 'family_tree']
                }
            });
            console.log(`Created default settings for ${CLIENT_ID}`);
        }

        // 5. Ensure Client record exists
        const { Client, RSVP } = await import('./server/models.js');
        const clientObj = await Client.findById(CLIENT_ID);
        if (!clientObj) {
            await Client.create({ _id: CLIENT_ID, name: 'Default Client Wedding' });
            console.log(`Created Client record for ${CLIENT_ID}`);
        }

        // 6. Update RSVPs
        const rsvpUpdate = await RSVP.updateMany(
            { clientId: { $exists: false } },
            { $set: { clientId: CLIENT_ID } }
        );
        console.log(`Updated ${rsvpUpdate.modifiedCount} RSVPs.`);

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
