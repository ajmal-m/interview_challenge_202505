import { db, notes, type Note, type NewNote } from "~/db/schema";
import { sql } from "drizzle-orm";

export async function createNote(data: NewNote): Promise<Note> {
  const [note] = await db.insert(notes).values(data).returning();
  return note;
}

export async function getNoteById(id: number): Promise<Note | null> {
  const [note] = await db
    .select()
    .from(notes)
    .where(sql`${notes.id} = ${id}`);
  return note || null;
}

export async function getNotesByUserId(
  userId: number,
  { limit = 10, page = 3 }: { limit?: number ; page ?:number; } = {}
): Promise<{ notes: Note[] ; totalPages: number }> {
  const notesList = await db
    .select()
    .from(notes)
    .where(sql`${notes.userId} = ${userId}`)
    .limit(limit)
    .offset((page - 1) * limit);

  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(notes)
    .where(sql`${notes.userId} = ${userId}`);

  return {
    notes: notesList,
    totalPages: Math.ceil((result?.count ?? 0) / limit),
  };
}

export async function updateNote(
  id: number,
  userId: number,
  data: Partial<NewNote>
): Promise<Note | null> {
  const [note] = await db
    .update(notes)
    .set(data)
    .where(sql`${notes.id} = ${id} AND ${notes.userId} = ${userId}`)
    .returning();
  return note || null;
}

export async function deleteNote(id: number, userId: number): Promise<boolean> {
  const [note] = await db
    .delete(notes)
    .where(sql`${notes.id} = ${id} AND ${notes.userId} = ${userId}`)
    .returning();
  return !!note;
}
