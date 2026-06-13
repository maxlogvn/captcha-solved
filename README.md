# captcha-solved

Giải GeeTest GT4 slider captcha bằng xử lý ảnh thuần — không cần API bên ngoài, không cần dịch vụ trả phí.

Hoạt động với cả **Playwright** và **Patchright**.

## Cài đặt

```bash
npm install github:maxlogvn/captcha-solved
```

## Sử dụng

```typescript
import { Solve } from 'captcha-solved';
import { chromium } from 'playwright-core';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('https://gt4.geetest.com/demov4/slide-popup-en.html');

await Solve.geeTest(page);          // mặc định 3 lần thử
await Solve.geeTest(page, 5);       // hoặc chỉ định số lần thử
```

## API

### `Solve.geeTest(page, maxRetry?)`

| Tham số    | Kiểu     | Mặc định | Mô tả                        |
|------------|----------|----------|------------------------------|
| `page`     | `Page`   | —        | Playwright / Patchright Page |
| `maxRetry` | `number` | `3`      | Số lần thử lại tối đa        |

Trả về `Promise<true>` nếu thành công. Ném `Error` nếu hết lượt thử.

## Cách hoạt động

1. Click nút để mở captcha.
2. Đọc URL ảnh nền và ảnh mảnh ghép từ CSS của trang.
3. Crop ảnh nền xuống đúng kích thước cần so khớp.
4. Lọc ảnh: chuyển sang grayscale, tăng độ sắc nét và độ tương phản.
5. Quét từng cột pixel để tìm vị trí mảnh ghép khớp với ảnh nền.
6. Kéo slider đến vị trí đó với chuyển động mô phỏng người thật (easing, jitter).
7. Kiểm tra kết quả — thử lại nếu chưa qua.

## Tính năng

- Xử lý ảnh bằng `sharp` + `pngjs`.
- Mô phỏng chuyển động chuột tự nhiên.
- Retry với exponential backoff.
- Hỗ trợ chế độ debug (xuất ảnh kết quả so khớp để kiểm tra thủ công).

## Chạy test

```bash
npm run run-test
```

## Build

```bash
npm run build
```

Xuất ra `dist/` với cả ba định dạng: CJS (`.cjs`), ESM (`.js`), và type definitions (`.d.ts`).

## Cấu trúc thư mục

```
src/
  index.ts            # Export public API
  solve.ts            # Class Solve — điểm vào chính
  Geetest/
    actions.ts        # Mở captcha, kéo slider, xác nhận kết quả
    calculator.ts     # Tính vị trí offset của mảnh ghép
    image.ts          # Tải ảnh, crop, lọc
  Turnstile/          # Dự kiến hỗ trợ Cloudflare Turnstile
```

## Lưu ý

- Chỉ hỗ trợ GeeTest slider GT4.
- Đang trong giai đoạn phát triển — API có thể thay đổi giữa các phiên bản.