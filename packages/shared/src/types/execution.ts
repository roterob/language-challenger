export interface ExecutionConfig {
  questionLang: 'en' | 'es';
  playQuestion: boolean;
  playAnswer: boolean;
  writeAnswer: boolean;
  automaticMode: boolean;
  loopMode: boolean;
  shuffle: boolean;
}

export interface ExecutionResult {
  id: string;
  executionId: string;
  resourceId: string;
  listId: string | null;
  result: boolean | null;
  position: number;
}

export interface ExecutionCounters {
  correct: number;
  incorrect: number;
  noExecuted: number;
}

export interface Execution {
  id: string;
  userId: string;
  name: string;
  tags: string[];
  listIds: string[];
  inProgress: boolean;
  loops: number;
  currentIndex: number;
  config: ExecutionConfig | null;
  counters: ExecutionCounters;
  results: ExecutionResult[];
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  id: string;
  userId: string;
  executions: number;
  correct: number;
  incorrect: number;
}
