# HireFlow: AI-Driven Technical Interviews

HireFlow is an autonomous interview platform designed to conduct high-fidelity, voice-first technical screenings. It leverages high-speed inference and sophisticated LLM orchestration to provide a professional, seamless experience for both recruiters and candidates.

## 🚀 Why HireFlow?

Traditional technical screenings are often slow, inconsistent, and expensive. Recruiters spend countless hours on initial calls that could be handled more effectively by AI. HireFlow was built to bridge this gap by providing an "Alex"—a state-aware AI interviewer that can dive deep into technical backgrounds, evaluate problem-solving logic, and deliver structured reports instantly.

## 🛠️ The Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) for high-performance routing and serverless architecture.
- **Inference**: [Groq](https://groq.com/) utilizing **Llama-3.3-70b** for reasoning and **Whisper-large-v3** for near-instant transcription.
- **Voice**: [ElevenLabs](https://elevenlabs.io/) with custom-tuned Indian English personas for a natural, professional tone.
- **Intelligence**: [Google Gemini 1.5 Pro](https://ai.google.dev/) for complex, data-driven candidate evaluations.
- **Database**: [Supabase](https://supabase.com/) for persistence and session management.
- **UI/UX**: [Framer Motion](https://www.framer.com/motion/) for animations and [Three.js](https://threejs.org/) for interactive 3D elements.

## 🧠 Architectural Thinking

### The "Request-Response" Voice Pipeline
One of our biggest decisions was moving away from traditional WebRTC (Livekit) rooms. We opted for a high-speed HTTP-burst pipeline. By utilizing Groq's sub-500ms inference, we achieved a conversation flow that feels "live" without the overhead and cost of persistent socket connections.

### Stage-Based Interview Logic
Unlike simple chatbots, HireFlow follows a rigorous 6-stage state machine:
1. **Introduction**: Setting the stage and building rapport.
2. **Academic & Experience**: Validating the foundation.
3. **Technical Stack**: Deep-diving into specific languages and self-ratings.
4. **Problem Solving**: Probing logic and architectural decisions.
5. **Behavioral**: Assessing cultural and situational fit.
6. **Closing**: A smooth handover to the evaluation engine.

## ⚡ Setup & Installation

1. **Clone and Install**:
   ```bash
   git clone <your-repo-url>
   cd hireflow
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root and add the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GROQ_API_KEY=your_groq_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   GEMINI_API_KEY=your_gemini_key
   ```

3. **Run Locally**:
   ```bash
   npm run dev
   ```

## 🏗️ Future Roadmap

- **Video-First Intelligence**: Integrating real-time camera analysis for eye-contact and confidence scoring.
- **Collaborative Coding**: A shared IDE where the AI can watch and discuss code as the candidate writes it.
- **Multi-region Edge TTS**: Further reducing latency by routing synthesis to the nearest edge node.

---

*Built with precision for the next generation of hiring.*
