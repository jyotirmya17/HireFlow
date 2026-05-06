import { NextResponse } from 'next/server'

const PRIMARY_VOICE_ID = "A809T2V288pQ6N9B9mF0"; // Aarav (Indian English - Professional)

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
    console.warn("[TTS] ElevenLabs failed (quota or error), triggering browser fallback:", errorData);

    // Return JSON for fallback
    return NextResponse.json({ 
      fallback: true, 
      text: text 
    });

  } catch (err: any) {
    console.error('[TTS] Critical error:', err);
    // Return JSON for fallback even on critical errors
    return NextResponse.json({ 
      fallback: true, 
      text: text || "Hello... I am ready for the next part of our interview."
    });
  }
}
