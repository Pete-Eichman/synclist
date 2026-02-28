import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as queries from '../db/queries';
import { generateJoinCode } from '../utils/generateCode';

export function createListRouter(pool: Pool): Router {
  const router = Router();

  // POST /lists — create a new list
  router.post('/', async (req: Request, res: Response) => {
    const { name, deviceId } = req.body as { name?: string; deviceId?: string };

    if (!name?.trim() || !deviceId?.trim()) {
      res.status(400).json({ error: 'name and deviceId are required' });
      return;
    }

    // Generate a join code, retrying on the rare collision
    let list;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        list = await queries.createList(pool, name.trim(), deviceId, generateJoinCode());
        break;
      } catch (err: unknown) {
        const isUniqueViolation =
          err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === '23505';
        if (!isUniqueViolation || attempt === 4) throw err;
      }
    }

    res.status(201).json(list);
  });

  // GET /lists/:id — fetch a list and all its items
  router.get('/:id', async (req: Request, res: Response) => {
    const list = await queries.getListById(pool, req.params.id);

    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    res.json(list);
  });

  // POST /lists/join — look up a list by its join code
  router.post('/join', async (req: Request, res: Response) => {
    const { joinCode, deviceId } = req.body as { joinCode?: string; deviceId?: string };

    if (!joinCode?.trim() || !deviceId?.trim()) {
      res.status(400).json({ error: 'joinCode and deviceId are required' });
      return;
    }

    const list = await queries.getListByJoinCode(pool, joinCode.trim().toUpperCase());

    if (!list) {
      res.status(404).json({ error: 'No list found with that code' });
      return;
    }

    res.json(list);
  });

  return router;
}

// Exposed separately so route tests can create items via the same logic
export function createItemId(): string {
  return uuidv4();
}
