# Standalone HLS Video Player

## Chạy

```bash
npm install
npm start
```

Sau đó mở [http://localhost:8080](http://localhost:8080). Nhập mã phim DramaRush (ví dụ `23378`), bấm **Lấy danh sách tập**, chọn chất lượng rồi bấm **Phát**. Trình phát chỉ đưa các tập miễn phí theo `lockBegin` vào danh sách. Bạn cũng có thể dán playlist `.m3u8` riêng.

Danh sách trong `catalog.json` được trích từ dữ liệu bạn gửi. Với các URL `video-v6.mydramawave.com`, trình phát tự bọc qua proxy `dramawave-proxy.ushort.workers.dev` để tải playlist từ trình duyệt.

Trình phát hỗ trợ playlist HLS `.m3u8`. Nguồn video phải cho phép truy cập và không có DRM/quyền hạn chế.

## Crawl API

Để lấy toàn bộ trang danh sách và chi tiết tập:

```bash
npm run crawl
```

Kết quả nằm trong `data/`: `series.json`, `episodes.json`, `catalog.json`, `crawl-summary.json` và các phản hồi gốc trong `data/raw/`.

Có thể chạy thử một phần nhỏ:

```bash
npm run crawl -- --max-pages 1 --max-series 2
```

Các URL HLS được API đánh dấu `needDecrypt` chỉ được lưu lại; crawler không vượt qua mã hóa, DRM hoặc khóa nội dung.

## Crawl nguồn Dramawave H.264

Nguồn `/dramarush` trả về playlist `hls-encrypted` không phát được bằng HLS.js thông thường. Dùng crawler Dramawave để lấy playlist H.264 chuẩn từ `external_audio_h264_m3u8`:

```bash
npm run crawl:dramawave
```

API chỉ trả URL cho các tập người dùng hiện có quyền xem; tập trả về không có H.264 sẽ không được ghi vào danh sách phát. URL HLS có chữ ký và có thể hết hạn, nên cần crawl lại khi cần cập nhật.
