# playwright-geetest-plugin

GeeTest Slider Captcha Solver - Tự động giải GeeTest slider captcha không cần API trả phí.

## Không cần API!

Package này **hoàn toàn miễn phí**, không cần:
- Không cần đăng ký tài khoản
- Không cần API key
- Không cần trả phí per request
- Không dùng service bên thứ 3

Giải captcha bằng thuật toán xử lý ảnh và image matching cục bộ trên máy của bạn.

## Cách hoạt động

1. **Trích xuất ảnh**: Lấy ảnh nền và ảnh slice từ DOM
2. **Xử lý ảnh**: Chuyển sang đen trắng, làm nét, tăng tương phản
3. **So khớp**: Tìm vị trí slice trong ảnh nền bằng pixel difference
4. **Kéo slider**: Di chuyển chuột với human-like movement (nhiều bước nhỏ, có jitter)
5. **Xác nhận**: Kiểm tra kết quả, retry nếu cần

## Cài đặt

```bash
npm install playwright-geetest-plugin
```

## Sử dụng

```typescript
import { GeeTestSolver } from 'playwright-geetest-plugin';
import { patchright } from 'patchright';

const browser = await patchright.launch();
const page = await browser.newPage();

await page.goto('https://example.com/captcha');

// Giải GeeTest slider captcha
const solver = new GeeTestSolver();
const success = await solver.solve(page);

if (success) {
  console.log('Captcha đã được giải!');
}
```

## Demo

```bash
npm run demo
```

Chạy thử demo tại: https://gt4.geetest.com/demov4/slide-popup-en.html

## API

### GeeTestSolver

```typescript
const solver = new GeeTestSolver();
await solver.solve(page);        // Giải captcha (timeout mặc định: 90s)
await solver.solve(page, 60000); // Giải với timeout tùy chọn
```

### Config (tùy chọn)

```typescript
import { CONFIG } from 'playwright-geetest-plugin';

CONFIG.SLIDER.STEPS = 30;      // Số bước kéo
CONFIG.SLIDER.DELAY = 5;       // Delay giữa các bước (ms)
CONFIG.IMAGE.SHARPEN = 4;    // Độ nét
CONFIG.IMAGE.CONTRAST = -60; // Độ tương phản
```

## Requirements

- Node.js 18+
- Playwright hoặc Patchright

## Giấy phép

MIT