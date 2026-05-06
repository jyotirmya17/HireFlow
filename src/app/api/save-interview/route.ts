import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const {
      sessionId,
      transcript,
      candidateResponses,
      sessionMeta
    } = await req.json()

    // 1. Upsert session
    await supabaseAdmin
      .from('interview_sessions')
      .upsert({
        session_id: sessionId,
        candidate_name: candidateResponses[0]?.response
          ?.split(' ')[0] || 'Unknown',
        started_at: sessionMeta.startedAt,
        completed_at: sessionMeta.completedAt,
        duration_seconds: sessionMeta.durationSeconds,
        total_exchanges: sessionMeta.totalExchanges,
        candidate_message_count: sessionMeta.candidateMessageCount,
        status: 'completed',
      }, { onConflict: 'session_id' })

    // 2. Insert transcript rows
    const transcriptRows = transcript.map(
      (msg: any, index: number) => ({
        session_id: sessionId,
        role: msg.role,
        content: msg.content,
        message_index: index,
      })
    )
    await supabaseAdmin
      .from('chat_transcripts')
      .insert(transcriptRows)

    // 3. Insert candidate responses
    const responseRows = candidateResponses.map(
      (r: any, index: number) => ({
        session_id: sessionId,
        question_number: index + 1,
        response: r.response,
        word_count: r.response.trim().split(/\s+/).length,
      })
    )
    await supabaseAdmin
      .from('candidate_responses')
      .insert(responseRows)

    return NextResponse.json({ success: true, sessionId })
  } catch (err) {
    console.error('Save interview error:', err)
    return NextResponse.json(
      { error: 'Failed to save' },
      { status: 500 }
    )
  }
}
