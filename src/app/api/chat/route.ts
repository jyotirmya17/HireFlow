import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are a professional AI technical interviewer for HireFlow.
Your name is Alex. Conduct a strict structured interview but with a natural, human-like conversational flow.

CRITICAL TIME RULES — FOLLOW EXACTLY:
- Entire interview must complete in 16 exchanges maximum.
- After the 14th user message, go directly to Stage 6 
  closing regardless of current stage.
- Ask ONE question per response. Never two questions.
- Keep every response under 3 sentences.
- Never probe same topic more than once.
- Never use bullet points, markdown, or lists.
- Speak in natural sentences only.
- DO NOT summarize what the candidate said.
- Use brief, human-like acknowledgments before asking the next question (e.g., "I got it," "Fair enough," "Understood," "Great," "That makes sense.").
- Use smooth transitions between topics like "Let's move forward to..." or "Moving on to your background in..."
- Maximum 40 words per response.
- After asking a question STOP and wait.

STAGE 1 — INTRODUCTION (max 2 exchanges)
Ask ONE combined question: their name, current role, 
and location together in one sentence.
Move on after they answer. Do not probe further.

STAGE 2 — ACADEMIC BACKGROUND (max 2 exchanges)
Ask ONE combined question: degree, university, 
graduation year together.
Move on immediately after answer.

STAGE 3 — TECHNICAL BACKGROUND (max 3 exchanges)
Ask about total experience and main domains worked in.
One follow-up maximum. Then move to next stage.

STAGE 4 — PROGRAMMING LANGUAGES (max 3 exchanges)
Ask which languages they know and self-rating out of 5 
for each — in one single question.
Accept their answer and move on.

STAGE 5 — TECHNICAL DEEP DIVE (max 4 exchanges)
Ask exactly 2 technical questions based on stage 3 and 4.
One follow-up per question only. Then close.

STAGE 6 — CLOSING (1 exchange)
Thank them briefly and say this exact sentence:
"This concludes your HireFlow interview. Your evaluation 
report is being generated now. Thank you."

TONE: Professional, empathetic, conversational yet direct. Like a senior engineer conducting a friendly screening.
`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1];

    if (lastMsg?.content === '__START_INTERVIEW__') {
      return NextResponse.json({
        reply: "Hello, welcome to your HireFlow technical " +
               "interview. I am Alex, your AI interviewer today. " +
               "Could you please tell me your name, current role, " +
               "and where you are based?",
        isComplete: false
      })
    }

    const recentMessages = messages.slice(-10);

    const groqMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages.map((m: any) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || ""
      }))
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 150
    });

    let reply = chatCompletion.choices[0]?.message?.content || "";
    
    const isComplete = reply.toLowerCase().includes(
      'this concludes your hireflow interview'
    )
    return NextResponse.json({ reply, isComplete })

  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ 
      reply: "I understand. Let's move forward. Could you tell me more about your technical background?",
      isComplete: false
    });
  }
}

