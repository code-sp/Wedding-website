import mongoose from 'mongoose';
import { User, RSVP } from './server/models.js';
import connectDB from './server/config/db.js';

const debug = async () => {
    await connectDB();
    console.log('--- DEBUG START ---');

    const users = await User.find();
    console.log(`Users Found: ${users.length}`);
    users.forEach(u => console.log(`User: ${u.name} | ID: ${u._id} | Code: ${u.access_code} | Reg: ${u.is_registered}`));

    const rsvps = await RSVP.find();
    console.log(`RSVPs Found: ${rsvps.length}`);
    rsvps.forEach(r => console.log(`RSVP: ${JSON.stringify(r.data)} | UserID: ${r.userId} | ID: ${r._id}`));

    console.log('--- DEBUG END ---');
    process.exit(0);
};

debug();
