import { Router } from 'express';
import {
  getTasksHandler,
  createTaskHandler,
  updateTaskHandler,
  deleteTaskHandler,
} from '../controllers/taskController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema } from '../schemas/taskSchemas';

const router = Router();

router.use(authenticate);

router.get('/', getTasksHandler);
router.post('/', validate(createTaskSchema), createTaskHandler);
router.put('/:id', validate(updateTaskSchema), updateTaskHandler);
router.delete('/:id', deleteTaskHandler);

export default router;