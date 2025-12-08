import { useState } from 'react'
import Head from 'next/head'
import Timeline from '@/components/Timeline'
import Calendar from '@/components/Calendar'
import UploadBox from '@/components/UploadBox'

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentView, setCurrentView] = useState<'timeline' | 'calendar'>('timeline')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showTextModal, setShowTextModal] = useState(false)

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
    setCurrentView('timeline')
  }

  const handleTodayClick = () => {
    setCurrentDate(new Date())
    setCurrentView('timeline')
  }

  const handleAddTextClick = () => {
    setCurrentView('timeline')
    setShowTextModal(true)
  }

  return (
    <>
      <Head>
        <title>Piclog - Photo Timeline Memory</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#FFD700" />
      </Head>
      <div className="app-container">
        <header className="app-header">
          <h1>Piclog</h1>
        </header>

      <main className="app-main">
        {currentView === 'timeline' ? (
          <Timeline
            refreshTrigger={refreshTrigger}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            externalShowTextModal={showTextModal}
            onTextModalClose={() => setShowTextModal(false)}
          />
        ) : (
          <Calendar onDateSelect={handleDateSelect} currentDate={currentDate} />
        )}
      </main>

      <nav className="app-nav">
        <button
          className={`nav-button ${currentView === 'calendar' ? 'active' : ''}`}
          onClick={() => setCurrentView('calendar')}
        >
          <span className="text-2xl">📆</span>
          <span className="text-sm font-medium">캘린더 보기</span>
        </button>
        <UploadBox onUploadSuccess={handleUploadSuccess} currentDate={currentDate} />
        <button
          className="nav-button"
          onClick={handleAddTextClick}
        >
          <span className="text-2xl">✏️</span>
          <span className="text-sm font-medium">텍스트 추가</span>
        </button>
        <button
          className="nav-button"
          onClick={handleTodayClick}
        >
          <span className="text-2xl">📖</span>
          <span className="text-sm font-medium">오늘의 기록</span>
        </button>
      </nav>

      <footer className="app-footer">
        <div className="feedback-section">
          <div>
            <span className="feedback-emoji">🩵</span>
            Piclog가 더 좋아질 수 있도록 의견을 들려주세요!
          </div>
          <a
            href="https://forms.gle/7VaxGnDrMigQoZTLA"
            target="_blank"
            rel="noopener noreferrer"
            className="feedback-link"
          >
            → 의견 보내기
          </a>
        </div>
        <div className="copyright">
          © 2025 <strong>Piclog</strong> — Photo Timeline Memory.<br />
          Designed & Developed by <strong>kong</strong>.<br />
          All rights reserved.
        </div>
      </footer>
    </div>
    </>
  )
}
