import { openDB } from 'idb'

const DB_NAME = 'time-manager'
const DB_VERSION = 1

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 일정
      if (!db.objectStoreNames.contains('schedules')) {
        const s = db.createObjectStore('schedules', { keyPath: 'id', autoIncrement: true })
        s.createIndex('date', 'date')
      }
      // 할일
      if (!db.objectStoreNames.contains('todos')) {
        const t = db.createObjectStore('todos', { keyPath: 'id', autoIncrement: true })
        t.createIndex('date', 'date')
      }
      // 학습 프로젝트
      if (!db.objectStoreNames.contains('studies')) {
        const st = db.createObjectStore('studies', { keyPath: 'id', autoIncrement: true })
        st.createIndex('startDate', 'startDate')
      }
      // 학습 세션 (날짜별 메모/파일/타이머)
      if (!db.objectStoreNames.contains('studySessions')) {
        const ss = db.createObjectStore('studySessions', { keyPath: 'id', autoIncrement: true })
        ss.createIndex('studyId', 'studyId')
        ss.createIndex('date', 'date')
      }
      // 루틴
      if (!db.objectStoreNames.contains('routines')) {
        db.createObjectStore('routines', { keyPath: 'id', autoIncrement: true })
      }
      // 루틴 세션 (날짜별 메모/파일/타이머)
      if (!db.objectStoreNames.contains('routineSessions')) {
        const rs = db.createObjectStore('routineSessions', { keyPath: 'id', autoIncrement: true })
        rs.createIndex('routineId', 'routineId')
        rs.createIndex('date', 'date')
      }
      // 타이머 기록
      if (!db.objectStoreNames.contains('timerLogs')) {
        const tl = db.createObjectStore('timerLogs', { keyPath: 'id', autoIncrement: true })
        tl.createIndex('date', 'date')
        tl.createIndex('type', 'type')
      }
      // 설정
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    },
  })
}

export const getDB = async () => initDB()