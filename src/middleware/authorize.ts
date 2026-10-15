import { Request, Response, NextFunction } from 'express';

type Role = 'admin' | 'user';

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({ message: 'No tienes permisos para esta acción' });
      return;
    }

    next();
  };
};