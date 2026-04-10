import { useState, useEffect, useRef } from 'react'
import { getDB } from '../db/index'

const todayStr = new Date().toISOString().split('T')[0]

export default function useTimer() {
  const [activeTimer, setActiveTimer] = useState(null)
  const intervalRef = useRef(null)

  const start = (id, type, title) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setActiveTimer({ id, type, title, seconds: 0 })
    intervalRef.current = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev) return null
        return { ...prev, seconds: prev.seconds + 1 }
      })
    }, 1000)
  }

  const stop = async () => {
    clearInterval(intervalRef.current)
    intervalRef.current = null

    setActiveTimer(prev => {
      if (!prev) return null
      saveLog(prev)
      return null
    })
  }

  const saveLog = async (timer) => {
    const db = await getDB()
    await db.add('timerLogs', {
      refId: timer.id,
      type: timer.type,
      title: timer.title,
      seconds: timer.seconds,
      date: todayStr,
      createdAt: new Date().toISOString(),
    })
  }

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return { activeTimer, start, stop, formatTime }
}