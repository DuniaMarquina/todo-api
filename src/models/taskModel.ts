import { getDb } from '../config/database';

export interface TaskRow {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  completed: 0 | 1;
  created_at: string;
}

export interface Task {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  completed: boolean;
}

export type TaskUpdates = Partial<{
  title: string;
  description: string | null;
  completed: boolean;
}>;

const mapRowToTask = (row: TaskRow): Task => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  completed: row.completed === 1,
});

export const createTask = async (
  userId: number,
  title: string,
  description?: string
): Promise<Task> => {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO tasks (user_id, title, description) VALUES (?, ?, ?)',
    [userId, title, description ?? null]
  );

  if (typeof result.lastID !== 'number') {
    throw new Error('No se pudo obtener el ID de la tarea insertada');
  }

  return {
    id: result.lastID,
    userId,
    title,
    description: description ?? null,
    completed: false,
  };
};

export const getTasksByUser = async (userId: number): Promise<Task[]> => {
  const db = await getDb();
  const rows = await db.all<TaskRow[]>(
    'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC, id DESC',
    [userId]
  );
  return rows.map(mapRowToTask);
};

export const updateTaskById = async (
  id: number,
  userId: number,
  updates: TaskUpdates
): Promise<boolean> => {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.completed !== undefined) {
    fields.push('completed = ?');
    values.push(updates.completed ? 1 : 0);
  }

  if (fields.length === 0) return false;

  values.push(id, userId);
  const result = await db.run(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );

  return (result.changes ?? 0) > 0;
};

export const deleteTaskById = async (
  id: number,
  userId: number
): Promise<boolean> => {
  const db = await getDb();
  const result = await db.run(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return (result.changes ?? 0) > 0;
};