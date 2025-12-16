export interface ProcessingState {
  status: 'idle' | 'reading_files' | 'processing_step1' | 'processing_step2' | 'complete' | 'error';
  message?: string;
}

export interface GenerationResult {
  step1Output: string;
  step2Output: string;
}

export interface UploadedFiles {
  pdf: File | null;
  video: File | null;
}
