import mongoose from "mongoose";
import Drama from "../models/Drama";
import Episode from "../models/Episode";
import redis from "../lib/redis";
import { stripHtml } from "../lib/utils";

const CDN_DOMAIN = "https://img.ophim.live/uploads/movies";

function getFullImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;

  // OPhim sometimes provides paths that already include 'uploads/movies'
  // or sometimes just the filename.
  const cleanPath = url.replace(/^\//, ""); // remove leading slash

  if (cleanPath.includes("uploads/movies")) {
    return `https://img.ophim.live/${cleanPath}`;
  }

  return `${CDN_DOMAIN}/${cleanPath}`;
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (e: any) {
      console.error(
        `Fetch error for ${url} (Attempt ${i + 1}/${retries}): ${e.message}`,
      );
      await sleep(2000);
      if (i === retries - 1) throw e;
    }
  }
}

/**
 * Main logic to sync dramas from OPhim1
 * @param startPage
 * @param endPage
 */
export async function syncDramas(startPage: number = 1, endPage: number = 1) {
  let totalSaved = 0;
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let page = startPage; page <= endPage; page++) {
    const listUrl = `https://ophim1.com/v1/api/the-loai/short-drama?country=trung-quoc,au-my,an-do,anh,phap,canada,duc,tay-ban-nha,tho-nhi-ky,ha-lan,nga&page=${page}`;
    console.log(`📡 Fetching page ${page}: ${listUrl}`);

    const listData = await fetchWithRetry(listUrl);
    if (listData?.status !== "success") continue;

    const items = listData.data.items;

    for (const listItem of items) {
      try {
        const slug = listItem.slug;
        await sleep(300); // Respect rate limiting

        const detailUrl = `https://ophim1.com/v1/api/phim/${slug}`;
        const detailData = await fetchWithRetry(detailUrl);

        if (detailData?.status !== "success" || !detailData.data?.item)
          continue;

        const item = detailData.data.item;

        const dramaPayload = {
          name: item.name,
          slug: item.slug,
          origin_name: item.origin_name,
          alternative_names: item.alternative_names || [],
          content: stripHtml(
            item.content || detailData.data.seoOnPage?.descriptionHead || "",
          ),
          type: item.type,
          status: item.status || "ongoing",
          thumb_url: getFullImageUrl(item.thumb_url),
          poster_url: getFullImageUrl(item.poster_url),
          is_copyright: item.is_copyright || false,
          sub_docquyen: item.sub_docquyen || false,
          chieurap: item.chieurap || false,
          trailer_url: item.trailer_url || "",
          time: item.time || "",
          episode_current: item.episode_current || "",
          episode_total: item.episode_total || "",
          quality: item.quality || "HD",
          lang: item.lang || "Vietsub",
          year: item.year || new Date().getFullYear(),
          view: item.view || 0,
          actor:
            item.actor && Array.isArray(item.actor) && item.actor[0] !== ""
              ? item.actor
              : [],
          director:
            item.director &&
            Array.isArray(item.director) &&
            item.director[0] !== ""
              ? item.director
              : [],
          category: item.category || [],
          country: item.country || [],
        };

        const savedDrama = await Drama.findOneAndUpdate(
          { slug: item.slug },
          dramaPayload,
          { upsert: true, returnDocument: "after" },
        );

        if (item.episodes && item.episodes.length > 0) {
          for (const serverItem of item.episodes) {
            const srvName = serverItem.server_name;
            const srvData = serverItem.server_data;
            if (!srvData) continue;

            for (const ep of srvData) {
              if (!ep.link_m3u8 && !ep.link_embed) continue;

              await Episode.findOneAndUpdate(
                { dramaId: savedDrama._id, name: ep.name },
                {
                  dramaId: savedDrama._id,
                  server_name: srvName,
                  name: ep.name,
                  slug: ep.slug,
                  filename: ep.filename || `Tập ${ep.name}`,
                  link_embed: ep.link_embed || "",
                  link_m3u8: ep.link_m3u8 || "",
                },
                { upsert: true, returnDocument: "after" },
              );
            }
          }
        }
        totalSaved++;
      } catch (err: any) {
        console.error(`❌ Error syncing ${listItem.name}:`, err.message);
      }
    }
  }

  // Invalidate Cache
  await redis.flushall();
  return totalSaved;
}
