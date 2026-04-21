# playwright-geetest-plugin Note

## Demo
- URL: https://gt4.geetest.com/demov4/slide-popup-en.html

---

## Cách hoạt động

### Bước 1: Chờ captcha hiện ra
Người dùng click nút "I'm not a robot" hoặc nút bất kỳ để kích hoạt captcha. Ta chờ cho cái nút kéo (`.geetest_btn`) hiện lên màn hình.

### Bước 2: Lấy ảnh
GeeTest hiển thị 2 tấm ảnh:
- **Ảnh nền (background)**: Toàn bộ khung cảnh
- **Ảnh ghép (slice)**: Một mảnh nhỏ đã được cắt ra và đặt lệch đi

Ta phải tìm bằng được URLs của 2 tấm ảnh này trong DOM, thường nằm ở các class `.geetest_bg` và `.geetest_slice_bg`.

### Bước 3: Tìm vị trí slice
Để biết slice nằm ở đâu trong ảnh nền, ta cần biết **tọa độ Y** của nó (vị trí theo chiều dọc). Thông tin này nằm trong element `.geetest_slice` - ta đọc `top` hoặc `y` từ CSS.

### Bước 4: Xử lý ảnh
Trước khi so sánh, ta chỉnh ảnh cho dễ nhận ra:
1. **Crop**: Cắt ảnh nền theo chiều cao của slice (bắt đầu từ vị trí Y)
2. **Grayscale**: Chuyển sang đen trắng (bỏ màu)
3. **Sharpen**: Làm nét ảnh
4. **Contrast**: Tăng độ tương phản lên

### Bước 5: So khớp
So sánh pixel của slice với từng vị trí trên ảnh nền đã xử lý. Tìm vị trí có số pixel khác nhau ít nhất → Đó là vị trí chính xác của slice trong ảnh nền = **Offset** cần kéo.

### Bước 6: Kéo slider
Di chuyển con trỏ đến nút kéo (`.geetest_btn`), giữ chuột trái rồi kéo sang phải đúng bằng offset tìm được.

Để không bị phát hiện là bot, ta kéo từ từ với nhiều bước nhỏ, có thêm chút rung nhẹ:
- 30 bước nhỏ
- Mỗi bước cách nhau 5ms
- Mỗi bước lệch ±2px ngẫu nhiên

### Bước 7: Xác nhận
Sau khi kéo xong, chờ 500ms để server xử lý, rồi kiểm tra kết quả:
- Nếu thấy text "You beat 99% of users" → Thành công!
- Nếu thấy "Please try again" → Thất bại, thử lại từ đầu

---

## Retry

Nếu lần đầu không đúng, ta thử lại:
- Lần 1: Chờ 1s rồi thử
- Lần 2: Chờ 1.5s rồi thử
- Lần 3: Chờ 2.25s rồi thử
- ...

Thời gian chờ tăng dần theo công thức exponential backoff (nhân 1.5 lần mỗi lần), tối đa 5s.

---

## Configuration

| Key | Ý nghĩa | Giá trị |
|-----|---------|--------|
| TIMEOUT.DEFAULT | Thời gian tối đa để giải 1 captcha | 90000ms (90s) |
| SLIDER.STEPS | Số bước khi kéo | 30 |
| SLIDER.DELAY | Delay giữa các bước | 5ms |
| IMAGE.SHARPEN | Độ nét | 4 |
| IMAGE.CONTRAST | Độ tương phản | -60 |

---

## Classes

- `GeeTestSolver` - Class chính, điều phối toàn bộ
- `ImageExtractor` - Tìm và trích xuất URLs của ảnh nền và slice
- `ImageMatcher` - So khớp slice với background để tìm offset
- `SliderDriver` - Điều khiển chuột kéo slider

---

## API

```typescript
import { GeeTestSolver } from 'playwright-geetest-plugin';

const solver = new GeeTestSolver();
await solver.solve(page, 90000); // page là Playwright/Patchright page
```