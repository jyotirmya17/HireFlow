import { NextResponse } from 'next/server'

const PRIMARY_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "txk8uOzZ0iCh0B9mFSRG"; 

export async function POST(req: Request) {
  let text = "";
  try {
    const body = await req.json();
    text = body.text;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text' }, { status: 400 })
    }

    // Try ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${PRIMARY_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.85,
          style: 0.4,
          use_speaker_boost: true
        }
      }),
    });

    if (response.ok) {
      const audioBuffer = await response.arrayBuffer();
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
          'X-TTS-Fallback': 'false'
        },
      });
    }

    const errorData = await response.json().catch(() => ({}));
    console.error("[TTS] ElevenLabs failed:", errorData);

    // Return ERROR instead of fallback if STRICTLY requested
    return NextResponse.json({ 
      error: "ElevenLabs synthesis failed", 
      details: errorData 
    }, { status: 500 });

  } catch (err: any) {
    console.error('[TTS] Critical error:', err);
    return NextResponse.json({ error: "TTS Critical Error" }, { status: 500 });
  }
}
