import { useState, useEffect } from 'react'
import { getDB } from '../db/index'

export default function SettingsPage({ onNicknameChange }) {
  const [nickname, setNickname] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    loadNickname()
  }, [])

  const loadNickname = async () => {
    const db = await getDB()
    const setting = await db.get('settings', 'nickname')
    if (setting) setNickname(setting.value)
  }

  const saveNickname = async () => {
    const db = await getDB()
    await db.put('settings', { key: 'nickname', value: nickname })
    onNicknameChange(nickname)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = async () => {
    const db = await getDB()
    const data = {
      schedules: await db.getAll('schedules'),
      todos: await db.getAll('todos'),
      studies: await db.getAll('studies'),
      studySessions: await db.getAll('studySessions'),
      routines: await db.getAll('routines'),
      routineSessions: await db.getAll('routineSessions'),
      timerLogs: await db.getAll('timerLogs'),
      settings: await db.getAll('settings'),
    }

    // 파일 데이터는 ArrayBuffer라 JSON 변환 불가 — 제외 후 안내
    const cleaned = JSON.parse(JSON.stringify(data, (key, value) => {
      if (value instanceof ArrayBuffer) return null
      return value
    }))

    const blob = new Blob([JSON.stringify(cleaned, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-manager-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text)
    const db = await getDB()

    const stores = ['schedules', 'todos', 'studies', 'studySessions', 'routines', 'routineSessions', 'timerLogs', 'settings']
    for (const store of stores) {
      if (!data[store]) continue
      await db.clear(store)
      for (const item of data[store]) {
        await db.put(store, item)
      }
    }
    alert('가져오기 완료! 앱을 새로고침해주세요.')
    e.target.value = ''
  }

  const handleReset = async () => {
    const db = await getDB()
    const stores = ['schedules', 'todos', 'studies', 'studySessions', 'routines', 'routineSessions', 'timerLogs', 'settings']
    for (const store of stores) {
      await db.clear(store)
    }
    setNickname('')
    onNicknameChange('')
    setConfirmReset(false)
    alert('초기화 완료!')
  }

  return (
    <div className="p-4 space-y-8">
      {/* 별명 */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">별명</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="별명을 입력하세요"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            onClick={saveNickname}
            className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium"
          >
            {saved ? '✓' : '저장'}
          </button>
        </div>
      </div>

      {/* 백업 */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">백업</h3>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-left hover:border-gray-400 transition-colors"
          >
            📤 내보내기
            <span className="text-xs text-gray-400 ml-2">JSON 파일로 저장</span>
          </button>
          <label className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm flex items-center hover:border-gray-400 transition-colors cursor-pointer">
            📥 가져오기
            <span className="text-xs text-gray-400 ml-2">JSON 파일 불러오기</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 초기화 */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">초기화</h3>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-red-400 text-left hover:border-red-300 transition-colors"
          >
            🗑️ 모든 데이터 초기화
          </button>
        ) : (
          <div className="border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-500 mb-3">정말 모든 데이터를 삭제할까요? 되돌릴 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium"
              >
                삭제
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}