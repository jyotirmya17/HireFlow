'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import GridBackground from '@/components/GridBackground'

const RubiksCube = dynamic(
  () => import('@/components/RubiksCube'),
  { ssr: false }
)

const STARS = Array.from({ length: 40 }, (_, i) => ({
  top: `${((i * 37 + 11) % 97)}%`,
  left: `${((i * 53 + 7) % 99)}%`,
  opacity: ((i % 5) + 1) * 0.07,
  size: (i % 2) + 1,
}))

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: 'easeOut' }
})

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') {
        router.push('/interview')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router])

  return (
    <main style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: '#080808',
      overflow: 'hidden',
      fontFamily: 'Syne, sans-serif',
    }}>

      {/* Grid */}
      <GridBackground />

      {/* Stars */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: s.top, left: s.left,
          width: s.size, height: s.size,
          borderRadius: '50%',
          background: 'white',
          opacity: s.opacity,
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      ))}

      {/* Grain */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.025,
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* TOP BAR */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        zIndex: 10,
      }}>
        {/* Logo */}
        <motion.div {...fade(0.05)} style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          HireFlow
        </motion.div>

        {/* Badge */}
        <motion.div {...fade(0.1)}>
          <span style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
            fontFamily: 'Syne',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            padding: '4px 14px',
            borderRadius: '100px',
            textTransform: 'uppercase' as const,
          }}>
            Now in Beta
          </span>
        </motion.div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        width: '100%',
        height: '100%',
        paddingTop: '64px',
      }}>

        {/* LEFT */}
        <div style={{
          width: '52%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 0 0 64px',
        }}>

          <motion.h1 {...fade(0.2)} style={{
            fontFamily: "var(--font-archivo-black), sans-serif",
            fontSize: '56px',
            fontWeight: 400,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: '0 0 22px 0',
          }}>
            <div style={{ whiteSpace: 'nowrap' }}>
              Clarity in Thought.
            </div>
            <div style={{ whiteSpace: 'nowrap' }}>
              Precision in Hiring.
            </div>
          </motion.h1>

          {/* Subtext */}
          <motion.p {...fade(0.35)} style={{
            fontFamily: 'var(--font-dm-sans), sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            color: '#888888',
            lineHeight: 1.6,
            margin: '0 0 40px 0',
            maxWidth: '540px',
            opacity: 0.8,
          }}>
            HireFlow conducts structured voice interviews, evaluates candidates<br />
            deeply, and delivers honest reports — instantly.
          </motion.p>

          {/* CTA */}
          <motion.div {...fade(0.5)}>
            <button
              onClick={() => router.push('/interview')}
              style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '13px 28px',
                borderRadius: '8px',
                cursor: 'pointer',
                letterSpacing: '0.01em',
                transition: 'all 180ms ease',
                display: 'inline-block',
              }}
              onMouseEnter={e => {
                const t = e.currentTarget
                t.style.transform = 'translateY(-2px)'
                t.style.boxShadow = 
                  '0 8px 28px rgba(255,255,255,0.14)'
                t.style.background = '#f0f0f0'
              }}
              onMouseLeave={e => {
                const t = e.currentTarget
                t.style.transform = 'translateY(0)'
                t.style.boxShadow = 'none'
                t.style.background = '#ffffff'
              }}
            >
              Let's Begin →
            </button>
          </motion.div>

          {/* Keyboard hint */}
          <motion.div {...fade(0.65)} style={{
            marginTop: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            color: '#3a3a3a',
            fontFamily: 'Syne, sans-serif',
            fontSize: '12px',
          }}>
            <span>Press</span>
            <span style={{
              background: '#181818',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              padding: '2px 7px',
              color: '#555',
              fontSize: '11px',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}>B</span>
            <span>to begin</span>
          </motion.div>

        </div>

        {/* RIGHT — Cube */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.2 }}
          style={{
            width: '48%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Purple glow */}
          <div style={{
            position: 'absolute',
            width: '454px',
            height: '454px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.08) 50%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }} />

          {/* Cube */}
          <div style={{
            width: '567px',
            height: '567px',
            position: 'relative',
            zIndex: 2,
            marginTop: '-50px',
          }}>
            <RubiksCube />
          </div>
        </motion.div>

      </div>
    </main>
  )
}
