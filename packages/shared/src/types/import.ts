export type ImportTaskStatus = 'in_progress' | 'finished' | 'aborted';

export interface ImportTask {
  id: string;
  fileName: string;
  status: ImportTaskStatus;
  progress: number;
  total: number;
  errorMsg: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
}
