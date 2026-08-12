const fs = require('fs/promises');
const https = require('https');
const path = require('path');

const API_ROOT = 'https://api.ushort.cloud/dramarush';
const HOME_URL = `${API_ROOT}/home/class-page`;
const PLAY_URL = `${API_ROOT}/video/play-slide-v3`;
const DEFAULT_OUTPUT = path.join(__dirname, 'data');

const args = process.argv.slice(2);
function flag(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1] || fallback;
}

const pageSize = Math.max(1, Math.min(100, Number(flag('page-size', 20)) || 20));
const startPage = Math.max(1, Number(flag('start-page', 1)) || 1);
const maxPages = Math.max(0, Number(flag('max-pages', 0)) || 0);
const maxSeries = Math.max(0, Number(flag('max-series', 0)) || 0);
const concurrency = Math.max(1, Math.min(8, Number(flag('concurrency', 4)) || 4));
const delayMs = Math.max(0, Number(flag('delay-ms', 250)) || 0);
const outputDir = path.resolve(flag('output', DEFAULT_OUTPUT));
const rawDir = path.join(outputDir, 'raw');

const headers = {
  accept: 'application/json',
  'content-type': 'application/json',
  'accept-language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
  Referer: 'https://ushort.cloud/',
  'User-Agent': 'StandaloneVideoCrawler/1.0'
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function requestText(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, response => {
      const chunks = [];
      response.setEncoding('utf8');
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ statusCode: response.statusCode || 0, text: chunks.join('') }));
    });
    request.on('error', reject);
    if (options.body) request.write(options.body);
    request.end();
  });
}

async function writeJson(file, value) {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function fetchJson(url, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await requestText(url, {
        method: options.method,
        headers: { ...headers, ...(options.headers || {}) },
        body: options.body
      });
      const text = response.text;
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(`Phản hồi không phải JSON (HTTP ${response.statusCode})`);
      }
      if (response.statusCode < 200 || response.statusCode >= 300 || payload.success === false) {
        throw new Error(`API lỗi HTTP ${response.statusCode}`);
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(attempt * 1000);
    }
  }
  throw lastError;
}

async function crawlSeriesList() {
  const all = [];
  let pageIndex = startPage;
  let pageCount = 0;

  while (true) {
    if (maxPages && pageCount >= maxPages) break;
    const body = JSON.stringify({ classIdList: [], pageIndex, pageSize, contentType: 3 });
    const payload = await fetchJson(HOME_URL, { method: 'POST', body });
    await writeJson(path.join(rawDir, `home-page-${String(pageIndex).padStart(4, '0')}.json`), payload);

    const page = payload?.data?.data || {};
    const list = Array.isArray(page.list) ? page.list : [];
    all.push(...list);
    pageCount += 1;
    console.log(`Trang ${pageIndex}: ${list.length} series${page.isEnd ? ' (hết)' : ''}`);

    if (page.isEnd || list.length === 0) break;
    pageIndex += 1;
    await sleep(delayMs);
  }

  const unique = [...new Map(all.filter(item => item?.id).map(item => [item.id, item])).values()];
  return { series: maxSeries ? unique.slice(0, maxSeries) : unique, pageCount };
}

async function runPool(items, worker) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(workers);
}

function buildEpisodeCatalog(seriesDetails) {
  return seriesDetails.flatMap(series => (series.episodes || []).map(episode => ({
    key: `${series.id}-${episode.id}`,
    seriesId: series.id,
    seriesName: series.name,
    title: `${series.name} · Tập ${episode.episodeNum}`,
    episodeNum: episode.episodeNum,
    duration: episode.videoDuration,
    locked: Boolean(episode.lock),
    alreadyLock: Boolean(episode.alreadyLock),
    needDecrypt: Boolean(episode.needDecrypt),
    videoUrl: episode.videoUrl || {}
  })));
}

async function main() {
  await fs.mkdir(rawDir, { recursive: true });
  console.log(`Bắt đầu crawl: pageSize=${pageSize}, concurrency=${concurrency}`);

  const { series, pageCount } = await crawlSeriesList();
  const details = new Array(series.length);
  const failures = [];

  await runPool(series, async (item, index) => {
    try {
      const payload = await fetchJson(`${PLAY_URL}?shortPlayId=${encodeURIComponent(item.id)}`);
      await writeJson(path.join(rawDir, `play-${item.id}.json`), payload);
      const detail = payload?.data?.data || {};
      details[index] = {
        id: item.id,
        shortPlayCode: item.shortPlayCode,
        name: detail.shortPlayName || item.shortPlayName,
        summary: detail.summary || item.summary,
        cover: detail.cover || item.picUrl,
        totalEpisodes: detail.totalEpisodes || item.totalEpisodes,
        lockBegin: detail.lockBegin,
        maxWatchEpisodeNum: detail.maxWatchEpisodeNum,
        episodes: Array.isArray(detail.episodes) ? detail.episodes : []
      };
      console.log(`  ${index + 1}/${series.length}: ${details[index].name} — ${details[index].episodes.length} tập`);
    } catch (error) {
      failures.push({ id: item.id, name: item.shortPlayName, error: error.message });
      details[index] = { id: item.id, name: item.shortPlayName, episodes: [], error: error.message };
      console.error(`  Lỗi ${item.id} ${item.shortPlayName}: ${error.message}`);
    }
    await sleep(delayMs);
  });

  const safeDetails = details.filter(Boolean);
  const episodes = buildEpisodeCatalog(safeDetails);
  const needDecryptCount = episodes.filter(episode => episode.needDecrypt).length;
  const lockedCount = episodes.filter(episode => episode.locked).length;

  await writeJson(path.join(outputDir, 'series.json'), safeDetails);
  await writeJson(path.join(outputDir, 'episodes.json'), episodes);
  await writeJson(path.join(outputDir, 'catalog.json'), episodes);
  await writeJson(path.join(outputDir, 'crawl-summary.json'), {
    crawledAt: new Date().toISOString(),
    pageCount,
    seriesCount: safeDetails.length,
    episodeCount: episodes.length,
    failedSeriesCount: failures.length,
    needDecryptCount,
    lockedCount,
    failures,
    note: 'Video URLs may be signed/temporary. Streams marked needDecrypt require the authorized player decryption path.'
  });

  console.log(`Hoàn tất: ${safeDetails.length} series, ${episodes.length} tập.`);
  console.log(`Đã lưu tại: ${outputDir}`);
  if (needDecryptCount) console.log(`Lưu ý: ${needDecryptCount} tập có needDecrypt=true; crawler không phá mã hóa.`);
}

main().catch(error => {
  console.error(`Crawl thất bại: ${error.stack || error.message}`);
  process.exitCode = 1;
});
