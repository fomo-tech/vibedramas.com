import 'dotenv/config';
import mongoose from 'mongoose';
import { syncDramas } from '../src/services/crawlerService';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibe-drama';

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Default to syncing 37 pages if run as script
    const total = await syncDramas(1, 37);

    console.log(`\n✅ Crawl Job Finished! Successfully synced ${total} dramas.`);
    process.exit(0);
}

run().catch((e) => {
    console.error('Fatal Error:', e);
    process.exit(1);
});
