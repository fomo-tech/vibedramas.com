import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Redis from "ioredis";
import Drama from "../src/models/Drama";
import Episode from "../src/models/Episode";
import HeroSlide from "../src/models/HeroSlide";

const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({
  path:
    nodeEnv === "production"
      ? [".env.production.local", ".env.production", ".env.local", ".env"]
      : [".env.development.local", ".env.local", ".env.development", ".env"],
});

type CrawledEpisode = {
  id: number | string;
  episodeNum: number;
  videoDuration?: number;
  external_audio_h264_m3u8?: string;
  subtitle_vtt?: string;
  subtitle_srt?: string;
  hasVietnameseAudio?: boolean;
  videoUrl?: Record<string, string>;
};

type CrawledSeries = {
  id: number | string;
  shortPlayCode?: number | string;
  name?: string;
  summary?: string;
  cover?: string;
  totalEpisodes?: number;
  episodes?: CrawledEpisode[];
};

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const sourceArgIndex = args.indexOf("--source");
const sourcePath = path.resolve(
  sourceArgIndex >= 0
    ? args[sourceArgIndex + 1] || ""
    : "video-crawl/data/series.json",
);
const episodeBatchSize = 500;

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "phim-ngan";
}

function pickStreamUrl(episode: CrawledEpisode): string {
  const urls = episode.videoUrl || {};
  const fullHdUrl = cleanText(urls.video_1080);
  if (fullHdUrl) return fullHdUrl;

  const h264Url = cleanText(episode.external_audio_h264_m3u8);
  if (h264Url) return h264Url;

  return cleanText(urls.video_720 || urls.video_480);
}

function sourceYear(cover: string): number {
  const match = cover.match(/(?:^|\/)(20\d{2})(?:\/|\b)/);
  return match ? Number(match[1]) : new Date().getFullYear();
}

function isVietnameseDubbedSeries(item: CrawledSeries): boolean {
  const name = cleanText(item.name).toLowerCase();
  return (
    name.includes("lồng tiếng") ||
    name.includes("long tieng") ||
    (item.episodes || []).every((episode) => episode.hasVietnameseAudio === true)
  );
}

function readSeries(): CrawledSeries[] {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Không tìm thấy file nguồn: ${sourcePath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error("File nguồn phải là một mảng series.json");
  }

  return parsed as CrawledSeries[];
}

function validateSeries(series: CrawledSeries[]): void {
  const seriesIds = new Set<string>();
  const slugs = new Set<string>();
  let episodeCount = 0;
  let incompleteLanguageCount = 0;

  for (const item of series) {
    const seriesId = String(item.id ?? "").trim();
    if (!seriesId) {
      throw new Error(`Series có id không hợp lệ: ${JSON.stringify(item)}`);
    }
    if (seriesIds.has(seriesId)) {
      throw new Error(`Trùng series id: ${seriesId}`);
    }
    seriesIds.add(seriesId);

    const name = cleanText(item.name);
    const cover = cleanText(item.cover);
    const episodes = Array.isArray(item.episodes) ? item.episodes : [];
    if (!name || !cover || !cleanText(item.summary)) {
      throw new Error(`Series ${seriesId} thiếu name, cover hoặc summary`);
    }
    if (!/^https?:\/\//i.test(cover)) {
      throw new Error(`Series ${seriesId} có cover không phải URL HTTP`);
    }
    if (episodes.length === 0) {
      throw new Error(`Series ${seriesId} không có tập phim`);
    }
    if (
      Number.isInteger(item.totalEpisodes) &&
      Number(item.totalEpisodes) < episodes.length
    ) {
      throw new Error(
        `Series ${seriesId} lệch tổng tập: totalEpisodes=${item.totalEpisodes}, thực tế=${episodes.length}`,
      );
    }

    const slug = `${slugify(name)}-${seriesId}`;
    if (slugs.has(slug)) throw new Error(`Trùng slug sau chuẩn hoá: ${slug}`);
    slugs.add(slug);

    const episodeNums = new Set<number>();
    const seriesHasVietnameseAudio = isVietnameseDubbedSeries(item);
    for (const episode of episodes) {
      if (!Number.isInteger(episode.episodeNum) || episode.episodeNum <= 0) {
        throw new Error(`Series ${seriesId} có episodeNum không hợp lệ`);
      }
      if (episodeNums.has(episode.episodeNum)) {
        throw new Error(
          `Series ${seriesId} trùng số tập: ${episode.episodeNum}`,
        );
      }
      episodeNums.add(episode.episodeNum);

      const streamUrl = pickStreamUrl(episode);
      if (!/^https?:\/\//i.test(streamUrl)) {
        throw new Error(
          `Series ${seriesId}, tập ${episode.episodeNum} thiếu videoUrl hợp lệ`,
        );
      }
      const hasVietnameseSubtitle = Boolean(
        cleanText(episode.subtitle_vtt) || cleanText(episode.subtitle_srt),
      );
      if (!seriesHasVietnameseAudio && !hasVietnameseSubtitle) {
        incompleteLanguageCount += 1;
      }
      episodeCount += 1;
    }
  }

  console.log(
    `✅ Dữ liệu hợp lệ: ${series.length} phim, ${episodeCount} tập.`,
  );
  if (incompleteLanguageCount > 0) {
    console.warn(
      `⚠️ ${incompleteLanguageCount} tập chưa có tiếng Việt/sub Việt sẽ vẫn được lưu DB nhưng bị API công khai lọc khỏi feed.`,
    );
  }
}

function buildDramaDocuments(series: CrawledSeries[]) {
  return series.map((item) => {
    const name = cleanText(item.name);
    const summary = cleanText(item.summary);
    const cover = cleanText(item.cover);
    const episodes = item.episodes || [];
    const totalEpisodes = item.totalEpisodes || episodes.length;

    return {
      name,
      slug: `${slugify(name)}-${item.id}`,
      origin_name: name,
      alternative_names: [],
      content: summary,
      type: "series",
      status: "completed",
      thumb_url: cover,
      poster_url: cover,
      is_copyright: false,
      sub_docquyen: false,
      chieurap: false,
      trailer_url: "",
      time: "",
      episode_current: String(episodes.length),
      episode_total: String(totalEpisodes),
      quality: "HD",
      lang: isVietnameseDubbedSeries(item)
        ? "Lồng tiếng Việt"
        : episodes.some(
              (episode) =>
                cleanText(episode.subtitle_vtt) || cleanText(episode.subtitle_srt),
            )
          ? "Vietsub"
          : "Chưa có tiếng Việt",
      year: sourceYear(cover),
      view: 0,
      actor: [],
      director: [],
      category: [
        { id: "dramarush", name: "Phim ngắn", slug: "phim-ngan" },
      ],
      country: [],
      likes: 0,
      isTrending: false,
    };
  });
}

function buildEpisodeDocuments(
  series: CrawledSeries[],
  dramaIds: mongoose.Types.ObjectId[],
) {
  return series.flatMap((item, seriesIndex) =>
    (item.episodes || [])
      .slice()
      .sort((a, b) => a.episodeNum - b.episodeNum)
      .filter(
        (episode) =>
          isVietnameseDubbedSeries(item) ||
          Boolean(episode.hasVietnameseAudio) ||
          Boolean(cleanText(episode.subtitle_vtt)) ||
          Boolean(cleanText(episode.subtitle_srt)),
      )
      .map((episode) => ({
        dramaId: dramaIds[seriesIndex],
        server_name: "DramaRush",
        name: String(episode.episodeNum),
        slug: `tap-${episode.episodeNum}`,
        filename: `Tập ${episode.episodeNum}`,
        // Existing players expect one HLS URL in link_m3u8. Prefer the
        // explicit Full HD source, then fall back to compatible H.264/720p.
        link_embed: "",
        link_m3u8: pickStreamUrl(episode),
        subtitle_vtt: cleanText(episode.subtitle_vtt),
        subtitle_srt: cleanText(episode.subtitle_srt),
        has_vietnamese_audio:
          isVietnameseDubbedSeries(item) || Boolean(episode.hasVietnameseAudio),
        likeCount: 0,
      })),
  );
}

async function clearDramaCaches(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log("⚠️ REDIS_URL chưa có; bỏ qua xoá cache Redis.");
    return;
  }

  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    connectTimeout: 5_000,
  });

  try {
    await redis.connect();
    const patterns = [
      "feed:guest:v1",
      "feed:guest:v2:vi-playback",
      "public:dramas:*",
      "drama:slug:*",
    ];
    for (const pattern of patterns) {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) await redis.del(...keys);
      } while (cursor !== "0");
    }
    console.log("✅ Đã xoá cache danh sách/chi tiết phim trên Redis.");
  } catch (error) {
    console.warn(
      `⚠️ Không xoá được cache Redis: ${error instanceof Error ? error.message : error}`,
    );
  } finally {
    await redis.quit().catch(() => undefined);
  }
}

async function importData(series: CrawledSeries[]): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Thiếu MONGODB_URI. Hãy cấu hình .env.local hoặc truyền biến môi trường trước khi chạy --apply.",
    );
  }

  await mongoose.connect(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 120_000,
  });

  const [beforeDramas, beforeEpisodes, beforeHeroSlides] = await Promise.all([
    Drama.countDocuments(),
    Episode.countDocuments(),
    HeroSlide.countDocuments(),
  ]);
  console.log(
    `📦 Trước khi thay: ${beforeDramas} phim, ${beforeEpisodes} tập, ${beforeHeroSlides} hero slide.`,
  );

  const dramaDocs = buildDramaDocuments(series);
  const dramaIds = dramaDocs.map(() => new mongoose.Types.ObjectId());
  const episodeDocs = buildEpisodeDocuments(series, dramaIds);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        await Promise.all([
          Episode.deleteMany({}, { session }),
          Drama.deleteMany({}, { session }),
          // Hero slides reference old Drama ids; clear those stale references.
          HeroSlide.deleteMany({}, { session }),
        ]);

        await Drama.insertMany(
          dramaDocs.map((doc, index) => ({ ...doc, _id: dramaIds[index] })),
          { session, ordered: true },
        );

        for (let offset = 0; offset < episodeDocs.length; offset += episodeBatchSize) {
          await Episode.insertMany(
            episodeDocs.slice(offset, offset + episodeBatchSize),
            { session, ordered: true },
          );
          console.log(
            `  Đã nạp ${Math.min(offset + episodeBatchSize, episodeDocs.length)}/${episodeDocs.length} tập...`,
          );
        }
      },
      {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        maxCommitTimeMS: 120_000,
      },
    );
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }

  await mongoose.connect(uri, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 10_000,
  });
  const [afterDramas, afterEpisodes, afterHeroSlides] = await Promise.all([
    Drama.countDocuments(),
    Episode.countDocuments(),
    HeroSlide.countDocuments(),
  ]);
  await mongoose.disconnect();

  if (
    afterDramas !== series.length ||
    afterEpisodes !== episodeDocs.length ||
    afterHeroSlides !== 0
  ) {
    throw new Error(
      `Xác minh thất bại: sau import có ${afterDramas} phim, ${afterEpisodes} tập, ${afterHeroSlides} hero slide.`,
    );
  }

  await clearDramaCaches();
  console.log(
    `✅ Đã thay xong: ${afterDramas} phim, ${afterEpisodes} tập; hero slide cũ đã xoá.`,
  );
}

async function main() {
  const series = readSeries();
  validateSeries(series);

  if (!apply) {
    console.log(
      "ℹ️ Dry-run: chưa thay đổi DB. Dùng thêm --apply để xoá dữ liệu phim hiện tại và import dữ liệu này.",
    );
    return;
  }

  await importData(series);
}

main().catch((error) => {
  console.error(`❌ Import thất bại: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
