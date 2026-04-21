export interface MatchPosition {
  position: number;
  score: number;
  confidence: number;
}

export interface ImageData {
  bgUrl: string;
  sliceUrl: string;
  sliceY: number;
}

export interface SliderPosition {
  centerX: number;
  centerY: number;
}

export interface ProgressInfo {
  attempt: number;
  remaining: number;
  elapsed: number;
  percentage: string;
}

export interface DragOptions {
  steps?: number;
  delay?: number;
  jitter?: number;
}

export interface SolverOptions {
  timeout?: number;
  logLevel?: 'minimal' | 'normal' | 'verbose';
  onProgress?: (progress: ProgressInfo) => void;
  onAttempt?: (attempt: number, offset: number) => void;
}