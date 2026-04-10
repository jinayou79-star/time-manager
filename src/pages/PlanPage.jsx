import { useState, useEffect } from 'react'
import Calendar from '../components/Calendar'
import AddItemModal from '../components/AddItemModal'
import { getDB } from '../db/index'
import { Plus, Trash2 } from 'lucide-react'

const CATEGORIES = [
  { id: 'schedule', label: '일정' },
  { id: 'todo',     label: '할일' },
  { id: 'study',    label: '학습' },
  { id: 'routine',  label: '루틴' },
]

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

export default function PlanPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [activeCategory, setActiveCategory] = useState('schedule')
  const [showModal, setShowModal] = useState(false)
  const [items, setItems] = useState([])

  useEffect(() => {
    loadItems()
  }, [selectedDate, activeCategory])

  const loadItems = async () => {
    const db = await getDB()
    let data = []
    if (activeCategory === 'schedule') {
      data = await db.getAllFromIndex('schedules', 'date', selectedDate)
    } else if (activeCategory === 'todo') {
      data = await db.getAllFromIndex('todos', 'date', selectedDate)
    } else if (activeCategory === 'study') {
      data = await db.getAll('studies')
      data = data.filter(d => d.startDate <= selectedDate && !d.completed)
    } else if (activeCategory === 'routine') {
      data = await db.getAll('routines')
      data = data.filter(d => d.startDate <= selectedDate && !d.completed)
    }
    setItems(data)
  }

  const handleSave = async (item) => {
    const db = await getDB()
    if (activeCategory === 'schedule') {
      await db.add('schedules', item)
    } else if (activeCategory === 'todo') {
      await db.add('todos', item)
    } else if (activeCategory === 'study') {
      await db.add('studies', item)
    } else if (activeCategory === 'routine') {
      await db.add('routines', item)
    }
    setShowModal(false)
    loadItems()
  }

  const handleDelete = async (id) => {
    const db = await getDB()
    const storeMap = {
      schedule: 'schedules',
      todo: 'todos',
      study: 'studies',
      routine: 'routines',
    }
    await db.delete(storeMap[activeCategory], id)
    loadItems()
  }

  return (
    <div className="p-4">
      <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <div className="mt-6 mb-3">
        <span className="text-sm font-bold">
          {selectedDate.replace(/-/g, '.')}
        </span>
      </div>
      <div className="flex gap-2 mb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
              ${activeCategory === cat.id
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-400 border-gray-200'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-gray-300 text-center py-8">
            항목이 없어요
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                {item.startTime && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.startTime} ~ {item.endTime}
                  </p>
                )}
                {item.startDate && activeCategory !== 'schedule' && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    시작일: {item.startDate}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-gray-300 hover:text-red-400 transition-colors ml-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-4 w-12 h-12 bg-black text-white rounded-full
          flex items-center justify-center shadow-lg"
      >
        <Plus size={22} />
      </button>
      {showModal && (
        <AddItemModal
          category={activeCategory}
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}