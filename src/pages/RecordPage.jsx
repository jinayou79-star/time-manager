import { useState, useEffect } from 'react'
import { getDB } from '../db/index'
import { X, BookOpen } from 'lucide-react'

const todayStr = new Date().toISOString().split('T')[0]

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const REVIEW_INTERVALS = [1, 3, 7, 14, 30]

export default function RecordPage() {
  const [activeTab, setActiveTab] = useState('review')
  const [reviewItems, setReviewItems] = useState([])
  const [routines, setRoutines] = useState([])
  const [selectedRoutine, setSelectedRoutine] = useState('all')
  const [sessions, setSessions] = useState([])
  const [detailModal, setDetailModal] = useState(null)
  const [reviewDetailModal, setReviewDetailModal] = useState(null)

  useEffect(() => {
    loadReviews()
    loadRoutines()
  }, [])

  useEffect(() => {
    loadSessions()
  }, [selectedRoutine, routines])

  const loadReviews = async () => {
    const db = await getDB()
    const allStudies = await db.getAll('studies')
    const pending = allStudies.filter(s =>
      !s.completed && s.nextReviewDate <= todayStr
    )
    // 각 학습의 세션 불러오기
    const withSessions = await Promise.all(
      pending.map(async s => {
        const sessions = await db.getAllFromIndex('studySessions', 'studyId', s.id)
        const latestSession = sessions
          .filter(ses => ses.date < todayStr)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
        return { ...s, latestSession }
      })
    )
    setReviewItems(withSessions)
  }

  const loadRoutines = async () => {
    const db = await getDB()
    const all = await db.getAll('routines')
    setRoutines(all)
  }

  const loadSessions = async () => {
    const db = await getDB()
    let all = []
    if (selectedRoutine === 'all') {
      all = await db.getAll('routineSessions')
    } else {
      all = await db.getAllFromIndex('routineSessions', 'routineId', Number(selectedRoutine))
    }
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const withNames = all.map(s => {
      const routine = routines.find(r => r.id === s.routineId)
      return { ...s, routineName: routine?.title || '삭제된 루틴' }
    })
    setSessions(withNames)
  }

  const handleReviewComplete = async (study) => {
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
    loadReviews()
  }

  return (
    <div className="p-4">
      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('review')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
            ${activeTab === 'review'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-400 border-gray-200'}`}
        >
          복습 대기 {reviewItems.length > 0 && `(${reviewItems.length})`}
        </button>
        <button
          onClick={() => setActiveTab('routine')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
            ${activeTab === 'routine'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-400 border-gray-200'}`}
        >
          루틴 기록
        </button>
      </div>

      {/* 복습 대기 */}
      {activeTab === 'review' && (
        <div className="space-y-2">
          {reviewItems.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-8">복습할 항목이 없어요 🎉</p>
          ) : (
            reviewItems.map(item => (
              <div key={item.id} className="border border-gray-100 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      복습 {item.reviewStep + 1}단계 · 복습일 {item.nextReviewDate}
                    </p>
                  </div>
                  <BookOpen size={16} className="text-gray-300 ml-2" />
                </div>
                <div className="flex gap-2 mt-3">
                  {item.latestSession && (
                    <button
                      onClick={() => setReviewDetailModal(item)}
                      className="text-xs border border-gray-200 rounded-lg px-3 py-1"
                    >
                      이전 메모 보기
                    </button>
                  )}
                  <button
                    onClick={() => handleReviewComplete(item)}
                    className="text-xs bg-black text-white rounded-lg px-3 py-1"
                  >
                    복습완료
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 루틴 기록 */}
      {activeTab === 'routine' && (
        <div>
          {/* 루틴 필터 */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedRoutine('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors
                ${selectedRoutine === 'all'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-400 border-gray-200'}`}
            >
              전체
            </button>
            {routines.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRoutine(String(r.id))}
                className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-colors
                  ${selectedRoutine === String(r.id)
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-400 border-gray-200'}`}
              >
                {r.title}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-300 text-center py-8">기록이 없어요</p>
            ) : (
              sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setDetailModal(s)}
                  className="w-full text-left border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{s.routineName}</p>
                    <p className="text-xs text-gray-400">{s.date}</p>
                  </div>
                  {s.memo && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.memo}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 루틴 상세 모달 */}
      {detailModal && (
        <DetailModal
          session={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}

      {/* 복습 이전 메모 모달 */}
      {reviewDetailModal && (
        <ReviewDetailModal
          item={reviewDetailModal}
          onClose={() => setReviewDetailModal(null)}
        />
      )}
    </div>
  )
}

function DetailModal({ session, onClose }) {
  const [fileUrl, setFileUrl] = useState(null)

  useEffect(() => {
    if (session.file) {
      const blob = new Blob([session.file.data], { type: session.file.type })
      setFileUrl(URL.createObjectURL(blob))
    }
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl) }
  }, [session])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">{session.routineName}</h3>
            <p className="text-xs text-gray-400">{session.date}</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        {session.memo
          ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.memo}</p>
          : <p className="text-sm text-gray-300">메모 없음</p>
        }
        {fileUrl && (
          <div className="mt-4">
            {session.file.type.startsWith('image/')
              ? <img src={fileUrl} alt="첨부 이미지" className="w-full rounded-xl" />
              : <audio controls src={fileUrl} className="w-full mt-2" />
            }
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewDetailModal({ item, onClose }) {
  const [fileUrl, setFileUrl] = useState(null)
  const session = item.latestSession

  useEffect(() => {
    if (session?.file) {
      const blob = new Blob([session.file.data], { type: session.file.type })
      setFileUrl(URL.createObjectURL(blob))
    }
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl) }
  }, [item])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">{item.title}</h3>
            <p className="text-xs text-gray-400">{session?.date} 메모</p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        {session?.memo
          ? <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.memo}</p>
          : <p className="text-sm text-gray-300">메모 없음</p>
        }
        {fileUrl && (
          <div className="mt-4">
            {session.file.type.startsWith('image/')
              ? <img src={fileUrl} alt="첨부 이미지" className="w-full rounded-xl" />
              : <audio controls src={fileUrl} className="w-full mt-2" />
            }
          </div>
        )}
      </div>
    </div>
  )
}