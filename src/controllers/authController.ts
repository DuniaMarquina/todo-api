import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, PublicUser } from '../models/userModel';
import { config } from '../config/env';

const TOKEN_EXPIRES_IN = '1d';

const generateToken = (userId: number): string =>
  jwt.sign({ userId }, config.jwtSecret, { expiresIn: TOKEN_EXPIRES_IN });

const sanitizeUser = (user: PublicUser): PublicUser => ({
  id: user.id,
  email: user.email,
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: 'El email ya está registrado' });
      return;
    }

    const user = await createUser(email, password);
    const token = generateToken(user.id);

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const token = generateToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};