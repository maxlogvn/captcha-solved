# captcha-solved

GeeTest Slider Captcha Solver cho Playwright / Patchright.

Giải mã GeeTest GT4 slider captcha hoàn toàn bằng xử lý ảnh, không cần API bên ngoài.

## Tính năng

- Giải mã GeeTest slider captcha (GT4) tự động.
- Xử lý ảnh bằng Sharp + PNGjs (grayscale, sharpen, tăng tương phản).
- Mô phỏng chuyển động chuột tự nhiên (easing, jitter).
- Retry với exponential backoff.
- Hỗ trợ debug (xuất ảnh match để kiểm tra).
- Hoạt động với Playwright và Patchright.

## Cài đặt

```bash
npm install github:maxlogvn/captcha-solved
```


## Sử dụng

### Cơ bản

```typescript
import { Solve } from 'playwright-geetest-plugin';
import { chromium } from 'playwright-core';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');

// Giải captcha
await Solve.geeTest(page);

// Hoặc giải với số lần retry tùy chỉnh (mặc định: 3)
await Solve.geeTest(page, 5);
```


### Test

```bash
npm run run-test
```

## API

### `Solve.geeTest(page, maxRetry?)`

| Tham số    | Kiểu     | Mặc định | Mô tả |
|------------|----------|----------|-------|
| `page`     | `Page`   | -        | Playwright Page instance |
| `maxRetry` | `number` | `3`      | Số lần thử lại tối đa |

Trả về `Promise<true>` nếu thành công, ném `Error` nếu thất bại.

## Cách hoạt động

1. Mở khóa captcha (click nút `.geetest_btn_click`).
2. Lấy URL ảnh background và slice từ CSS.
3. Crop ảnh nền theo chiều cao của slice.
4. Áp dụng bộ lọc: grayscale, sharpen, tăng tương phản.
5. So khớp pixel để tìm vị trí offset của slice trên background.
6. Kéo slider đến vị trí tìm được với chuyển động mô phỏng người dùng.
7. Xác nhận kết quả.
8. Retry nếu thất bại.

## Cấu trúc thư mục

```
src/
  index.ts          # Entry point - export public API
  solve.ts          # Lớp Solve chính
  Geetest/
    actions.ts      # Điều khiển slider (open, slide, validate)
    calculator.ts   # Tính toán vị trí slice
    image.ts        # Xử lý ảnh (fetch, crop, filter)
  Turnstile/        # (Dự định hỗ trợ Cloudflare Turnstile)
```

## Xây dựng

```bash
npm run build
```

Build ra `dist/` với cả định dạng CJS (`.cjs`), ESM (`.js`), và type definitions (`.dts`).

## Ghi chú

- Chỉ hỗ trợ GeeTest slider GT4.
- Code đang trong giai đoạn phát triển, API có thể thay đổi.

