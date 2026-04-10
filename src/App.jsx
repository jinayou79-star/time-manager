import { useState, useEffect } from 'react'
import { getDB } from './db/index'
import PlanPage from './pages/PlanPage'
import TodayPage from './pages/TodayPage'
import RecordPage from './pages/RecordPage'
import AnalysisPage from './pages/AnalysisPage'
import SettingsPage from './pages/SettingsPage'

const TABS = [
  { id: 'plan',     label: '계획',  icon: '📅' },
  { id: 'today',    label: '오늘',  icon: '☀️' },
  { id: 'record',   label: '기록',  icon: '📒' },
  { id: 'analysis', label: '분석',  icon: '📊' },
  { id: 'settings', label: '설정',  icon: '⚙️' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('today')
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    const setup = async () => {
      const db = await getDB()
      const setting = await db.get('settings', 'nickname')
      if (setting) setNickname(setting.value)
    }
    setup()
  }, [])

  const renderPage = () => {
    switch (activeTab) {
      case 'plan':     return <PlanPage />
      case 'today':    return <TodayPage nickname={nickname} />
      case 'record':   return <RecordPage />
      case 'analysis': return <AnalysisPage />
      case 'settings': return <SettingsPage onNicknameChange={setNickname} />
      default:         return <TodayPage nickname={nickname} />
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
      {/* 헤더 */}
      <header className="px-4 pt-8 pb-4 border-b border-gray-100">
        <h1 className="text-lg font-bold tracking-tight">
          {nickname ? `${nickname}의 하루` : '오늘도 화이팅'}
        </h1>
      </header>

      {/* 페이지 */}
      <main className="flex-1 overflow-y-auto pb-20">
        {renderPage()}
      </main>

      {/* 하단 탭바 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs transition-colors
                ${activeTab === tab.id ? 'text-black font-semibold' : 'text-gray-400'}`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}