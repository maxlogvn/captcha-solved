import process from 'process';

/**
 * Cấu hình mặc định cho GeeTest slider captcha solver
 * 
 * TIMEOUT: Thời gian chờ (ms)
 *   - DEFAULT: Timeout tổng thể để giải captcha (50s)
 *   - POST_DRAG: Chờ sau khi kéo slider trước khi verify (1s)
 *   - INITIAL_RETRY: Delay trước lần retry đầu (2s)
 *   - MAX_RETRY: Delay tối đa giữa các retry (10s)
 *   - BACKOFF_MULTIPLIER: Hệ số tăng exponential (1.5x mỗi lần)
 * 
 * SLIDER: Cách kéo slider
 *   - STEPS: Số bước di chuyển (30 bước)
 *   - DELAY: Delay giữa các bước (5ms)
 *   - JITTER: Độ lệch ngẫu nhiên (2px)
 * 
 * IMAGE: Xử lý ảnh trước khi match
 *   - SHARPEN: Độ sắc nét (4)
 *   - CONTRAST: Độ tương phản (-60)
 *   - THRESHOLD: Ngưỡng pixel khác biệt (10)
 * 
 * SELECTORS: CSS selectors tìm elements
 *   - BACKGROUND: Ảnh nền
 *   - SLICE_BG: Ảnh slice
 *   - SLICE: Element vị trí slice
 *   - BUTTON: Nút kéo slider
 *   - RESULT: Element hiển thị kết quả
 * 
 * FAILURE_MESSAGES: Text xác định captcha thất bại
 */
const DEFAULT = {
  TIMEOUT: {
    DEFAULT: 90000,
    POST_DRAG: 500,
    INITIAL_RETRY: 1000,
    MAX_RETRY: 5000,
    BACKOFF_MULTIPLIER: 1.5
  },
  SLIDER: {
    STEPS: 30,
    DELAY: 5,
    JITTER: 2,
    MOUSE_MOVE_STEPS: 2
  },
  IMAGE: {
    SHARPEN: 4,
    CONTRAST: -60,
    THRESHOLD: 10
  },
  SELECTORS: {
    BACKGROUND: '.geetest_bg',
    SLICE_BG: '.geetest_slice_bg',
    SLICE: '.geetest_slice',
    BUTTON: '.geetest_btn',
    RESULT: '.geetest_result_tips'
  },
  FAILURE_MESSAGES: [
    "Please try again",
    "Vui lòng thử lại",
    "请再试一次"
  ]
};

/**
 * Load config từ environment variables
 * 
 * Env vars:
 *   GEETEST_TIMEOUT, GEETEST_POST_DRAG_DELAY, GEETEST_INITIAL_RETRY, GEETEST_MAX_RETRY, GEETEST_BACKOFF
 *   GEETEST_SLIDER_STEPS, GEETEST_SLIDER_DELAY, GEETEST_JITTER
 *   GEETEST_SHARPEN, GEETEST_CONTRAST, GEETEST_THRESHOLD
 *   GEETEST_SELECTOR_BACKGROUND, GEETEST_SELECTOR_SLICE_BG, GEETEST_SELECTOR_SLICE, GEETEST_SELECTOR_BUTTON, GEETEST_SELECTOR_RESULT
 */
const loadFromEnv = () => {
  const cfg = { ...DEFAULT };
  
  if (process.env.GEETEST_TIMEOUT) cfg.TIMEOUT.DEFAULT = +process.env.GEETEST_TIMEOUT;
  if (process.env.GEETEST_POST_DRAG_DELAY) cfg.TIMEOUT.POST_DRAG = +process.env.GEETEST_POST_DRAG_DELAY;
  if (process.env.GEETEST_INITIAL_RETRY) cfg.TIMEOUT.INITIAL_RETRY = +process.env.GEETEST_INITIAL_RETRY;
  if (process.env.GEETEST_MAX_RETRY) cfg.TIMEOUT.MAX_RETRY = +process.env.GEETEST_MAX_RETRY;
  if (process.env.GEETEST_BACKOFF) cfg.TIMEOUT.BACKOFF_MULTIPLIER = +process.env.GEETEST_BACKOFF;
  
  if (process.env.GEETEST_SLIDER_STEPS) cfg.SLIDER.STEPS = +process.env.GEETEST_SLIDER_STEPS;
  if (process.env.GEETEST_SLIDER_DELAY) cfg.SLIDER.DELAY = +process.env.GEETEST_SLIDER_DELAY;
  if (process.env.GEETEST_JITTER) cfg.SLIDER.JITTER = +process.env.GEETEST_JITTER;
  
  if (process.env.GEETEST_SHARPEN) cfg.IMAGE.SHARPEN = +process.env.GEETEST_SHARPEN;
  if (process.env.GEETEST_CONTRAST) cfg.IMAGE.CONTRAST = +process.env.GEETEST_CONTRAST;
  if (process.env.GEETEST_THRESHOLD) cfg.IMAGE.THRESHOLD = +process.env.GEETEST_THRESHOLD;
  
  if (process.env.GEETEST_SELECTOR_BACKGROUND) cfg.SELECTORS.BACKGROUND = process.env.GEETEST_SELECTOR_BACKGROUND;
  if (process.env.GEETEST_SELECTOR_SLICE_BG) cfg.SELECTORS.SLICE_BG = process.env.GEETEST_SELECTOR_SLICE_BG;
  if (process.env.GEETEST_SELECTOR_SLICE) cfg.SELECTORS.SLICE = process.env.GEETEST_SELECTOR_SLICE;
  if (process.env.GEETEST_SELECTOR_BUTTON) cfg.SELECTORS.BUTTON = process.env.GEETEST_SELECTOR_BUTTON;
  if (process.env.GEETEST_SELECTOR_RESULT) cfg.SELECTORS.RESULT = process.env.GEETEST_SELECTOR_RESULT;
  
  return cfg;
};

export let CONFIG = loadFromEnv();

export type {
  SolverOptions,
  MatchPosition,
  ImageData,
  SliderPosition,
  ProgressInfo,
  DragOptions
} from './types.js';

/**
 * Override config runtime
 * @param options - Partial config để merge, null để reset về mặc định
 * @example
 *  setup({ TIMEOUT: { DEFAULT: 60000 } })
 *  setup(null) // reset về mặc định
 */
export const setup = (options: Partial<typeof DEFAULT> | null): void => {
  if (options === null) {
    CONFIG = loadFromEnv();
  } else {
    CONFIG = { ...CONFIG, ...options };
  }
};

/**
 * Reset config về mặc định
 */
export const reset = (): void => {
  CONFIG = loadFromEnv();
};