# 🤖 CEZAI

**AI-Powered Career & Skills Advisor for Students and Professionals**

> CEZAI is an intelligent career advisor built with **Google Gemini AI** to guide students from confusion to clarity. It offers personalized career paths, step-by-step upskilling roadmaps, industry insights, and AI-powered preparation tools — all in one platform.

---

## 🚀 Features

- 🎯 **Personalized Career Guidance** – AI learns from each student’s profile and suggests realistic career paths.
- 🛠️ **Career Roadmap Generator** – Creates step-by-step upskilling plans aligned with fast-changing industries.
- 🧠 **Skill Gap Analysis** – Identifies missing skills and recommends targeted resources.
- 📝 **AI Resume & Cover Letter Builder** – Optimized for ATS and recruiters.
- 🎤 **Voice-Based Mock Interviews** – Real practice with AI-driven feedback.
- 📊 **Dashboard with Industry Insights** – Stay updated with live market trends.
- 🧩 **AI Quiz & Assessment Generator** – Build confidence with interactive practice tests.

---

## ✨ Unique Value Proposition (USP)

- 🌏 **Made for India** – Designed for AI, tech, fintech, EV, and 50+ fast-changing careers.
- 🎤 **Voice-first practice** – AI mock interviews simulate real-life experiences.
- 📈 **Always evolving** – Powered by industry data and continuous AI model improvements.
- 🔄 **End-to-end journey** – Unlike others, CEZAI covers career insights → roadmaps → skills → interviews → job readiness.

---

## 🏗️ Architecture Overview

- **Frontend**: Onboarding Profile → Dashboard → Career Roadmap → Resume/Cover Letter Generator → Quiz/Interview Prep
- **Backend**: Next.js + Node.js APIs
- **Database**: Neon PostgreSQL (via Prisma)
- **AI**: Google Gemini AI (via AI Studio)
- **Workflow Orchestration**: Inngest, Vapi

---

## 📦 Tech Stack

**Frontend**

- React, Next.js, TailwindCSS

**Backend**

- Next.js API Routes
- Node.js, TypeScript
- Clerk (Authentication)

**Database**

- Neon PostgreSQL
- Prisma ORM

**AI / Workflow**

- Google Gemini (via Google AI Studio)
- Vapi, Inngest

**Hosting & Infra**

- Vercel (frontend & backend)
- Neon (serverless database)

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL (Neon recommended)
- API Keys: Google Gemini, Clerk, etc.

### Setup

```bash
# Clone repository
git clone https://github.com/sureshmdev/CEZAI.git
cd CEZAI

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in: DATABASE_URL, CLERK_API_KEY, GEMINI_API_KEY, etc.

# Prisma setup
npx prisma generate
npx prisma migrate dev

# Run development server
npm run dev
```

Runs at: `http://localhost:3000`

---

## 📊 Roadmap

- [x] AI Resume & Cover Letter Builder
- [x] Career Roadmap Generator
- [x] Industry Insights Dashboard
- [x] AI Quiz Generator
- [ ] Voice-based Mock Interviews (Beta)
- [ ] Mobile App (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard for institutions

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/xyz`)
3. Commit changes (`git commit -m "Add feature xyz"`)
4. Push and open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon).

---

## 🌍 Community & Support

- 📚 Documentation: _(Coming Soon)_
- 💬 Discussions: _(Future Discord/Slack link)_
- 🐛 Issues: [GitHub Issues](https://github.com/sureshmdev/CEZAI/issues)

---

## 🎯 Impact

CEZAI aims to serve **50M+ Indian students** by providing affordable, accessible, and personalized career guidance.

> “We are not just building a tool; we are building a guide for students’ futures.”

---
