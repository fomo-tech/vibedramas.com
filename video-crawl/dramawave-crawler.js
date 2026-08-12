/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs/promises');
const https = require('https');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const API_ROOT = 'https://api.ushort.cloud/dramawave';
const TAB_LIST_URL = `${API_ROOT}/homepage/tab/list`;
const TAB_INDEX_URL = `${API_ROOT}/homepage/tab/index`;
const VIDEO_INFO_URL = `${API_ROOT}/video/info`;
const ENCRYPTION_BUNDLE_URL =
  process.env.DRAMAWAVE_ENCRYPTION_BUNDLE_URL ||
  'https://ushort.cloud/_nuxt/BdlaA4fY.js';
const DEFAULT_OUTPUT = path.join(__dirname, 'data');

const args = process.argv.slice(2);
function flag(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1] || fallback;
}

const outputDir = path.resolve(flag('output', DEFAULT_OUTPUT));
const rawDir = path.join(outputDir, 'raw');
const positionIndex = String(flag('position-index', '10001'));
const concurrency = Math.max(1, Math.min(8, Number(flag('concurrency', 4)) || 4));
const maxSeries = Math.max(0, Number(flag('max-series', 0)) || 0);
const delayMs = Math.max(0, Number(flag('delay-ms', 150)) || 0);
const requestedTabs = String(flag('tab-keys', '') || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);
const requestedSeries = String(flag('series-keys', '') || '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

const headers = {
  accept: '*/*',
  'accept-language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
  Origin: 'https://ushort.cloud',
  Referer: 'https://ushort.cloud/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const execFileAsync = promisify(execFile);

async function requestTextWithCurl(url, options = {}) {
  const requestHeaders = { ...headers, ...(options.headers || {}) };
  const curlArgs = [
    '--max-time',
    '30',
    '-sS',
    '-w',
    '\n%{http_code}',
    ...Object.entries(requestHeaders).flatMap(([name, value]) => ['-H', `${name}: ${value}`]),
    url
  ];
  const result = await execFileAsync('curl', curlArgs, { maxBuffer: 12 * 1024 * 1024 });
  const marker = result.stdout.lastIndexOf('\n');
  const statusCode = Number(result.stdout.slice(marker + 1).trim()) || 0;
  return {
    statusCode,
    text: result.stdout.slice(0, marker)
  };
}

function requestText(url, options = {}) {
  if (process.env.DRAMAWAVE_USE_CURL === '1') {
    return requestTextWithCurl(url, options);
  }
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: options.method || 'GET',
      headers: { ...headers, ...(options.headers || {}) },
      timeout: 30_000
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        statusCode: response.statusCode || 0,
        text: Buffer.concat(chunks).toString('utf8')
      }));
    });
    request.on('timeout', () => request.destroy(new Error(`Timeout khi gọi ${url}`)));
    request.on('error', reject);
    request.end();
  });
}

async function writeJson(file, value) {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function fetchJson(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await requestText(url);
      let payload;
      try {
        payload = JSON.parse(response.text);
      } catch {
        throw new Error(`Phản hồi không phải JSON (HTTP ${response.statusCode})`);
      }
      if (response.statusCode < 200 || response.statusCode >= 300 || payload.success === false) {
        throw new Error(`API lỗi HTTP ${response.statusCode}`);
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(attempt * 1_000);
    }
  }
  throw lastError;
}

function decodeBase64(value) {
  return Buffer.from(value, 'base64');
}

function extractPrivateKey(bundle) {
  const listMatch = bundle.match(/it=\[([^\]]+)\]/);
  if (!listMatch) throw new Error('Không tìm thấy cấu trúc khóa API trong bundle UShort');

  const values = {};
  for (const match of bundle.matchAll(/(?:const|,)\s*([A-Za-z_$][\w$]*)="([^"]*)"/g)) {
    values[match[1]] = match[2];
  }

  const names = listMatch[1]
    .split(',')
    .map(value => value.trim())
    .filter(name => name !== 'k' && name !== 'Q');
  const missing = names.filter(name => !values[name]);
  if (missing.length) {
    throw new Error(`Bundle UShort thiếu mảnh khóa API: ${missing.join(', ')}`);
  }

  return [
    '-----BEGIN PRIVATE KEY-----',
    ...names.map(name => values[name]),
    '-----END PRIVATE KEY-----'
  ].join('\n');
}

async function loadPrivateKey() {
  if (process.env.DRAMAWAVE_API_PRIVATE_KEY) {
    return process.env.DRAMAWAVE_API_PRIVATE_KEY.replace(/\\n/g, '\n');
  }

  const response = await requestText(ENCRYPTION_BUNDLE_URL, {
    headers: { Accept: 'application/javascript' }
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Không tải được bundle giải mã UShort (HTTP ${response.statusCode})`);
  }
  return extractPrivateKey(response.text);
}

function decryptEnvelope(envelope, privateKey) {
  const encrypted = envelope && envelope.data;
  if (!encrypted || encrypted.encrypted !== true) return envelope;

  const aesKey = crypto.privateDecrypt({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, decodeBase64(encrypted.encryptedKey));
  const decipher = crypto.createDecipheriv(
    `aes-${aesKey.length * 8}-gcm`,
    aesKey,
    decodeBase64(encrypted.nonce)
  );
  decipher.setAuthTag(decodeBase64(encrypted.authTag));
  const clearText = Buffer.concat([
    decipher.update(decodeBase64(encrypted.data)),
    decipher.final()
  ]).toString('utf8');
  return JSON.parse(clearText);
}

async function fetchVideoInfo(seriesKey, privateKey) {
  const envelope = await fetchJson(
    `${VIDEO_INFO_URL}?series_id=${encodeURIComponent(seriesKey)}`
  );
  return decryptEnvelope(envelope, privateKey);
}

async function discoverTabs() {
  if (requestedTabs.length) return requestedTabs;
  const payload = await fetchJson(TAB_LIST_URL);
  const tabs = (payload?.data?.data?.list || [])
    .flatMap(tab => tab.children || [])
    .map(tab => String(tab.tab_key || '').trim())
    .filter(Boolean);
  return [...new Set(tabs.length ? tabs : ['678'])];
}

function extractItems(payload) {
  return (payload?.data?.data?.items || []).flatMap(module => module.items || []);
}

async function discoverSeries() {
  if (requestedSeries.length) {
    return requestedSeries.map(key => ({ key, title: key }));
  }
  const tabs = await discoverTabs();
  const byKey = new Map();
  await fs.mkdir(rawDir, { recursive: true });

  for (const tabKey of tabs) {
    const url = `${TAB_INDEX_URL}?tab_key=${encodeURIComponent(tabKey)}&position_index=${encodeURIComponent(positionIndex)}`;
    const payload = await fetchJson(url);
    await writeJson(path.join(rawDir, `tab-${tabKey}.json`), payload);
    const items = extractItems(payload);
    for (const item of items) {
      const key = String(item?.key || '').trim();
      if (key) byKey.set(key, item);
    }
    console.log(`Tab ${tabKey}: ${items.length} mục`);
  }

  const discovered = [...byKey.values()];
  return maxSeries ? discovered.slice(0, maxSeries) : discovered;
}

function normalizeEpisode(episode, fallbackVietnameseAudio = false) {
  const h264 = String(episode.external_audio_h264_m3u8 || '').trim();
  const h265 = String(episode.external_audio_h265_m3u8 || '').trim();
  const subtitle = (Array.isArray(episode.subtitle_list) ? episode.subtitle_list : [])
    .find(item => String(item.language || '').toLowerCase() === 'vi-vn');
  const audioLanguages = Array.isArray(episode.audio) ? episode.audio : [];
  return {
    id: String(episode.id || ''),
    episodeNum: Number(episode.index),
    videoDuration: Number(episode.duration) || 0,
    needDecrypt: false,
    lock: episode.unlock ? 0 : 1,
    alreadyLock: episode.user_unlocked ? 1 : 0,
    subtitle_vtt: String(subtitle?.vtt || '').trim(),
    subtitle_srt: String(subtitle?.subtitle || '').trim(),
    hasVietnameseAudio: audioLanguages.some(language =>
      String(language).toLowerCase() === 'vi-vn'
    ) || (fallbackVietnameseAudio && audioLanguages.length === 0),
    external_audio_h264_m3u8: h264,
    external_audio_h265_m3u8: h265,
    videoUrl: {
      ...(h264 ? { video_720: h264 } : {}),
      ...(h265 ? { video_1080: h265 } : {})
    }
  };
}

function normalizeSeries(item, decrypted) {
  const info = decrypted?.data?.info || decrypted?.info || {};
  const name = String(info.name || item.title || `Series ${item.key}`).trim();
  const sourceEpisodes = Array.isArray(info.episode_list) ? info.episode_list : [];
  const episodes = sourceEpisodes
    .map(episode => normalizeEpisode(episode, /lồng tiếng/i.test(name)))
    .filter(episode => episode.episodeNum > 0 && episode.external_audio_h264_m3u8);
  const cover = String(info.cover || item.cover || '').trim();
  const summary = String(info.desc || item.desc || name).trim();

  return {
    id: String(item.key),
    name,
    summary,
    cover,
    totalEpisodes: Number(info.episode_count) || episodes.length,
    episodes
  };
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

async function main() {
  await fs.mkdir(rawDir, { recursive: true });
  console.log(`Bắt đầu crawl Dramawave: concurrency=${concurrency}, position_index=${positionIndex}`);
  const privateKey = await loadPrivateKey();
  const series = await discoverSeries();
  const details = new Array(series.length);
  const failures = [];

  await runPool(series, async (item, index) => {
    try {
      const payload = await fetchVideoInfo(item.key, privateKey);
      await writeJson(path.join(rawDir, `video-info-${item.key}.json`), payload);
      details[index] = normalizeSeries(item, payload);
      console.log(`  ${index + 1}/${series.length}: ${details[index].name} — ${details[index].episodes.length} tập H.264`);
    } catch (error) {
      failures.push({ key: item.key, name: item.title, error: error.message });
      console.error(`  Lỗi ${item.key} ${item.title}: ${error.message}`);
    }
    await sleep(delayMs);
  });

  const safeDetails = details.filter(seriesItem => seriesItem && seriesItem.episodes.length);
  const episodes = safeDetails.flatMap(seriesItem => seriesItem.episodes.map(episode => ({
    key: `${seriesItem.id}-${episode.id}`,
    seriesId: seriesItem.id,
    seriesName: seriesItem.name,
    title: `${seriesItem.name} · Tập ${episode.episodeNum}`,
    episodeNum: episode.episodeNum,
    duration: episode.videoDuration,
    locked: Boolean(episode.lock),
    needDecrypt: false,
    videoUrl: episode.videoUrl,
    subtitle_vtt: episode.subtitle_vtt,
    subtitle_srt: episode.subtitle_srt,
    hasVietnameseAudio: episode.hasVietnameseAudio
  })));

  await writeJson(path.join(outputDir, 'series.json'), safeDetails);
  await writeJson(path.join(outputDir, 'episodes.json'), episodes);
  await writeJson(path.join(outputDir, 'catalog.json'), episodes);
  await writeJson(path.join(outputDir, 'crawl-summary.json'), {
    crawledAt: new Date().toISOString(),
    seriesCount: safeDetails.length,
    episodeCount: episodes.length,
    failedSeriesCount: failures.length,
    needDecryptCount: 0,
    failures,
    source: 'dramawave/homepage/tab/index + dramawave/video/info',
    note: 'H.264 playlist URLs are signed/temporary; rerun the crawler when they expire.'
  });

  console.log(`Hoàn tất: ${safeDetails.length} series, ${episodes.length} tập H.264.`);
  if (failures.length) console.log(`Không lấy được ${failures.length} series; xem crawl-summary.json.`);
}

main().catch(error => {
  console.error(`Crawl Dramawave thất bại: ${error.stack || error.message}`);
  process.exitCode = 1;
});
