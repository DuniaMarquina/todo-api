import { Request, Response, NextFunction } from 'express';
import {
  createTask as createTaskModel,
  getTasksByUser,
  updateTaskById,
  deleteTaskById,
} from '../models/taskModel';

export const getTasksHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    const tasks = await getTasksByUser(req.userId);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const createTaskHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    // req.body ya validado por validate(createTaskSchema)
    const { title, description } = req.body;
    const task = await createTaskModel(req.userId, title, description);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTaskHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    const taskId = Number(req.params.id);
    if (Number.isNaN(taskId)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const updates = req.body; // ya validado por validate(updateTaskSchema)
    const success = await updateTaskById(taskId, req.userId, updates);

    if (!success) {
      res.status(404).json({ message: 'Tarea no encontrada' });
      return;
    }
    res.json({ message: 'Tarea actualizada' });
  } catch (error) {
    next(error);
  }
};

export const deleteTaskHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    const taskId = Number(req.params.id);
    if (Number.isNaN(taskId)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const success = await deleteTaskById(taskId, req.userId);
    if (!success) {
      res.status(404).json({ message: 'Tarea no encontrada' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  getTasksHandler as getTasks,
  createTaskHandler as createTask,
  updateTaskHandler as updateTask,
  deleteTaskHandler as deleteTask,
};
