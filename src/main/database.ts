import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

// 각 테이블별 데이터베이스 인스턴스
let schedulesDb: Database.Database | null = null
let memosDb: Database.Database | null = null
let todoStatsDb: Database.Database | null = null
let userInfoDb: Database.Database | null = null

export interface Schedule {
  id: number
  text: string
  completed: number // SQLite uses INTEGER for boolean (0 = false, 1 = true)
  category?: string
  dueDate?: string // Store as ISO string
  clientName?: string
  requestNumber?: string // 접수번호
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
  supportId?: string // UniPost support account ID
  supportPw?: string // UniPost support account password (encrypted)
  createdAt: string
  updatedAt: string
}

/**
 * 데이터 마이그레이션 함수
 * 기존 schedules.db에서 데이터를 읽어 각 테이블별 DB로 이동
 */
function migrateDataFromOldDatabase(userDataPath: string, datasPath: string): void {
  const oldDbPath = path.join(userDataPath, 'schedules.db')

  // 기존 DB 파일이 없으면 마이그레이션 불필요
  if (!fs.existsSync(oldDbPath)) {
    console.log('No existing database to migrate')
    return
  }

  console.log('Migrating data from old database...')

  const oldDb = new Database(oldDbPath)

  try {
    // 각 테이블의 데이터 추출 및 새 DB로 이동

    // 1. Schedules 마이그레이션
    const schedulesDbPath = path.join(datasPath, 'schedules.db')
    const newSchedulesDb = new Database(schedulesDbPath)

    // 테이블 먼저 생성
    newSchedulesDb.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        category TEXT,
        dueDate TEXT,
        clientName TEXT,
        requestNumber TEXT,
        webData INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)

    try {
      const schedules = oldDb.prepare('SELECT * FROM schedules').all()
      if (schedules.length > 0) {
        console.log(`Migrating ${schedules.length} schedules...`)
        const insertStmt = newSchedulesDb.prepare(`
          INSERT INTO schedules (id, text, completed, category, dueDate, clientName, requestNumber, webData, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        for (const schedule of schedules as any[]) {
          insertStmt.run(
            schedule.id,
            schedule.text,
            schedule.completed,
            schedule.category,
            schedule.dueDate,
            schedule.clientName,
            schedule.requestNumber || null,
            schedule.webData,
            schedule.createdAt,
            schedule.updatedAt
          )
        }
      }
    } catch (error) {
      console.log('No schedules table in old database or already migrated')
    }
    newSchedulesDb.close()

    // 2. Memos 마이그레이션
    const memosDbPath = path.join(datasPath, 'memos.db')
    const newMemosDb = new Database(memosDbPath)

    // 테이블 먼저 생성
    newMemosDb.exec(`
      CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)

    try {
      const memos = oldDb.prepare('SELECT * FROM memos').all()
      if (memos.length > 0) {
        console.log(`Migrating ${memos.length} memos...`)
        const insertStmt = newMemosDb.prepare(`
          INSERT INTO memos (id, content, createdAt, updatedAt)
          VALUES (?, ?, ?, ?)
        `)

        for (const memo of memos as any[]) {
          insertStmt.run(memo.id, memo.content, memo.createdAt, memo.updatedAt)
        }
      }
    } catch (error) {
      console.log('No memos table in old database or already migrated')
    }
    newMemosDb.close()

    // 3. Todo Stats 마이그레이션
    const todoStatsDbPath = path.join(datasPath, 'todo_stats.db')
    const newTodoStatsDb = new Database(todoStatsDbPath)

    // 테이블 먼저 생성
    newTodoStatsDb.exec(`
      CREATE TABLE IF NOT EXISTS todo_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        count INTEGER DEFAULT 0
      )
    `)

    try {
      const todoStats = oldDb.prepare('SELECT * FROM todo_stats').all()
      if (todoStats.length > 0) {
        console.log(`Migrating ${todoStats.length} todo stats...`)
        const insertStmt = newTodoStatsDb.prepare(`
          INSERT INTO todo_stats (id, date, count)
          VALUES (?, ?, ?)
        `)

        for (const stat of todoStats as any[]) {
          insertStmt.run(stat.id, stat.date, stat.count)
        }
      }
    } catch (error) {
      console.log('No todo_stats table in old database or already migrated')
    }
    newTodoStatsDb.close()

    // 4. User Info 마이그레이션
    const userInfoDbPath = path.join(datasPath, 'user_info.db')
    const newUserInfoDb = new Database(userInfoDbPath)

    // 테이블 먼저 생성
    newUserInfoDb.exec(`
      CREATE TABLE IF NOT EXISTS user_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        birthday TEXT NOT NULL,
        supportId TEXT,
        supportPw TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)

    try {
      const userInfo = oldDb.prepare('SELECT * FROM user_info').all()
      if (userInfo.length > 0) {
        console.log(`Migrating ${userInfo.length} user info records...`)
        const insertStmt = newUserInfoDb.prepare(`
          INSERT INTO user_info (id, name, birthday, supportId, supportPw, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)

        for (const info of userInfo as any[]) {
          insertStmt.run(
            info.id,
            info.name,
            info.birthday,
            info.supportId || null,
            info.supportPw || null,
            info.createdAt,
            info.updatedAt
          )
        }
      }
    } catch (error) {
      console.log('No user_info table in old database or already migrated')
    }
    newUserInfoDb.close()

    console.log('Migration completed successfully')

    // 마이그레이션 완료 후 기존 DB 백업
    const backupPath = path.join(userDataPath, 'schedules.db.backup')
    fs.renameSync(oldDbPath, backupPath)
    console.log(`Old database backed up to: ${backupPath}`)

  } catch (error) {
    console.error('Migration error:', error)
  } finally {
    oldDb.close()
  }
}

export function initDatabase(): Database.Database {
  // Get userData path (set in main process via app.setPath)
  const userDataPath = app.getPath('userData')
  const datasPath = path.join(userDataPath, 'datas')

  console.log('User data path:', userDataPath)
  console.log('Databases path:', datasPath)

  // datas 폴더 생성
  if (!fs.existsSync(datasPath)) {
    fs.mkdirSync(datasPath, { recursive: true })
    console.log('Created datas folder')
  }

  // 기존 schedules.db에서 데이터 마이그레이션
  migrateDataFromOldDatabase(userDataPath, datasPath)

  // 1. Schedules DB 초기화
  const schedulesDbPath = path.join(datasPath, 'schedules.db')
  schedulesDb = new Database(schedulesDbPath)

  schedulesDb.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      category TEXT,
      dueDate TEXT,
      clientName TEXT,
      requestNumber TEXT,
      webData INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  // Add clientName column if it doesn't exist (for existing databases)
  try {
    schedulesDb.exec(`ALTER TABLE schedules ADD COLUMN clientName TEXT`)
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add requestNumber column if it doesn't exist (for existing databases)
  try {
    schedulesDb.exec(`ALTER TABLE schedules ADD COLUMN requestNumber TEXT`)
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add webData column if it doesn't exist (for existing databases)
  try {
    schedulesDb.exec(`ALTER TABLE schedules ADD COLUMN webData INTEGER DEFAULT 0`)
  } catch (error) {
    // Column already exists, ignore error
  }

  // 2. Memos DB 초기화
  const memosDbPath = path.join(datasPath, 'memos.db')
  memosDb = new Database(memosDbPath)

  memosDb.exec(`
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  // 3. Todo Stats DB 초기화
  const todoStatsDbPath = path.join(datasPath, 'todo_stats.db')
  todoStatsDb = new Database(todoStatsDbPath)

  todoStatsDb.exec(`
    CREATE TABLE IF NOT EXISTS todo_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      count INTEGER DEFAULT 0
    )
  `)

  // 4. User Info DB 초기화
  const userInfoDbPath = path.join(datasPath, 'user_info.db')
  userInfoDb = new Database(userInfoDbPath)

  userInfoDb.exec(`
    CREATE TABLE IF NOT EXISTS user_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      birthday TEXT NOT NULL,
      supportId TEXT,
      supportPw TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  // Add supportId column if it doesn't exist (for existing databases)
  try {
    userInfoDb.exec(`ALTER TABLE user_info ADD COLUMN supportId TEXT`)
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add supportPw column if it doesn't exist (for existing databases)
  try {
    userInfoDb.exec(`ALTER TABLE user_info ADD COLUMN supportPw TEXT`)
  } catch (error) {
    // Column already exists, ignore error
  }

  console.log('All databases initialized')

  // 호환성을 위해 schedulesDb 반환 (기존 코드와의 호환성)
  return schedulesDb
}

export function getDatabase(): Database.Database {
  if (!schedulesDb) {
    throw new Error('Database not initialized')
  }
  return schedulesDb
}

export function closeDatabase() {
  if (schedulesDb) {
    schedulesDb.close()
    schedulesDb = null
  }
  if (memosDb) {
    memosDb.close()
    memosDb = null
  }
  if (todoStatsDb) {
    todoStatsDb.close()
    todoStatsDb = null
  }
  if (userInfoDb) {
    userInfoDb.close()
    userInfoDb = null
  }
}

// Schedule CRUD operations
export function getAllSchedules(): Schedule[] {
  if (!schedulesDb) throw new Error('Schedules database not initialized')

  const stmt = schedulesDb.prepare('SELECT * FROM schedules ORDER BY createdAt DESC')
  const schedules = stmt.all() as any[]

  // Convert INTEGER webData to boolean
  return schedules.map(schedule => ({
    ...schedule,
    webData: schedule.webData === 1
  })) as Schedule[]
}

export function getScheduleById(id: number): Schedule | undefined {
  if (!schedulesDb) throw new Error('Schedules database not initialized')

  const stmt = schedulesDb.prepare('SELECT * FROM schedules WHERE id = ?')
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
  requestNumber?: string
  webData?: boolean
}): Schedule {
  if (!schedulesDb) throw new Error('Schedules database not initialized')

  const now = new Date().toISOString()

  const stmt = schedulesDb.prepare(`
    INSERT INTO schedules (text, completed, category, dueDate, clientName, requestNumber, webData, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    schedule.text,
    schedule.completed ? 1 : 0,
    schedule.category || null,
    schedule.dueDate ? schedule.dueDate.toISOString() : null,
    schedule.clientName || null,
    schedule.requestNumber || null,
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
  clientName?: string
  requestNumber?: string
  webData?: boolean
}): Schedule {
  if (!schedulesDb) throw new Error('Schedules database not initialized')

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
  if (updates.clientName !== undefined) {
    fields.push('clientName = ?')
    values.push(updates.clientName || null)
  }
  if (updates.requestNumber !== undefined) {
    fields.push('requestNumber = ?')
    values.push(updates.requestNumber || null)
  }
  if (updates.webData !== undefined) {
    fields.push('webData = ?')
    values.push(updates.webData ? 1 : 0)
  }

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  const stmt = schedulesDb.prepare(`
    UPDATE schedules
    SET ${fields.join(', ')}
    WHERE id = ?
  `)

  stmt.run(...values)
  return getScheduleById(id)!
}

export function deleteSchedule(id: number): boolean {
  if (!schedulesDb) throw new Error('Schedules database not initialized')

  const stmt = schedulesDb.prepare('DELETE FROM schedules WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function deleteCompletedSchedules(): number {
  if (!schedulesDb) throw new Error('Schedules database not initialized')

  const stmt = schedulesDb.prepare('DELETE FROM schedules WHERE completed = 1')
  const result = stmt.run()
  return result.changes
}

// Memo CRUD operations
export function getAllMemos(): Memo[] {
  if (!memosDb) throw new Error('Memos database not initialized')

  const stmt = memosDb.prepare('SELECT * FROM memos ORDER BY createdAt DESC')
  return stmt.all() as Memo[]
}

export function getMemoById(id: number): Memo | undefined {
  if (!memosDb) throw new Error('Memos database not initialized')

  const stmt = memosDb.prepare('SELECT * FROM memos WHERE id = ?')
  return stmt.get(id) as Memo | undefined
}

export function createMemo(memo: { content: string }): Memo {
  if (!memosDb) throw new Error('Memos database not initialized')

  const now = new Date().toISOString()

  const stmt = memosDb.prepare(`
    INSERT INTO memos (content, createdAt, updatedAt)
    VALUES (?, ?, ?)
  `)

  const result = stmt.run(memo.content, now, now)
  return getMemoById(Number(result.lastInsertRowid))!
}

export function updateMemo(id: number, updates: { content: string }): Memo {
  if (!memosDb) throw new Error('Memos database not initialized')

  const now = new Date().toISOString()

  const stmt = memosDb.prepare(`
    UPDATE memos
    SET content = ?, updatedAt = ?
    WHERE id = ?
  `)

  stmt.run(updates.content, now, id)
  return getMemoById(id)!
}

export function deleteMemo(id: number): boolean {
  if (!memosDb) throw new Error('Memos database not initialized')

  const stmt = memosDb.prepare('DELETE FROM memos WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

// TodoStat CRUD operations
export function getTodoStatsByDateRange(startDate: string, endDate: string): TodoStat[] {
  if (!todoStatsDb) throw new Error('Todo stats database not initialized')

  const stmt = todoStatsDb.prepare('SELECT * FROM todo_stats WHERE date >= ? AND date <= ? ORDER BY date ASC')
  return stmt.all(startDate, endDate) as TodoStat[]
}

export function getTodoStatByDate(date: string): TodoStat | undefined {
  if (!todoStatsDb) throw new Error('Todo stats database not initialized')

  const stmt = todoStatsDb.prepare('SELECT * FROM todo_stats WHERE date = ?')
  return stmt.get(date) as TodoStat | undefined
}

export function incrementTodoStat(date: string): TodoStat {
  if (!todoStatsDb) throw new Error('Todo stats database not initialized')

  // Try to get existing stat
  const existing = getTodoStatByDate(date)

  if (existing) {
    // Increment existing count
    const stmt = todoStatsDb.prepare('UPDATE todo_stats SET count = count + 1 WHERE date = ?')
    stmt.run(date)
  } else {
    // Create new entry with count 1
    const stmt = todoStatsDb.prepare('INSERT INTO todo_stats (date, count) VALUES (?, 1)')
    stmt.run(date)
  }

  return getTodoStatByDate(date)!
}

export function resetTodoStat(date: string): boolean {
  if (!todoStatsDb) throw new Error('Todo stats database not initialized')

  const stmt = todoStatsDb.prepare('DELETE FROM todo_stats WHERE date = ?')
  const result = stmt.run(date)
  return result.changes > 0
}

// UserInfo CRUD operations
export function getUserInfo(): UserInfo | undefined {
  if (!userInfoDb) throw new Error('User info database not initialized')

  const stmt = userInfoDb.prepare('SELECT * FROM user_info LIMIT 1')
  return stmt.get() as UserInfo | undefined
}

export function createOrUpdateUserInfo(userInfo: {
  name: string;
  birthday: string;
  supportId?: string;
  supportPw?: string;
}): UserInfo {
  if (!userInfoDb) throw new Error('User info database not initialized')

  const now = new Date().toISOString()

  const existing = getUserInfo()

  if (existing) {
    // Update existing user info
    const fields: string[] = ['name = ?', 'birthday = ?', 'updatedAt = ?']
    const values: any[] = [userInfo.name, userInfo.birthday, now]

    if (userInfo.supportId !== undefined) {
      fields.push('supportId = ?')
      values.push(userInfo.supportId || null)
    }
    if (userInfo.supportPw !== undefined) {
      fields.push('supportPw = ?')
      values.push(userInfo.supportPw || null)
    }

    values.push(existing.id)

    const stmt = userInfoDb.prepare(`
      UPDATE user_info
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values)
  } else {
    // Create new user info
    const stmt = userInfoDb.prepare(`
      INSERT INTO user_info (name, birthday, supportId, supportPw, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      userInfo.name,
      userInfo.birthday,
      userInfo.supportId || null,
      userInfo.supportPw || null,
      now,
      now
    )
  }

  return getUserInfo()!
}

