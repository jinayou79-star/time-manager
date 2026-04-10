import { useState, useEffect } from 'react'
import { getDB } from '../db/index'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function getWeekRange(offset = 0) {
  const today = new Date()
  const day = today.getDay()
  const start = new Date(today)
  start.setDate(today.getDate() - day + offset * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`,
  }
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return '-'
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function AnalysisPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [logs, setLogs] = useState([])
  const [routines, setRoutines] = useState([])
  const [studies, setStudies] = useState([])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const db = await getDB()
    setLogs(await db.getAll('timerLogs'))
    setRoutines(await db.getAll('routines'))
    setStudies(await db.getAll('studies'))
  }

  const week = getWeekRange(weekOffset)
  const weekLogs = logs.filter(l => l.date >= week.start && l.date <= week.end)
  const weekTotal = weekLogs.reduce((acc, l) => acc + l.seconds, 0)

  const allItems = [
    ...routines.map(r => ({ ...r, itemType: 'routine' })),
    ...studies.map(s => ({ ...s, itemType: 'study' })),
  ]

  return (
    <div className="p-4">
      {/* 주 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 text-gray-400">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold">{week.label}</span>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          disabled={weekOffset >= 0}
          className="p-1 text-gray-400 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 총 시간 */}
      <div className="text-center mb-6">
        <p className="text-xs text-gray-400">이번 주 총 시간</p>
        <p className="text-2xl font-bold mt-1">
          {weekTotal > 0 ? formatTime(weekTotal) : '0m'}
        </p>
      </div>

      {/* 표 */}
      {allItems.length === 0 ? (
        <p className="text-sm text-gray-300 text-center py-8">기록이 없어요</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left text-gray-400 font-medium py-2 pr-3 whitespace-nowrap">항목</th>
                {DAY_LABELS.map((label, i) => {
                  const date = new Date(week.start)
                  date.setDate(date.getDate() + i)
                  return (
                    <th key={i} className="text-center text-gray-400 font-medium py-2 px-2 whitespace-nowrap">
                      {label}
                    </th>
                  )
                })}
                <th className="text-center text-gray-400 font-medium py-2 px-2 whitespace-nowrap">합계</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map(item => {
                const dayTotals = DAY_LABELS.map((_, i) => {
                  const date = new Date(week.start)
                  date.setDate(date.getDate() + i)
                  const dateStr = date.toISOString().split('T')[0]
                  return weekLogs
                    .filter(l => l.date === dateStr && l.refId === item.id && l.type === item.itemType)
                    .reduce((acc, l) => acc + l.seconds, 0)
                })
                const itemTotal = dayTotals.reduce((a, b) => a + b, 0)

                return (
                  <tr key={`${item.itemType}-${item.id}`} className="border-t border-gray-100">
                    <td className="py-2 pr-3 font-medium text-gray-600 whitespace-nowrap">{item.title}</td>
                    {dayTotals.map((t, i) => (
                      <td key={i} className="text-center py-2 px-2 text-gray-500">
                        {t > 0 ? formatTime(t) : <span className="text-gray-200">-</span>}
                      </td>
                    ))}
                    <td className="text-center py-2 px-2 font-bold">
                      {itemTotal > 0 ? formatTime(itemTotal) : <span className="text-gray-200">-</span>}
                    </td>
                  </tr>
                )
              })}
              {/* 합계 행 */}
              <tr className="border-t-2 border-gray-200">
                <td className="py-2 pr-3 font-bold text-gray-600">합계</td>
                {DAY_LABELS.map((_, i) => {
                  const date = new Date(week.start)
                  date.setDate(date.getDate() + i)
                  const dateStr = date.toISOString().split('T')[0]
                  const dayTotal = weekLogs
                    .filter(l => l.date === dateStr)
                    .reduce((acc, l) => acc + l.seconds, 0)
                  return (
                    <td key={i} className="text-center py-2 px-2 font-bold">
                      {dayTotal > 0 ? formatTime(dayTotal) : <span className="text-gray-200">-</span>}
                    </td>
                  )
                })}
                <td className="text-center py-2 px-2 font-bold">
                  {weekTotal > 0 ? formatTime(weekTotal) : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}