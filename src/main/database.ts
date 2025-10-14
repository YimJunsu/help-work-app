import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

let db: Database.Database | null = null

export interface Schedule {
  id: number
  text: string
  completed: number // SQLite uses INTEGER for boolean (0 = false, 1 = true)
  category?: string
  dueDate?: string // Store as ISO string
  clientName?: string
  webData?: boolean // 웹데이터 유무
  createdAt: string
  updatedAt: string
}

export function initDatabase(): any {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'schedules.db')

  db = new Database(dbPath)

  // Create schedules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      category TEXT,
      dueDate TEXT,
      clientName TEXT,
      webData INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  // Add clientName column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE schedules ADD COLUMN clientName TEXT`)
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add webData column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE schedules ADD COLUMN webData INTEGER DEFAULT 0`)
  } catch (error) {
    // Column already exists, ignore error
  }

  console.log('Database initialized at:', dbPath)
  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

// Schedule CRUD operations
export function getAllSchedules(): Schedule[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM schedules ORDER BY createdAt DESC')
  const schedules = stmt.all() as any[]

  // Convert INTEGER webData to boolean
  return schedules.map(schedule => ({
    ...schedule,
    webData: schedule.webData === 1
  })) as Schedule[]
}

export function getScheduleById(id: number): Schedule | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM schedules WHERE id = ?')
  const schedule = stmt.get(id) as any

  if (!schedule) return undefined

  // Convert INTEGER webData to boolean
  return {
    ...schedule,
    webData: schedule.webData === 1
  } as Schedule
}

export function createSchedule(schedule: {
  text: string
  completed?: boolean
  category?: string
  dueDate?: Date
  clientName?: string
  webData?: boolean
}): Schedule {
  const db = getDatabase()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO schedules (text, completed, category, dueDate, clientName, webData, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    schedule.text,
    schedule.completed ? 1 : 0,
    schedule.category || null,
    schedule.dueDate ? schedule.dueDate.toISOString() : null,
    schedule.clientName || null,
    schedule.webData ? 1 : 0,
    now,
    now
  )

  return getScheduleById(Number(result.lastInsertRowid))!
}

export function updateSchedule(id: number, updates: {
  text?: string
  completed?: boolean
  category?: string
  dueDate?: Date | null
}): Schedule {
  const db = getDatabase()
  const now = new Date().toISOString()

  const fields: string[] = []
  const values: any[] = []

  if (updates.text !== undefined) {
    fields.push('text = ?')
    values.push(updates.text)
  }
  if (updates.completed !== undefined) {
    fields.push('completed = ?')
    values.push(updates.completed ? 1 : 0)
  }
  if (updates.category !== undefined) {
    fields.push('category = ?')
    values.push(updates.category || null)
  }
  if (updates.dueDate !== undefined) {
    fields.push('dueDate = ?')
    values.push(updates.dueDate ? updates.dueDate.toISOString() : null)
  }

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  const stmt = db.prepare(`
    UPDATE schedules
    SET ${fields.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)
  return getScheduleById(id)!
}

export function deleteSchedule(id: number): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM schedules WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function deleteCompletedSchedules(): number {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM schedules WHERE completed = 1')
  const result = stmt.run()
  return result.changes
}
