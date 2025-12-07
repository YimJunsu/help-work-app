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

export interface Memo {
  id: number
  content: string
  createdAt: string
  updatedAt: string
}

export interface TodoStat {
  id: number
  date: string // YYYY-MM-DD format
  count: number
}

export interface UserInfo {
  id: number
  name: string
  birthday: string // YYYY-MM-DD format
  createdAt: string
  updatedAt: string
}

export function initDatabase(): Database.Database {
  // Get userData path (set in main process via app.setPath)
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'schedules.db')

  console.log('Database path:', dbPath)

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

  // Create memos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  // Create todo_stats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS todo_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      count INTEGER DEFAULT 0
    )
  `)

  // Create user_info table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      birthday TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

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

// Memo CRUD operations
export function getAllMemos(): Memo[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM memos ORDER BY createdAt DESC')
  return stmt.all() as Memo[]
}

export function getMemoById(id: number): Memo | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM memos WHERE id = ?')
  return stmt.get(id) as Memo | undefined
}

export function createMemo(memo: { content: string }): Memo {
  const db = getDatabase()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO memos (content, createdAt, updatedAt)
    VALUES (?, ?, ?)
  `)

  const result = stmt.run(memo.content, now, now)
  return getMemoById(Number(result.lastInsertRowid))!
}

export function updateMemo(id: number, updates: { content: string }): Memo {
  const db = getDatabase()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    UPDATE memos
    SET content = ?, updatedAt = ?
    WHERE id = ?
  `)

  stmt.run(updates.content, now, id)
  return getMemoById(id)!
}

export function deleteMemo(id: number): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM memos WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

// TodoStat CRUD operations
export function getTodoStatsByDateRange(startDate: string, endDate: string): TodoStat[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM todo_stats WHERE date >= ? AND date <= ? ORDER BY date ASC')
  return stmt.all(startDate, endDate) as TodoStat[]
}

export function getTodoStatByDate(date: string): TodoStat | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM todo_stats WHERE date = ?')
  return stmt.get(date) as TodoStat | undefined
}

export function incrementTodoStat(date: string): TodoStat {
  const db = getDatabase()

  // Try to get existing stat
  const existing = getTodoStatByDate(date)

  if (existing) {
    // Increment existing count
    const stmt = db.prepare('UPDATE todo_stats SET count = count + 1 WHERE date = ?')
    stmt.run(date)
  } else {
    // Create new entry with count 1
    const stmt = db.prepare('INSERT INTO todo_stats (date, count) VALUES (?, 1)')
    stmt.run(date)
  }

  return getTodoStatByDate(date)!
}

export function resetTodoStat(date: string): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM todo_stats WHERE date = ?')
  const result = stmt.run(date)
  return result.changes > 0
}

// UserInfo CRUD operations
export function getUserInfo(): UserInfo | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM user_info LIMIT 1')
  return stmt.get() as UserInfo | undefined
}

export function createOrUpdateUserInfo(userInfo: { name: string; birthday: string }): UserInfo {
  const db = getDatabase()
  const now = new Date().toISOString()

  const existing = getUserInfo()

  if (existing) {
    // Update existing user info
    const stmt = db.prepare(`
      UPDATE user_info
      SET name = ?, birthday = ?, updatedAt = ?
      WHERE id = ?
    `)
    stmt.run(userInfo.name, userInfo.birthday, now, existing.id)
  } else {
    // Create new user info
    const stmt = db.prepare(`
      INSERT INTO user_info (name, birthday, createdAt, updatedAt)
      VALUES (?, ?, ?, ?)
    `)
    stmt.run(userInfo.name, userInfo.birthday, now, now)
  }

  return getUserInfo()!
}

