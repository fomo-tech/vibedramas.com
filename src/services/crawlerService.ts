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

// ─── KKPhim (phimapi.com) ─────────────────────────────────────────────────────

function getKKPhimImageUrl(url: string, cdnDomain: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const cleanPath = url.replace(/^\//, "");
  return `${cdnDomain}/${cleanPath}`;
}

/**
 * Sync dramas from KKPhim (phimapi.com).
 * Uses slug as unique key — duplicates from OPhim are naturally merged (upsert).
 */
export async function syncDramasFromKKPhim(
  startPage: number = 1,
  endPage: number = 1,
) {
  let totalSaved = 0;
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let page = startPage; page <= endPage; page++) {
    const listUrl = `https://phimapi.com/v1/api/the-loai/phim-ngan?page=${page}`;
    console.log(`📡 [KKPhim] Fetching page ${page}: ${listUrl}`);

    let listData: any;
    try {
      listData = await fetchWithRetry(listUrl);
    } catch {
      console.error(`❌ [KKPhim] Failed to fetch page ${page}, skipping.`);
      continue;
    }

    // KKPhim returns status as boolean true, not string "success"
    if (!listData?.status) continue;

    const items: any[] = listData.data?.items || [];
    if (items.length === 0) break; // no more pages

    // Auto-detect total pages from pagination info
    const totalPages: number =
      listData.data?.params?.pagination?.totalPages ?? endPage;
    if (page === startPage) {
      console.log(`📊 [KKPhim] Total pages: ${totalPages}`);
      endPage = Math.min(endPage, totalPages);
    }

    // CDN domain provided by the API per-page
    const cdnDomain: string =
      listData.data?.APP_DOMAIN_CDN_IMAGE || "https://phimimg.com";

    for (const listItem of items) {
      try {
        const slug: string = listItem.slug;
        await sleep(300);

        const detailUrl = `https://phimapi.com/phim/${slug}`;
        const detailData = await fetchWithRetry(detailUrl);

        // KKPhim detail format: { status: true, movie: {...}, episodes: [...] }
        if (!detailData?.status || !detailData.movie) continue;

        const item = detailData.movie;
        const serverList: any[] = detailData.episodes || [];

        const dramaPayload = {
          name: item.name,
          slug: item.slug,
          origin_name: item.origin_name,
          alternative_names: item.alternative_names || [],
          content: stripHtml(item.content || ""),
          type: item.type,
          status: item.status || "ongoing",
          thumb_url: getKKPhimImageUrl(item.thumb_url, cdnDomain),
          poster_url: getKKPhimImageUrl(item.poster_url, cdnDomain),
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
            Array.isArray(item.actor) && item.actor[0] !== "" ? item.actor : [],
          director:
            Array.isArray(item.director) && item.director[0] !== ""
              ? item.director
              : [],
          category: item.category || [],
          country: item.country || [],
        };

        // Upsert by slug — merges with any existing OPhim record
        const savedDrama = await Drama.findOneAndUpdate(
          { slug: item.slug },
          dramaPayload,
          { upsert: true, returnDocument: "after" },
        );

        for (const serverItem of serverList) {
          const srvName: string = serverItem.server_name;
          const srvData: any[] = serverItem.server_data || [];

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

        totalSaved++;
      } catch (err: any) {
        console.error(
          `❌ [KKPhim] Error syncing ${listItem.name}:`,
          err.message,
        );
      }
    }
  }

  await redis.flushall();
  return totalSaved;
}
