'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import './interview.css';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking'
type Message = { role: 'user' | 'assistant'; content: string }

export default function InterviewPage() {
  const router = useRouter()
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState('Click Begin Interview to start')
  const [stage, setStage] = useState(0)
  const [timer, setTimer] = useState('00:00')
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isProcessingRef = useRef(false)
  const shouldListenRef = useRef(false)
  const secondsRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesRef = useRef<Message[]>([])
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // VAD Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number | null>(null);
  const volumeThreshold = 0.012;
  const silenceDuration = 1800;

  const sessionIdRef = useRef(
    `HF-${Date.now()}-${Math.random()
      .toString(36).substr(2, 9)}`
  )

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (!started) return
    timerRef.current = setInterval(() => {
      secondsRef.current += 1
      const m = Math.floor(secondsRef.current / 60).toString().padStart(2, '0')
      const s = (secondsRef.current % 60).toString().padStart(2, '0')
      setTimer(`${m}:${s}`)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [started])

  useEffect(() => {
    if (!started) return
    const hardLimit = setTimeout(async () => {
      shouldListenRef.current = false
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      await saveInterviewData(messagesRef.current)
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: "We have reached the time limit for this " +
                  "interview. Thank you for your time. Your " +
                  "evaluation report is now being generated."
          }),
        })
        const buf = await res.arrayBuffer()
        const audioCtx = new AudioContext()
        const decoded = await audioCtx.decodeAudioData(buf)
        const source = audioCtx.createBufferSource()
        source.buffer = decoded
        source.connect(audioCtx.destination)
        source.onended = () => router.push('/report')
        source.start(0)
      } catch {
        router.push('/report')
      }
    }, 15 * 60 * 1000)
    return () => clearTimeout(hardLimit)
  }, [started])

  const saveInterviewData = async (msgs: Message[]) => {
    // localStorage backup
    localStorage.setItem(
      'hireflow_transcript',
      JSON.stringify(msgs)
    )
    localStorage.setItem(
      'hireflow_session_id',
      sessionIdRef.current
    )

    const candidateResponses = msgs
      .filter(m => m.role === 'user')
      .map((m, i) => ({
        questionNumber: i + 1,
        response: m.content,
      }))

    localStorage.setItem(
      'hireflow_candidate_responses',
      JSON.stringify(candidateResponses)
    )

    const sessionMeta = {
      sessionId: sessionIdRef.current,
      startedAt: new Date(
        Date.now() - secondsRef.current * 1000
      ).toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: secondsRef.current,
      totalExchanges: msgs.length,
      candidateMessageCount: candidateResponses.length,
    }

    localStorage.setItem(
      'hireflow_session_meta',
      JSON.stringify(sessionMeta)
    )

    // Save to Supabase
    try {
      await fetch('/api/save-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          transcript: msgs,
          candidateResponses,
          sessionMeta,
        }),
      })
    } catch (err) {
      console.error('Supabase save failed:', err)
    }
  }

  const startTranscriptStreaming = useCallback((text: string) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setTranscript('');
    const safeText = `${text || ""}`;
    const words = safeText.split(' ').filter(w => w !== "");
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      setTranscript(prev => {
        const prefix = prev === '' ? '' : prev + ' ';
        const word = words[i] || "";
        return `${prefix}${word}`;
      });
      i++;
      if (i >= words.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      }
    }, 130);
  }, []);

  const playAudio = useCallback(async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      setVoiceState('speaking');

      try {
        console.log("[TTS FETCHING]", { textLength: text.length });
        
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        const contentType = res.headers.get('content-type');

        if (!res.ok) {
          let errorData = null;
          try {
            errorData = await res.json();
          } catch {
            errorData = await res.text();
          }
          const errObj = {
            status: res.status,
            statusText: res.statusText,
            error: errorData
          };
          console.error("[TTS ERROR DETAIL]", JSON.stringify(errObj, null, 2));
          throw new Error(`ElevenLabs failed with status ${res.status}`);
        }

        if (contentType?.includes('application/json')) {
          const data = await res.json();
          console.error("[TTS JSON ERROR]", data);
          throw new Error("Invalid audio response");
        }

        const buffer = await res.arrayBuffer();
        if (!buffer || buffer.byteLength === 0) {
          console.error("[TTS] Empty audio buffer");
          throw new Error("Empty audio");
        }

        const blob = new Blob([buffer], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.onplay = () => startTranscriptStreaming(text);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          console.error("[TTS] Audio playback error");
          resolve();
        };

        await audio.play();

      } catch (error) {
        console.warn("[TTS FALLBACK] Using browser speech:", error);
        
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.lang = "en-IN"; // Professional Indian English accent if available

          utterance.onstart = () => startTranscriptStreaming(text);
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();

          window.speechSynthesis.cancel(); // Clear any pending speech
          window.speechSynthesis.speak(utterance);
        } catch (fallbackErr) {
          console.error("[TTS] Fallback also failed:", fallbackErr);
          resolve(); // Ensure interview continues even if all audio fails
        }
      }
    });
  }, [startTranscriptStreaming]);

  const monitorVolume = useCallback(() => {
    if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

    const dataArray = new Uint8Array(analyserRef.current.fftSize);
    analyserRef.current.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    if (rms < volumeThreshold) {
      if (!silenceStartRef.current) silenceStartRef.current = Date.now();
      else if (Date.now() - silenceStartRef.current > silenceDuration) {
        mediaRecorderRef.current.stop();
        return;
      }
    } else {
      silenceStartRef.current = null;
    }

    if (shouldListenRef.current) requestAnimationFrame(monitorVolume);
  }, []);

  const startRecording = useCallback(async () => {
    if (!streamRef.current || !shouldListenRef.current || isProcessingRef.current) return;

    setVoiceState('idle');
    setTranscript('Get ready to speak...');
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 800));
    }
    setCountdown(null);

    setVoiceState('listening');
    setTranscript('Listening... Speak now.');

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      processRecording(blob);
    };

    recorder.start();
    recordingStartRef.current = Date.now();

    if (!analyserRef.current && streamRef.current) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      source.connect(analyserRef.current);
    }
    silenceStartRef.current = null;
    monitorVolume();
  }, [monitorVolume]);

  const processRecording = async (blob: Blob) => {
    const duration = Date.now() - (recordingStartRef.current || 0);
    if (blob.size < 1800 || duration < 600) {
      if (shouldListenRef.current) startRecording();
      return;
    }

    isProcessingRef.current = true;
    setVoiceState('thinking');
    setTranscript('Alex is thinking...');

    try {
      const fd = new FormData();
      fd.append('audio', blob, 'audio.webm');

      const sttRes = await fetch('/api/stt', { method: 'POST', body: fd });
      const { text } = await sttRes.json();

      if (!text?.trim() || text.trim().length < 2) {
        isProcessingRef.current = false;
        if (shouldListenRef.current) startRecording();
        return;
      }

      setTranscript(`${text || ""}`);
      const updated: Message[] = [...messagesRef.current, { role: 'user', content: `${text || ""}` }];
      setMessages(updated);

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      const { reply, isComplete } = await chatRes.json();

      const final: Message[] = [...updated, { role: 'assistant', content: `${reply || ""}` }];

      setMessages(final);
      setStage(s => s + 1);

      await playAudio(reply);

      if (isComplete) {
        shouldListenRef.current = false;
        await saveInterviewData(final);
        setTimeout(() => router.push('/report'), 2000);
      } else {
        isProcessingRef.current = false;
        if (shouldListenRef.current) startRecording();
      }
    } catch (err) {
      console.error('Loop error:', err);
      isProcessingRef.current = false;
      if (shouldListenRef.current) startRecording();
    }
  };

  const startInterview = useCallback(async () => {
    try {
      setError(null);
      setStarted(true);
      setVoiceState('thinking');
      setTranscript('Alex is joining...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      shouldListenRef.current = true;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '__START_INTERVIEW__' }]
        }),
      });
      const { reply } = await res.json();
      setMessages([{ role: 'assistant', content: `${reply || ""}` }]);

      await playAudio(reply);
      if (shouldListenRef.current) startRecording();

    } catch (err: any) {
      console.error('Start error:', err);
      setVoiceState('idle');
      setError('Mic access denied. Please allow and refresh.');
    }
  }, [playAudio, startRecording]);

  const endInterview = useCallback(async () => {
    shouldListenRef.current = false;
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    await saveInterviewData(messagesRef.current);
    router.push('/report');
  }, [router]);


  let orbClass = "orb-idle";
  let labelText = "READY";
  if (voiceState === 'listening') { orbClass = "orb-listening"; labelText = "LISTENING"; }
  else if (voiceState === 'thinking') { orbClass = "orb-thinking"; labelText = "THINKING"; }
  else if (voiceState === 'speaking') { orbClass = "orb-speaking"; labelText = "ALEX SPEAKING"; }

  const currentStageDisplay = Math.min(stage + 1, 6);
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const isAgent = lastMsg?.role === 'assistant';

  return (
    <div className="interview-layout">
      <header className="top-bar">
        <div className="brand font-ui">HireFlow</div>
        <div className="progress-dots">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`dot ${i < currentStageDisplay ? 'filled' : i === currentStageDisplay ? 'pulsing' : 'hollow'}`} />
          ))}
        </div>
        <div className="header-right">
          <div className="timer font-ui">{timer}</div>
          <button className="end-btn font-ui" onClick={endInterview}>End Interview</button>
        </div>
      </header>

      <main className="center-stage">
        <div className={`orb-container ${orbClass}`}>
          {countdown !== null && (
            <div className="countdown-overlay font-ui">{countdown}</div>
          )}
          {voiceState === 'listening' && (
            <>
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </>
          )}
          <div className="orb-core">
            {voiceState === 'speaking' && (
              <div className="voice-bars">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className={`bar bar-${i}`}></div>)}
              </div>
            )}
          </div>
        </div>

        <div className="status-label font-ui">{labelText}</div>

        {error && (
          <div style={{ color: '#e05c5c', marginTop: '10px', fontFamily: 'Inter', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div className="transcript-strip font-ui">
          <div className={`transcript-line ${isAgent ? 'agent' : 'candidate'}`}>
            {transcript}
          </div>
        </div>

        {!started && (
          <div style={{ marginTop: '20px' }}>
            <button className="pill-btn font-ui" onClick={startInterview}>Begin Interview</button>
          </div>
        )}
      </main>

      <style jsx>{`
        .countdown-overlay {
          position: absolute;
          font-size: 5rem;
          color: white;
          z-index: 10;
          text-shadow: 0 0 20px rgba(0,0,0,0.5);
          animation: pulse 0.8s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
