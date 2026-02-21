export interface List {
  id: string;
  name: string;
  tags: string[];
  resources: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListStats {
  id: string;
  userId: string;
  listId: string;
  executions: number;
  correct: number;
  incorrect: number;
}

export interface ListWithStats extends List {
  stats: ListStats | null;
}
