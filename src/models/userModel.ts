import { getDb } from '../config/database';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export interface UserRow {
  id: number;
  email: string;
  password: string;
}

export type PublicUser = Omit<UserRow, 'password'>;

export const createUser = async (
  email: string,
  password: string
): Promise<PublicUser> => {
  const db = await getDb();
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.run(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, hashedPassword]
  );

  if (typeof result.lastID !== 'number') {
    throw new Error('No se pudo obtener el ID del usuario insertado');
  }

  return { id: result.lastID, email };
};

export const findUserByEmail = async (
  email: string
): Promise<UserRow | undefined> => {
  const db = await getDb();
  return db.get<UserRow>('SELECT * FROM users WHERE email = ?', [email]);
};