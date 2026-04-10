import { useState, useEffect } from 'react'
import { getDB } from '../db/index'
import useTimer from '../hooks/useTimer'
import { Play, Square, Check, Pencil, Trash2, X } from 'lucide-react'

const todayStr = new Date().toISOString().split('T')[0]

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - day + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const REVIEW_INTERVALS = [1, 3, 7, 14, 30]

export default function TodayPage({ nickname }) {
  const [schedules, setSchedules] = useState([])
  const [todos, setTodos] = useState([])
  const [studies, setStudies] = useState([])
  const [routines, setRoutines] = useState([])
  const [memoModal, setMemoModal] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const { activeTimer, start, stop, formatTime } = useTimer()

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
  const db = await getDB()

  const weekDates = getWeekDates()
  let allSchedules = []
  for (const date of weekDates) {
    const s = await db.getAllFromIndex('schedules', 'date', date)
    allSchedules = [...allSchedules, ...s]
  }
  setSchedules(allSchedules)

  const t = await db.getAllFromIndex('todos', 'date', todayStr)
  setTodos(t)

  const allTimerLogs = await db.getAll('timerLogs')

  const allStudies = await db.getAll('studies')
  const todayStudies = allStudies.filter(s =>
    s.startDate <= todayStr && !s.completed &&
    (s.nextReviewDate <= todayStr || s.startDate === todayStr)
  )
  const todayStudiesWithTime = todayStudies.map(s => {
    const total = allTimerLogs
      .filter(l => l.refId === s.id && l.type === 'study')
      .reduce((acc, l) => acc + l.seconds, 0)
    return { ...s, totalSeconds: total }
  })
  setStudies(todayStudiesWithTime)

  const allRoutines = await db.getAll('routines')
  const todayRoutines = allRoutines.filter(r =>
    r.startDate <= todayStr && !r.completed
  )
  const todayRoutinesWithDone = await Promise.all(
    todayRoutines.map(async r => {
      const sessions = await db.getAllFromIndex('routineSessions', 'routineId', r.id)
      const todaySession = sessions.find(s => s.date === todayStr)
      const total = allTimerLogs
        .filter(l => l.refId === r.id && l.type === 'routine')
        .reduce((acc, l) => acc + l.seconds, 0)
      return { ...r, todayDone: !!todaySession?.done, totalSeconds: total }
    })
  )
  setRoutines(todayRoutinesWithDone)
}

  const handleDelete = async (id, store) => {
    const db = await getDB()
    await db.delete(store, id)
    loadAll()
  }

  const handleEdit = async (item, store, newTitle) => {
    const db = await getDB()
    await db.put(store, { ...item, title: newTitle })
    setEditModal(null)
    loadAll()
  }

  const handleTodoDone = async (todo) => {
    const db = await getDB()
    await db.put('todos', { ...todo, done: !todo.done })
    loadAll()
  }

  const handleStudyComplete = async (study) => {
    const db = await getDB()
    const nextStep = study.reviewStep + 1
    if (nextStep >= REVIEW_INTERVALS.length) {
      await db.put('studies', { ...study, completed: true })
    } else {
      await db.put('studies', {
        ...study,
        reviewStep: nextStep,
        nextReviewDate: addDays(todayStr, REVIEW_INTERVALS[nextStep]),
      })
    }
    loadAll()
  }

  const handleStudyEnd = async (study) => {
    const db = await getDB()
    await db.put('studies', { ...study, completed: true })
    loadAll()
  }

  const handleRoutineEnd = async (routine) => {
    const db = await getDB()
    await db.put('routines', { ...routine, completed: true })
    loadAll()
  }

  const handleRoutineDone = async (routine) => {
    const db = await getDB()
    if (routine.todayDone) return
    await db.add('routineSessions', {
      routineId: routine.id,
      date: todayStr,
      done: true,
      memo: '',
      createdAt: new Date().toISOString(),
    })
    loadAll()
  }

  const handleTimerToggle = async (id, type, title) => {
  if (activeTimer?.id === id && activeTimer?.type === type) {
    await stop()
    setTimeout(() => loadAll(), 100)
  } else {
    if (activeTimer) {
      await stop()
    }
    start(id, type, title)
  }
}

  const activeTodos = todos.filter(t => !t.done)
  const doneTodos = todos.filter(t => t.done)
  const activeStudies = studies.filter(s => !s.todayDone)
  const doneStudies = studies.filter(s => s.todayDone)
  const activeRoutines = routines.filter(r => !r.todayDone)
  const doneRoutines = routines.filter(r => r.todayDone)

  return (
    <div className="p-4 space-y-6">
      {/* 주간 일정 */}
      <Section title="주간 일정">
        {schedules.length === 0 ? <Empty /> : schedules.map(s => (
          <div key={s.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-gray-400">{s.date} {s.startTime && `${s.startTime}~${s.endTime}`}</p>
            </div>
            <div className="flex gap-2 ml-2">
              <button onClick={() => setEditModal({ item: s, store: 'schedules' })}>
                <Pencil size={14} className="text-gray-300 hover:text-black" />
              </button>
              <button onClick={() => handleDelete(s.id, 'schedules')}>
                <Trash2 size={14} className="text-gray-300 hover:text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </Section>

      {/* 할일 */}
      <Section title="할일">
        {activeTodos.length === 0 && doneTodos.length === 0 ? <Empty /> : (
          <>
            {activeTodos.map(t => (
              <TodoItem key={t.id} todo={t}
                onDone={handleTodoDone}
                onEdit={() => setEditModal({ item: t, store: 'todos' })}
                onDelete={() => handleDelete(t.id, 'todos')}
              />
            ))}
            {doneTodos.map(t => (
              <TodoItem key={t.id} todo={t} done
                onDone={handleTodoDone}
                onEdit={() => setEditModal({ item: t, store: 'todos' })}
                onDelete={() => handleDelete(t.id, 'todos')}
              />
            ))}
          </>
        )}
      </Section>

      {/* 학습 */}
      <Section title="학습 프로젝트">
        {activeStudies.length === 0 && doneStudies.length === 0 ? <Empty /> : (
          <>
            {activeStudies.map(s => (
              <StudyItem key={s.id} study={s}
                activeTimer={activeTimer}
                formatTime={formatTime}
                onTimer={() => handleTimerToggle(s.id, 'study', s.title)}
                onMemo={() => setMemoModal({ item: s, type: 'study' })}
                onComplete={() => handleStudyComplete(s)}
                onEnd={() => handleStudyEnd(s)}
                onEdit={() => setEditModal({ item: s, store: 'studies' })}
                onDelete={() => handleDelete(s.id, 'studies')}
              />
            ))}
            {doneStudies.map(s => (
              <StudyItem key={s.id} study={s} done
                onEdit={() => setEditModal({ item: s, store: 'studies' })}
                onDelete={() => handleDelete(s.id, 'studies')}
              />
            ))}
          </>
        )}
      </Section>

      {/* 루틴 */}
      <Section title="루틴">
        {activeRoutines.length === 0 && doneRoutines.length === 0 ? <Empty /> : (
          <>
            {activeRoutines.map(r => (
              <RoutineItem key={r.id} routine={r}
                activeTimer={activeTimer}
                formatTime={formatTime}
                onTimer={() => handleTimerToggle(r.id, 'routine', r.title)}
                onMemo={() => setMemoModal({ item: r, type: 'routine' })}
                onDone={() => handleRoutineDone(r)}
                onEnd={() => handleRoutineEnd(r)}
                onEdit={() => setEditModal({ item: r, store: 'routines' })}
                onDelete={() => handleDelete(r.id, 'routines')}
              />
            ))}
            {doneRoutines.map(r => (
  <RoutineItem key={r.id} routine={r} done
    activeTimer={activeTimer}
    formatTime={formatTime}
    onEdit={() => setEditModal({ item: r, store: 'routines' })}
    onDelete={() => handleDelete(r.id, 'routines')}
  />
))}
          </>
        )}
      </Section>

      {memoModal && (
        <MemoModal
          item={memoModal.item}
          type={memoModal.type}
          onClose={() => { setMemoModal(null); loadAll() }}
        />
      )}

      {editModal && (
        <EditModal
          item={editModal.item}
          onClose={() => setEditModal(null)}
          onSave={(newTitle) => handleEdit(editModal.item, editModal.store, newTitle)}
        />
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Empty() {
  return <p className="text-sm text-gray-300 text-center py-4">항목이 없어요</p>
}

function TodoItem({ todo, onDone, onEdit, onDelete, done }) {
  return (
    <div className={`flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3 ${done ? 'opacity-40' : ''}`}>
      <button
        onClick={() => onDone(todo)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${done ? 'bg-black border-black' : 'border-gray-300'}`}
      >
        {done && <Check size={11} color="white" />}
      </button>
      <p className={`text-sm flex-1 ${done ? 'line-through text-gray-400' : ''}`}>{todo.title}</p>
      <div className="flex gap-2">
        <button onClick={onEdit}><Pencil size={14} className="text-gray-300 hover:text-black" /></button>
        <button onClick={onDelete}><Trash2 size={14} className="text-gray-300 hover:text-red-400" /></button>
      </div>
    </div>
  )
}

function StudyItem({ study, activeTimer, formatTime, onTimer, onMemo, onComplete, onEnd, onEdit, onDelete, done }) {
  const isRunning = activeTimer?.id === study.id && activeTimer?.type === 'study'
  return (
    <div className={`border border-gray-100 rounded-xl px-4 py-3 ${done ? 'opacity-40' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium">{study.title}</p>
          {!done && study.useReview && (
  <p className="text-xs text-gray-400 mt-0.5">
    복습 {study.reviewStep + 1}단계 · {REVIEW_INTERVALS[study.reviewStep]}일 후 복습
  </p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button onClick={onEdit}><Pencil size={14} className="text-gray-300 hover:text-black" /></button>
          <button onClick={onDelete}><Trash2 size={14} className="text-gray-300 hover:text-red-400" /></button>
          {!done && (
            <button onClick={onTimer}>
              {isRunning ? <Square size={18} className="text-black" /> : <Play size={18} className="text-gray-400" />}
            </button>
          )}
        </div>
      </div>
      {isRunning && <p className="text-xs font-mono text-black mt-2">{formatTime(activeTimer.seconds)}</p>}
      {!isRunning && study.totalSeconds > 0 && <p className="text-xs font-mono text-gray-400 mt-1">누적 {formatTime(study.totalSeconds)}</p>}
      {!done && (
        <div className="flex gap-2 mt-3">
          <button onClick={onMemo} className="text-xs border border-gray-200 rounded-lg px-3 py-1">메모</button>
          <button onClick={onComplete} className="text-xs border border-gray-200 rounded-lg px-3 py-1">복습완료</button>
          <button onClick={onEnd} className="text-xs border border-gray-200 rounded-lg px-3 py-1 text-gray-400">프로젝트종료</button>
        </div>
      )}
    </div>
  )
}

function RoutineItem({ routine, activeTimer, formatTime, onTimer, onMemo, onDone, onEnd, onEdit, onDelete, done }) {
  const isRunning = activeTimer?.id === routine.id && activeTimer?.type === 'routine'
  return (
    <div className={`border border-gray-100 rounded-xl px-4 py-3 ${done ? 'opacity-40' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex-1">{routine.title}</p>
        <div className="flex items-center gap-2 ml-2">
          <button onClick={onEdit}><Pencil size={14} className="text-gray-300 hover:text-black" /></button>
          <button onClick={onDelete}><Trash2 size={14} className="text-gray-300 hover:text-red-400" /></button>
          {!done && (
            <button onClick={onTimer}>
              {isRunning ? <Square size={18} className="text-black" /> : <Play size={18} className="text-gray-400" />}
            </button>
          )}
        </div>
      </div>
      {isRunning && <p className="text-xs font-mono text-black mt-2">{formatTime(activeTimer.seconds)}</p>}
      {!isRunning && routine.totalSeconds > 0 && <p className="text-xs font-mono text-gray-400 mt-1">누적 {formatTime(routine.totalSeconds)}</p>}
      {!done && (
        <div className="flex gap-2 mt-3">
          <button onClick={onMemo} className="text-xs border border-gray-200 rounded-lg px-3 py-1">메모</button>
          <button onClick={onDone} className="text-xs bg-black text-white rounded-lg px-3 py-1">완료</button>
          <button onClick={onEnd} className="text-xs border border-gray-200 rounded-lg px-3 py-1 text-gray-400">루틴종료</button>
        </div>
      )}
    </div>
  )
}

function EditModal({ item, onClose, onSave }) {
  const [title, setTitle] = useState(item.title)
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">수정</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
          autoFocus
        />
        <button
          onClick={() => onSave(title)}
          disabled={!title.trim()}
          className="w-full mt-4 py-3 bg-black text-white rounded-xl text-sm font-medium disabled:bg-gray-200"
        >
          저장
        </button>
      </div>
    </div>
  )
}

function MemoModal({ item, type, onClose }) {
  const [memo, setMemo] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const db = await getDB()
    let fileData = null
    if (file) {
      const buffer = await file.arrayBuffer()
      fileData = { name: file.name, type: file.type, data: buffer }
    }
    const store = type === 'study' ? 'studySessions' : 'routineSessions'
    const idField = type === 'study' ? 'studyId' : 'routineId'
    await db.add(store, {
      [idField]: item.id,
      date: todayStr,
      memo,
      file: fileData,
      done: true,
      createdAt: new Date().toISOString(),
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">{item.title} — 메모</h3>
          <button onClick={onClose} className="text-gray-400 text-sm">닫기</button>
        </div>
        <textarea
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="오늘 내용을 기록하세요"
          rows={5}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-black resize-none"
        />
        <div className="mt-3">
          <label className="text-xs text-gray-400 mb-1 block">파일 첨부 (이미지/음성)</label>
          <input
            type="file"
            accept="image/*,audio/*"
            onChange={e => setFile(e.target.files[0])}
            className="text-xs text-gray-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 py-3 bg-black text-white rounded-xl text-sm font-medium disabled:bg-gray-200"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}