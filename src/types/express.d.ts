declare global {
  namespace Express {
    interface Request {
      userId?: number;
      role?: 'admin' | 'user';
    }
  }
}

export {};
