import { useState } from 'react'
import { X } from 'lucide-react'

const REVIEW_INTERVALS = [1, 3, 7, 14, 30]

export default function AddItemModal({ category, selectedDate, onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [startDate, setStartDate] = useState(selectedDate)
  const [useReview, setUseReview] = useState(true)

  const handleSave = () => {
    if (!title.trim()) return

    const base = { title: title.trim(), createdAt: new Date().toISOString() }

    if (category === 'schedule') {
      onSave({ ...base, date: selectedDate, startTime, endTime, type: 'schedule' })
    } else if (category === 'todo') {
      onSave({ ...base, date: selectedDate, done: false, type: 'todo' })
    } else if (category === 'study') {
      onSave({
        ...base,
        startDate,
        done: false,
        type: 'study',
        useReview,
        reviewIntervals: useReview ? REVIEW_INTERVALS : [],
        nextReviewDate: useReview ? addDays(startDate, REVIEW_INTERVALS[0]) : null,
        reviewStep: 0,
      })
    } else if (category === 'routine') {
      onSave({ ...base, startDate, done: false, type: 'routine' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-base">
            {category === 'schedule' && '일정 추가'}
            {category === 'todo' && '할일 추가'}
            {category === 'study' && '학습 프로젝트 추가'}
            {category === 'routine' && '루틴 추가'}
          </h3>
          <button onClick={onClose} className="text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              autoFocus
            />
          </div>

          {/* 일정: 시작/종료 시간 */}
          {category === 'schedule' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">시작</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">종료</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          {/* 학습/루틴: 시작일 */}
          {(category === 'study' || category === 'routine') && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          )}

          {/* 학습: 복습 여부 토글 */}
          {category === 'study' && (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">복습 사용</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {useReview ? '에빙하우스: 1→3→7→14→30일' : '복습 없이 진행'}
                  </p>
                </div>
                <button
                  onClick={() => setUseReview(v => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative
                    ${useReview ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all
                      ${useReview ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className="w-full mt-6 py-3 bg-black text-white rounded-xl text-sm font-medium
            disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          저장
        </button>
      </div>
    </div>
  )
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}