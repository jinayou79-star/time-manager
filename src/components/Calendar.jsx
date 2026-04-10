import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar({ selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const toDateStr = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="w-full">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-black">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold">
          {year}년 {month + 1}월
        </span>
        <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-black">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs py-1 font-medium
              ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dateStr = toDateStr(year, month, day)
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const dayOfWeek = (firstDay + day - 1) % 7

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square flex items-center justify-center text-sm rounded-full mx-auto w-8 h-8
                transition-colors
                ${isSelected ? 'bg-black text-white' : ''}
                ${isToday && !isSelected ? 'border border-black text-black' : ''}
                ${!isSelected && !isToday && dayOfWeek === 0 ? 'text-red-400' : ''}
                ${!isSelected && !isToday && dayOfWeek === 6 ? 'text-blue-400' : ''}
                ${!isSelected && !isToday ? 'hover:bg-gray-100' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}