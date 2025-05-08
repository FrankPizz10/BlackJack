import { AppContext } from '../context';
import { Request, Response } from 'express';
import { updateGameTable } from '../services/gameTableService';
import { ZodError } from 'zod';
import { updateGameTableSchema } from '../services/gameTableService';

// This function handles the update of a game table.
export const updateGameTableController = (context: AppContext) => {
  return async (req: Request, res: Response): Promise<void> => {
    const gameTableId = parseInt(req.params.gameTableId, 10);
    const options = req.body;

    if (isNaN(gameTableId)) {
      res.status(400).json({ error: 'Invalid game table ID' });
      return;
    }
    // Validate the request body using zod schema
    const parsedOptions = updateGameTableSchema.safeParse(options);
    if (!parsedOptions.success) {
      res.status(400).json({ error: new ZodError(parsedOptions.error.errors) });
      return;
    }

    try {
      const result = await updateGameTable(context, gameTableId, options);
      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('Error updating game table:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };
};

