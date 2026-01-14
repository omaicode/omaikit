export interface ReviewFinding {
  id: string;
  severity: 'info' | 'warn' | 'error';
  code: string;
  message: string;
  line?: number;
  suggestion?: string;
}

export interface CodeReview {
  id: string;
  taskId: string;
  codeId: string;
  findings: ReviewFinding[];
  score: number;
  approved: boolean;
  metadata?: {
    reviewedAt?: string;
    model?: string;
  };
}
