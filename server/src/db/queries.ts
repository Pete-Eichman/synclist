import { Pool } from 'pg';
import { List, ListItem, ListWithItems } from '../types';

export async function createList(
  pool: Pool,
  name: string,
  createdBy: string,
  joinCode: string,
): Promise<List> {
  const { rows } = await pool.query<List>(
    `INSERT INTO lists (name, join_code, created_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, joinCode, createdBy],
  );
  return rows[0];
}

export async function getListById(pool: Pool, id: string): Promise<ListWithItems | null> {
  const listResult = await pool.query<List>(`SELECT * FROM lists WHERE id = $1`, [id]);
  if (listResult.rows.length === 0) return null;

  const itemResult = await pool.query<ListItem>(
    `SELECT * FROM list_items WHERE list_id = $1 ORDER BY position ASC`,
    [id],
  );

  return { ...listResult.rows[0], items: itemResult.rows };
}

export async function getListByJoinCode(pool: Pool, joinCode: string): Promise<List | null> {
  const { rows } = await pool.query<List>(`SELECT * FROM lists WHERE join_code = $1`, [joinCode]);
  return rows[0] ?? null;
}

export async function addItem(
  pool: Pool,
  item: { id: string; listId: string; text: string; position: number; createdBy: string },
): Promise<ListItem> {
  const { rows } = await pool.query<ListItem>(
    `INSERT INTO list_items (id, list_id, text, position, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [item.id, item.listId, item.text, item.position, item.createdBy],
  );
  return rows[0];
}

export async function setItemChecked(
  pool: Pool,
  id: string,
  checked: boolean,
): Promise<ListItem | null> {
  const { rows } = await pool.query<ListItem>(
    `UPDATE list_items
     SET checked = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [checked, id],
  );
  return rows[0] ?? null;
}

export async function deleteItem(pool: Pool, id: string): Promise<void> {
  await pool.query(`DELETE FROM list_items WHERE id = $1`, [id]);
}

export async function reorderItems(
  pool: Pool,
  updates: { id: string; position: number }[],
): Promise<void> {
  // Update positions in a single transaction to avoid partial reorders
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const { id, position } of updates) {
      await client.query(`UPDATE list_items SET position = $1 WHERE id = $2`, [position, id]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
