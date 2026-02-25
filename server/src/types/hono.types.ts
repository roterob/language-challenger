import { Context } from 'hono';

// Define custom variables that can be set in Hono context
export type HonoVariables = {
  userId: string;
  username: string;
};

// Create a type alias for Context with our custom variables
export type AppContext = Context<{ Variables: HonoVariables }>;
