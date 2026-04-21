/**
 * Tính delay retry với exponential backoff
 */
export const calculateRetryDelay = (attempt: number, initialDelay: number, maxDelay: number): number => {
  const delay = initialDelay * Math.pow(1.5, attempt - 1);
  return Math.min(delay, maxDelay);
};

/**
 * Random jitter trong khoảng [-max, max]
 */
export const getRandomJitter = (max: number): number => {
  return (Math.random() - 0.5) * 2 * max;
};

/**
 * Easing function cubic - tạo chuyển động mượt
 */
export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Validate URL có hợp lệ không
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};