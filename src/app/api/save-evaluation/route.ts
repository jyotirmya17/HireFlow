import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { sessionId, evaluation } = await req.json()

    await supabaseAdmin
      .from('evaluations')
      .upsert({
        session_id: sessionId,
        overall_score: evaluation.overallScore,
        grade: evaluation.grade,
        percentile: evaluation.percentile,
        hiring_recommendation: evaluation.hiringRecommendation,
        recommendation_reason: evaluation.recommendationReason,
        category_scores: evaluation.categoryScores,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        stage_performance: evaluation.stagePerformance,
        language_ratings: evaluation.languageRatings,
        sentiment_analysis: evaluation.sentimentAnalysis,
        performance_summary: evaluation.performanceSummary,
        development_areas: evaluation.developmentAreas,
        full_evaluation: evaluation,
      }, { onConflict: 'session_id' })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Save evaluation error:', err)
    return NextResponse.json(
      { error: 'Failed to save evaluation' },
      { status: 500 }
    )
  }
}
