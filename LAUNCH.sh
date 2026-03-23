#!/bin/bash
set -e

echo "🔑 KeyForge — Setup & Launch"
echo ""

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Create GitHub repo and push
echo ""
echo "🐙 Creating GitHub repo..."
gh repo create keyforge --public --source=. --remote=origin --push 2>/dev/null || {
  echo "⚠️  Repo may already exist. Pushing..."
  git remote add origin https://github.com/$(gh api user -q .login)/keyforge.git 2>/dev/null || true
  git push -u origin main
}

# 3. Deploy to Vercel (frontend preview — backend needs local)
echo ""
echo "🚀 Deploying to Vercel..."
npx vercel --yes

# 4. Start local dev server (full functionality)
echo ""
echo "✅ Starting local dev server..."
echo "   Frontend: http://localhost:5173"
echo "   API:      http://localhost:4000"
echo ""
npm run dev
