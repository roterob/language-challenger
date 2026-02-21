export interface User {
  id: string;
  username: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  avatar: string | null;
  isAdmin: boolean;
  isGuest: boolean;
  uiSettings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type UserPublic = Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'uiSettings'>;
}
