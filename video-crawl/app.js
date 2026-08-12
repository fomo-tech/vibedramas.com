const video = document.querySelector('#video');
const dramaId = document.querySelector('#dramaId');
const fetchDramaBtn = document.querySelector('#fetchDramaBtn');
const catalogSelect = document.querySelector('#catalogSelect');
const codecSelect = document.querySelector('#codecSelect');
const videoUrl = document.querySelector('#videoUrl');
const loadBtn = document.querySelector('#loadBtn');
const stopBtn = document.querySelector('#stopBtn');
const status = document.querySelector('#status');
const formatLabel = document.querySelector('#formatLabel');
let hls = null;
let catalog = [];

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function proxiedUrl(source) {
  if (source.includes('dramawave-proxy.ushort.workers.dev')) return source;
  const encoded = btoa(source).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `https://dramawave-proxy.ushort.workers.dev/?url=${encoded}`;
}

function selectedItem() {
  return catalog.find(item => item.key === catalogSelect.value) || catalog[0];
}

function sourceFor(item) {
  if (!item) return '';
  if (item[codecSelect.value]) return item[codecSelect.value];
  if (item.videoUrl) {
    return item.videoUrl[`video_${codecSelect.value}`]
      || item.videoUrl.video_720
      || item.videoUrl.video_480
      || item.videoUrl.video_1080
      || '';
  }
  return item.h264 || item.h265 || '';
}

function renderCatalog() {
  catalogSelect.replaceChildren(...catalog.map(item => {
    const option = document.createElement('option');
    option.value = item.key;
    option.textContent = `${item.title} · ${formatDuration(item.duration)}`;
    return option;
  }));

  const savedKey = localStorage.getItem('videoKey');
  if (catalog.some(item => item.key === savedKey)) catalogSelect.value = savedKey;
  syncCatalogSelection();
}

function syncCatalogSelection() {
  const item = selectedItem();
  if (!item) return;
  videoUrl.value = sourceFor(item);
  localStorage.setItem('videoUrl', videoUrl.value);
}

async function loadCatalog() {
  try {
    let response = await fetch('data/catalog.json', { cache: 'no-store' });
    if (!response.ok) response = await fetch('catalog.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    catalog = await response.json();
    renderCatalog();
  } catch (error) {
    catalogSelect.replaceChildren();
    const option = document.createElement('option');
    option.textContent = 'Không đọc được catalog.json';
    catalogSelect.append(option);
    videoUrl.value = localStorage.getItem('videoUrl') || '';
    setStatus('Không đọc được danh sách video; bạn vẫn có thể dán link thủ công.', 'error');
  }
}

async function fetchDrama() {
  const id = dramaId.value.trim();
  if (!/^\d+$/.test(id)) {
    setStatus('Mã phim phải là một số nguyên.', 'error');
    return;
  }

  fetchDramaBtn.disabled = true;
  setStatus('Đang lấy danh sách tập từ UShort…');

  try {
    const response = await fetch(
      `https://api.ushort.cloud/dramarush/video/play-slide-v3?shortPlayId=${encodeURIComponent(id)}`,
      { headers: { Accept: 'application/json' }, credentials: 'omit' }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const detail = payload?.data?.data;
    if (!payload?.success || !detail || !Array.isArray(detail.episodes)) {
      throw new Error('API không trả danh sách tập hợp lệ');
    }

    const freeUntil = Number(detail.lockBegin) || 0;
    const playableEpisodes = detail.episodes.filter(episode =>
      Number(episode.episodeNum) <= freeUntil && sourceFor({ videoUrl: episode.videoUrl })
    );

    catalog = playableEpisodes.map(episode => ({
      key: `${detail.id}-${episode.id}`,
      seriesId: detail.id,
      seriesName: detail.shortPlayName,
      title: `${detail.shortPlayName} · Tập ${episode.episodeNum}`,
      episodeNum: Number(episode.episodeNum),
      duration: Number(episode.videoDuration) || 0,
      needDecrypt: Boolean(episode.needDecrypt),
      videoUrl: episode.videoUrl || {}
    }));

    if (!catalog.length) throw new Error('Không có tập miễn phí với URL video hợp lệ');

    localStorage.setItem('dramaId', id);
    renderCatalog();
    setStatus(`Đã lấy ${catalog.length}/${detail.totalEpisodes || detail.episodes.length} tập miễn phí của “${detail.shortPlayName}”.`);
  } catch (error) {
    setStatus(`Không lấy được dữ liệu phim: ${error.message}`, 'error');
  } finally {
    fetchDramaBtn.disabled = false;
  }
}

function setStatus(message, type = '') {
  status.textContent = message;
  status.className = `status${type ? ` ${type}` : ''}`;
}

function destroyPlayer() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
  video.pause();
  video.removeAttribute('src');
  video.load();
}

function stopVideo() {
  destroyPlayer();
  setStatus('Đã dừng video.');
}

function playVideo() {
  const source = videoUrl.value.trim();
  if (!/^https?:\/\//i.test(source)) {
    setStatus('Hãy nhập một địa chỉ http:// hoặc https://.', 'error');
    return;
  }

  localStorage.setItem('videoUrl', source);
  destroyPlayer();
  const item = selectedItem();
  setStatus(item?.needDecrypt || source.includes('/hls-encrypted/')
    ? 'Đang tải và xử lý nguồn HLS mã hóa…'
    : 'Đang tải video…');

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    formatLabel.textContent = source.includes('/hls-encrypted/') ? 'ShortTV HLS · proxy' : 'Native HLS';
    video.src = proxiedUrl(source);
    video.addEventListener('loadedmetadata', () => {
      setStatus('Video đã sẵn sàng.');
      video.play().catch(() => setStatus('Video đã sẵn sàng. Bấm ▶ trên thanh điều khiển để phát.'));
    }, { once: true });
    video.addEventListener('error', () => setStatus('Không thể phát nguồn video này.', 'error'), { once: true });
    video.load();
    return;
  }

  if (!window.Hls || !window.Hls.isSupported()) {
    setStatus('Trình duyệt không hỗ trợ HLS.', 'error');
    return;
  }

  formatLabel.textContent = source.includes('/hls-encrypted/') ? 'ShortTV HLS · proxy' : 'HLS.js';
  hls = new window.Hls({ enableWorker: true, lowLatencyMode: false });
  hls.loadSource(proxiedUrl(source));
  hls.attachMedia(video);
  hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
    setStatus('Video đã sẵn sàng.');
    video.play().catch(() => setStatus('Video đã sẵn sàng. Bấm ▶ trên thanh điều khiển để phát.'));
  });
  hls.on(window.Hls.Events.ERROR, (_event, data) => {
    if (!data.fatal) return;
    const message = data.type === window.Hls.ErrorTypes.NETWORK_ERROR
      ? 'Không tải được playlist hoặc các đoạn video.'
      : 'Nguồn video không tương thích hoặc đã hết hạn.';
    setStatus(message, 'error');
    destroyPlayer();
  });
}

loadBtn.addEventListener('click', playVideo);
fetchDramaBtn.addEventListener('click', fetchDrama);
stopBtn.addEventListener('click', stopVideo);
catalogSelect.addEventListener('change', () => {
  localStorage.setItem('videoKey', catalogSelect.value);
  syncCatalogSelection();
});
codecSelect.addEventListener('change', syncCatalogSelection);
videoUrl.addEventListener('keydown', event => {
  if (event.key === 'Enter') playVideo();
});
dramaId.addEventListener('keydown', event => {
  if (event.key === 'Enter') fetchDrama();
});

dramaId.value = localStorage.getItem('dramaId') || dramaId.value;
loadCatalog();
