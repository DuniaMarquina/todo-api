import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

export const validate = <T extends z.ZodTypeAny>(
  schema: T,
  part: RequestPart = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[part]);

      if (part === 'query') {
        Object.assign(req.query, parsed);
      } else {
        req[part] = parsed;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Error de validación',
          errors: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        });
        return;
      }

      next(error);
    }
  };
};