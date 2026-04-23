import "express";

declare global {
  namespace Express {
    interface User {
      id: number;
      role?: string;
      ownsToken?: (token: string) => boolean;
    }
  }
}

export {};
