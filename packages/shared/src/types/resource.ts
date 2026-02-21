export type ResourceType = 'phrase' | 'vocabulary' | 'paragraph';

export interface Resource {
  id: string;
  code: string;
  type: ResourceType;
  tags: string[];
  contentEs: string | null;
  contentEsAudio: string | null;
  contentEn: string | null;
  contentEnAudio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceStats {
  id: string;
  userId: string;
  resourceId: string;
  executions: number;
  correct: number;
  incorrect: number;
  lastExec: string | null;
  lastResult: boolean | null;
  favourite: boolean;
}

export interface ResourceWithStats extends Resource {
  stats: ResourceStats | null;
}
