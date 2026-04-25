import 'dotenv/config';
import mongoose from 'mongoose';
import Drama from './src/models/Drama.ts';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibe-drama');
  
  const detailUrl = "https://ophim1.com/v1/api/phim/that-cot";
  const res = await fetch(detailUrl);
  const detailData = await res.json();
  const item = detailData.data.item;

  const dramaPayload = {
      name: item.name,
      slug: item.slug,
      episodes: item.episodes || [] 
  };

  let drama = await Drama.findOne({ slug: item.slug });
  if (drama) {
     Object.assign(drama, dramaPayload);
  } else {
     drama = new Drama(dramaPayload);
  }
  await drama.save();
  
  const saved = await Drama.findOne({ slug: item.slug }).lean();
  console.log("Saved episodes length:", saved?.episodes?.length);
  if (saved?.episodes?.length > 0) {
      console.log("Sample server_data:", JSON.stringify(saved.episodes[0].server_data[0]));
  } else {
      console.log("EPISODES NOT SAVED OR EMPTY!");
  }
  process.exit(0);
};
run();
