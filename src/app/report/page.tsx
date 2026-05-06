'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import './report.css';

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const transcriptStr = localStorage.getItem('hireflow_transcript');
    if (!transcriptStr) {
      setError("No interview transcript found.");
      setIsLoading(false);
      return;
    }

    try {
      const transcript = JSON.parse(transcriptStr);
      fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      })
        .then(res => res.json())
        .then(evaluation => {
          if (evaluation.error) throw new Error(evaluation.error);
          setReport(evaluation);

          // Save to localStorage
          localStorage.setItem(
            'hireflow_evaluation',
            JSON.stringify(evaluation)
          )

          // Save to Supabase
          const sessionId = localStorage.getItem('hireflow_session_id')
          if (sessionId) {
            fetch('/api/save-evaluation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, evaluation }),
            }).catch(console.error)
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    } catch (e) {
      setError("Invalid transcript format.");
      setIsLoading(false);
    }
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#3ecf8e'  // green — Exceptional
    if (score >= 75) return '#5ab4f5'  // blue — Strong
    if (score >= 60) return '#f5a623'  // amber — Good
    if (score >= 40) return '#f5c842'  // yellow — Average
    if (score >= 25) return '#e05c5c'  // red — Weak
    return '#8b0000'                   // dark red — Poor
  }

  const getGradeBand = (score: number) => {
    if (score >= 90) return 'EXCEPTIONAL'
    if (score >= 75) return 'STRONG'
    if (score >= 60) return 'GOOD'
    if (score >= 40) return 'AVERAGE'
    if (score >= 25) return 'WEAK'
    return 'POOR'
  }

  const getRecommendationStyle = (rec: string) => {
    switch(rec) {
      case 'Strong Yes': 
        return { bg: '#edfaf4', color: '#1a7a4a', 
                 border: '#3ecf8e' }
      case 'Yes':        
        return { bg: '#f0faf5', color: '#2a8a5a',
                 border: '#4ecf8e' }
      case 'Maybe':      
        return { bg: '#fdf8ed', color: '#7a5a10',
                 border: '#f5a623' }
      case 'No':         
        return { bg: '#fdf0f0', color: '#8a2020',
                 border: '#e05c5c' }
      case 'Strong No':  
        return { bg: '#fde8e8', color: '#6a0000',
                 border: '#c03030' }
      default:           
        return { bg: '#f5f5f5', color: '#444',
                 border: '#ccc' }
    }
  }

  if (isLoading) {
    return (
      <div className="report-loading">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" as const }}
        />
        <div className="loading-text font-ui">Analyzing Interview Transcript...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-loading">
        <div className="error-text font-ui">{error}</div>
        <button className="btn-return font-ui" onClick={() => router.push('/')}>Return Home</button>
      </div>
    );
  }

  const scoreColor = getScoreColor(report.overallScore);
  const recStyle = getRecommendationStyle(report.hiringRecommendation);

  return (
    <div className="report-layout">
      <header className="report-header">
        <div className="logo-section" onClick={() => router.push('/')}>
          <span className="logo-icon font-ui">/</span>
          <span className="logo-text font-ui">HireFlow Evaluation</span>
        </div>
        <div className="header-actions">
          <button className="btn-export font-ui" onClick={() => window.print()}>Export PDF</button>
        </div>
      </header>

      <main className="report-content">
        <div className="report-top-grid">
          <motion.div 
            className="score-hero-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="score-value font-hero" style={{ color: scoreColor }}>
              {report.overallScore}
            </div>
            <div className="grade-band font-hero" style={{ color: scoreColor, fontSize: '1.2rem', marginTop: '-10px', letterSpacing: '2px' }}>
              {getGradeBand(report.overallScore)}
            </div>
            <div className="percentile font-ui" style={{ color: '#888', marginTop: '10px', fontSize: '0.9rem' }}>
              {report.percentile}
            </div>
          </motion.div>

          <motion.div 
            className="rec-hero-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="rec-chip font-ui" style={{ 
              backgroundColor: recStyle.bg, 
              color: recStyle.color, 
              border: `1px solid ${recStyle.border}`,
              padding: '6px 16px',
              borderRadius: '20px',
              display: 'inline-block',
              fontWeight: 600,
              marginBottom: '15px'
            }}>
              {report.hiringRecommendation}
            </div>
            <div className="rec-reason">{report.recommendationReason}</div>
            
            <div className="sentiment-box" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <span className="pill font-ui">{report.sentimentAnalysis.overallSentiment}</span>
              <span className="pill font-ui">{report.sentimentAnalysis.confidenceLevel} Confidence</span>
            </div>
          </motion.div>
        </div>

        <div className="categories-section">
          <h2 className="section-title font-ui">Competency Analysis</h2>
          <div className="category-bars">
            {Object.entries(report.categoryScores).map(([key, value]: [string, any], i) => (
              <div key={key} className="bar-row">
                <div className="bar-label font-ui">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="bar-bg">
                  <motion.div 
                    className="bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ delay: i * 0.15, duration: 1, ease: "easeOut" as const }}
                    style={{ backgroundColor: getScoreColor(value) }}
                  />
                </div>
                <div className="bar-val font-ui">{value}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stage-grid">
          {Object.entries(report.stagePerformance).map(([stage, data]: [string, any]) => (
            <motion.div 
              key={stage} 
              className="stage-card"
              style={{ borderLeft: `4px solid ${getScoreColor(data.score)}` }}
              whileHover={{ y: -5 }}
            >
              <div className="stage-name font-ui">{stage.toUpperCase()}</div>
              <div className="stage-score font-ui" style={{ color: getScoreColor(data.score) }}>{data.score}/100</div>
              <p className="stage-notes">{data.notes}</p>
            </motion.div>
          ))}
        </div>

        <div className="language-section">
          <h2 className="section-title font-ui">Technical Proficiencies</h2>
          <table className="lang-table">
            <thead>
              <tr className="font-ui">
                <th>Language</th>
                <th>Self</th>
                <th>Assessed</th>
                <th>Gap Analysis</th>
              </tr>
            </thead>
            <tbody>
              {report.languageRatings.map((l: any, i: number) => (
                <tr key={i}>
                  <td className="font-ui" style={{ fontWeight: 600 }}>{l.language}</td>
                  <td>{l.selfRating}/5</td>
                  <td>{l.assessedRating}/5</td>
                  <td style={{ color: l.assessedRating >= l.selfRating ? '#3ecf8e' : '#e05c5c' }}>
                    {l.gap}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="split-grid">
          <div className="grid-card">
            <h3 className="card-title font-ui">Key Strengths</h3>
            <ul className="bullet-list">
              {report.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="grid-card" style={{ borderLeft: '4px solid #f5a623' }}>
            <h3 className="card-title font-ui">Development Areas</h3>
            <ol className="numbered-list">
              {report.developmentAreas.map((d: string, i: number) => <li key={i}>{d}</li>)}
            </ol>
          </div>
        </div>

        <div className="summary-section">
          <h2 className="section-title font-ui">Performance Summary</h2>
          <p className="summary-text">{report.performanceSummary}</p>
        </div>
      </main>

      <style jsx>{`
        .report-top-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-bottom: 40px; }
        .score-hero-card, .rec-hero-card { 
          background: white; padding: 40px; border-radius: 12px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center;
        }
        .rec-hero-card { text-align: left; display: flex; flex-direction: column; justify-content: center; }
        .category-bars { display: flex; flex-direction: column; gap: 20px; margin: 30px 0; }
        .bar-row { display: grid; grid-template-columns: 200px 1fr 50px; align-items: center; gap: 20px; }
        .bar-bg { height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; }
        .stage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 40px 0; }
        .stage-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
        .stage-name { font-size: 0.7rem; letter-spacing: 1px; color: #888; }
        .stage-score { font-size: 1.2rem; font-weight: 700; margin: 5px 0; }
        .lang-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 12px; overflow: hidden; }
        .lang-table th { background: #f9f9f9; text-align: left; padding: 15px; font-size: 0.8rem; color: #666; }
        .lang-table td { padding: 15px; border-top: 1px solid #eee; }
        .pill { background: #f0f0f0; padding: 4px 12px; border-radius: 15px; font-size: 0.8rem; color: #666; }
        .numbered-list { padding-left: 20px; }
        .numbered-list li { margin-bottom: 10px; color: #444; }
      `}</style>
    </div>
  );
}

