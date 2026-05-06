import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio') as File;
    if (!audio) return NextResponse.json({ text: '' });

    // Switch to Groq STT (Whisper Large V3) - much faster and uses your Groq credits
    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: 'whisper-large-v3',
      language: 'en',
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err: any) {
    console.error('Groq STT error:', err);
    
    // If Groq also fails, provide a fallback message
    if (err.status === 429) {
      return NextResponse.json({ 
        text: 'ERROR: Groq Rate Limit Exceeded. Please wait a moment.' 
      }, { status: 200 });
    }
    
    return NextResponse.json({ 
      text: 'ERROR: Voice transcription failed. Check your API keys.' 
    }, { status: 200 });
  }
}
