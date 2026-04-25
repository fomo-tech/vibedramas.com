import 'dotenv/config';
import mongoose from 'mongoose';
import Drama from './src/models/Drama.ts';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibe-drama');
  const drama = await Drama.findOne({ slug: 'that-cot' }).lean();
  console.log(JSON.stringify(drama.episodes, null, 2));
  process.exit(0);
};
run();
