'use client'
import { useEffect, useRef, useState } from 'react'

export default function GridBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })
  const [ripples, setRipples] = useState<{ x: number, y: number, id: number }[]>([])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    const handleClick = (e: MouseEvent) => {
      const newRipple = { x: e.clientX, y: e.clientY, id: Date.now() }
      setRipples(prev => [...prev, newRipple])
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id))
      }, 1000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: '#080808',
      }}
    >
      {/* Grid Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Mouse Glow */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
        left: mousePos.x - 300,
        top: mousePos.y - 300,
        pointerEvents: 'none',
        transition: 'transform 0.1s ease-out',
      }} />

      {/* Ripples */}
      {ripples.map(ripple => (
        <div 
          key={ripple.id}
          className="ripple-effect"
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            left: ripple.x,
            top: ripple.y,
            pointerEvents: 'none',
          }}
        />
      ))}

      <style jsx>{`
        .ripple-effect {
          animation: ripple-animation 1s ease-out forwards;
        }
        @keyframes ripple-animation {
          from {
            transform: scale(0);
            opacity: 1;
          }
          to {
            transform: scale(400);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
