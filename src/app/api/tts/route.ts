import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  let text = "";
  try {
    const body = await req.json();
    text = body.text;

    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB"; // Adam (Verified ID for this account)
    const API_KEY = process.env.ELEVENLABS_API_KEY;

    console.log("[TTS DEBUG] Request Start", {
      voiceId: VOICE_ID,
      textPreview: text?.substring(0, 30),
      hasApiKey: !!API_KEY
    });

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    if (!API_KEY) {
      console.error("[TTS DEBUG] Missing API Key");
      return NextResponse.json({ error: 'Missing ElevenLabs API Key' }, { status: 500 });
    }

    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
    
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.85,
          style: 0.5,
          use_speaker_boost: true
        }
      }),
    });

    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      console.error("[TTS DEBUG] ElevenLabs API Error", {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      return NextResponse.json({ 
        error: "ElevenLabs API Error",
        status: response.status,
        details: errorData
      }, { status: response.status });
    }

    if (contentType?.includes("application/json")) {
      const data = await response.json();
      console.error("[TTS DEBUG] Received JSON instead of Audio", data);
      return NextResponse.json({ error: "Invalid Response Type", details: data }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();
    console.log("[TTS DEBUG] Audio Buffer Received", { size: buffer.byteLength });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (err: any) {
    console.error('[TTS DEBUG] Critical Exception', err);
    return NextResponse.json({ 
      error: "Critical Server Error", 
      message: err.message 
    }, { status: 500 });
  }
}
