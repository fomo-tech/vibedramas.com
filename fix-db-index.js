import 'dotenv/config';
import mongoose from 'mongoose';

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibe-drama');
        console.log('Connected to DB');
        const db = mongoose.connection.db;
        // Drop the old index that causes the crash
        await db.collection('episodes').dropIndex('dramaId_1_episodeNumber_1').catch(e => console.log('Index maybe already dropped:', e.message));
        // Drop the duplicate episodes index that I created without episodeNumber if any
        // Since it's a test db, let's just drop the episodes collection so it crawls freshly with the new schema!
        await db.collection('episodes').deleteMany({});
        console.log('Cleared episodes collection and fixed indexes.');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
run();
