'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import './history.css'

export default function HistoryPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/get-interviews')
      .then(res => res.json())
      .then(data => setInterviews(data.reverse())) // Newest first
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="history-layout">
      <header className="history-header">
        <div className="brand" onClick={() => router.push('/')}>HireFlow Archive</div>
        <button className="back-btn" onClick={() => router.back()}>Back</button>
      </header>

      <main className="history-content">
        <h1 className="page-title">Interview History</h1>
        
        {loading ? (
          <div className="loading-text">Loading archives...</div>
        ) : interviews.length === 0 ? (
          <div className="empty-state">No interviews recorded yet.</div>
        ) : (
          <div className="interview-grid">
            {interviews.map((item) => (
              <motion.div 
                key={item.id} 
                className="history-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  localStorage.setItem('hireflow_transcript', JSON.stringify(item.transcript));
                  router.push('/report');
                }}
              >
                <div className="card-header">
                  <span className="timestamp">{new Date(item.timestamp).toLocaleString()}</span>
                  <span className="score">Score: {item.evaluation?.score || 'N/A'}</span>
                </div>
                <div className="card-summary">
                  <p>{item.evaluation?.summary?.substring(0, 120)}...</p>
                </div>
                <div className="card-footer">
                  <span>{item.responses?.length} Responses</span>
                  <span className="view-link">View Detailed Report →</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
