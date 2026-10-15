import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/env';

const jwtPayloadSchema = z.object({
  userId: z.number().int().positive(),
});

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token no proporcionado' });
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    res.status(401).json({ message: 'Token vacío' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const parsed = jwtPayloadSchema.safeParse(decoded);

    if (!parsed.success) {
      res.status(401).json({ message: 'Payload del token inválido' });
      return;
    }

    req.userId = parsed.data.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expirado' });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Token inválido' });
      return;
    }

    console.error('Error inesperado al verificar JWT:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};