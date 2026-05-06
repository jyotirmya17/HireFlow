import './globals.css'
import type { Metadata } from 'next'
import { Syne, DM_Sans, JetBrains_Mono, Archivo_Black } from 'next/font/google'

const syne = Syne({ 
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
})

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-archivo-black',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-sans',
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'HireFlow | Interview intelligently.',
  description: 'AI-powered interviewer conducting structured interviews.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${archivoBlack.variable} ${dmSans.variable} ${jetBrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}



