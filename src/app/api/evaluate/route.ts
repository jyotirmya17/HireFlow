import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EVALUATION_PROMPT = `
You are a senior technical hiring manager.
Analyze this interview transcript and generate a 
detailed honest evaluation.

SCORING — Be strict. Do not inflate scores.
Score is out of 100. Use exact grade bands:

  90-100 : Exceptional — Hire immediately. Rare talent.
  75-89  : Strong — Clear hire. Minor gaps only.
  60-74  : Good — Hire with reservations.
  40-59  : Average — Maybe. Significant gaps present.
  25-39  : Weak — Do not hire. Major deficiencies.
  0-24   : Poor — Strong no hire. Fundamental issues.

Weighted score calculation:
  Communication Clarity     : 20%
  Technical Knowledge       : 35%
  Problem Solving Ability   : 25%
  Cultural Fit              : 10%
  Confidence & Presentation : 10%

Grade bands for hiringRecommendation:
  90-100 → "Strong Yes"
  75-89  → "Yes"
  40-74  → "Maybe"
  25-39  → "No"
  0-24   → "Strong No"

Return ONLY valid JSON. No markdown. No explanation.
No code blocks. Raw JSON only.

{
  "candidateName": string,
  "sessionId": string,
  "evaluatedAt": string,
  "overallScore": number (0-100),
  "grade": string,
  "percentile": string (e.g. "Top 20% of candidates"),
  "hiringRecommendation": "Strong Yes"|"Yes"|"Maybe"|"No"|"Strong No",
  "recommendationReason": string (1 sentence),
  "categoryScores": {
    "communicationClarity": number (0-100),
    "technicalKnowledge": number (0-100),
    "problemSolving": number (0-100),
    "culturalFit": number (0-100),
    "confidencePresentation": number (0-100)
  },
  "strengths": string[] (3-5 with specific evidence),
  "weaknesses": string[] (3-5 with specific evidence),
  "stagePerformance": {
    "introduction": { "score": number, "notes": string },
    "academicBackground": { "score": number, "notes": string },
    "technicalBackground": { "score": number, "notes": string },
    "programmingLanguages": { "score": number, "notes": string },
    "technicalDeepDive": { "score": number, "notes": string }
  },
  "languageRatings": [
    {
      "language": string,
      "selfRating": number,
      "assessedRating": number,
      "gap": string
    }
  ],
  "sentimentAnalysis": {
    "overallSentiment": "Very Positive"|"Positive"|"Neutral"|"Nervous"|"Negative",
    "confidenceLevel": "High"|"Medium"|"Low",
    "communicationStyle": string,
    "notablePatterns": string
  },
  "performanceSummary": string (3-4 honest sentences),
  "developmentAreas": string[] (2-3 actionable improvements),
  "interviewDuration": string,
  "totalExchanges": number
}
`

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    
    // Format transcript for the prompt
    const transcriptText = transcript.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: EVALUATION_PROMPT },
        { role: 'user', content: `Evaluate the following interview transcript:\n\n${transcriptText}` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const evaluation = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error("Evaluation Error:", error);
    return NextResponse.json({ error: "Failed to evaluate" }, { status: 500 });
  }
}

