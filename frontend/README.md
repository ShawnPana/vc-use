# VC-Use: AI-Powered Startup Analysis Platform

A stunning, hackathon-ready application that uses multi-agent AI analysis to evaluate startups. Features a Product Hunt-inspired aesthetic with dramatic loading animations where analysis cards "pop up" sequentially as agents complete their work.

![VC-Use Demo](https://via.placeholder.com/800x400?text=VC-Use+Demo)

## ✨ Features

- **🤖 6 AI Agents** with unique personalities and analysis focuses:
  - **The Skeptic**: Risk-focused VC identifying red flags
  - **The Believer**: Growth-focused optimist highlighting potential
  - **The Engineer**: Technical expert assessing feasibility
  - **Market Analyst**: Competitive landscape researcher
  - **People Expert**: Team evaluator
  - **AI Strategist**: AI strategy assessor

- **📊 Quick Summary Cards**: Instant insights on founder story, market position, and funding outlook
- **🎨 Beautiful Animations**: Staggered card appearances with smooth transitions
- **⚡ Real-time Updates**: Live analysis updates as each agent completes
- **📱 Mobile Responsive**: Optimized for all screen sizes
- **🌙 Dark Theme**: Stunning dark UI with gradient accents

## 🚀 Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Convex (data storage & API routes)
- **AI**: Cerebras API (llama-3.3-70b)
- **Icons**: Lucide React
- **Scraping**: Browser Use (ready to integrate)

## 📦 Installation

### Prerequisites

- Node.js 18+ installed
- A Convex account ([convex.dev](https://convex.dev))
- A Cerebras API key ([cerebras.ai](https://cerebras.ai))

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project (or link to existing)
   - Generate your `VITE_CONVEX_URL`
   - Open the Convex dashboard

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add:
   ```bash
   VITE_CONVEX_URL=<your-convex-url>
   CEREBRAS_API_KEY=<your-cerebras-api-key>
   ```

5. **Set Convex environment variable**

   In your Convex dashboard or via CLI:
   ```bash
   npx convex env set CEREBRAS_API_KEY <your-key>
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   This runs both:
   - Frontend on http://localhost:5173
   - Convex backend in watch mode

## 🎯 Usage

1. **Enter a startup name** in the search bar (e.g., "OpenAI", "Stripe", "Airbnb")
2. **Click "Analyze"** or press Enter
3. **Watch the magic** as summary cards and agent analyses appear with staggered animations
4. **Read insights** from 6 different AI perspectives

## 📁 Project Structure

```
frontend/
├── convex/                 # Backend logic
│   ├── schema.ts          # Database schema
│   ├── queries.ts         # Data queries
│   ├── mutations.ts       # Data mutations
│   └── actions.ts         # AI & scraping logic
├── src/
│   ├── components/
│   │   ├── AgentCard.tsx  # Agent analysis card
│   │   └── SummaryCard.tsx # Summary insight card
│   ├── App.tsx            # Main application
│   ├── main.tsx           # Entry point
│   └── index.css          # Styles & animations
├── .env.example           # Environment template
└── package.json
```

## 🔧 Configuration

### Agent Customization

Edit `convex/actions.ts` to modify agent prompts:

```typescript
const AGENTS = [
  {
    id: "skeptic",
    name: "The Skeptic",
    prompt: "Your custom prompt here..."
  },
  // ... more agents
];
```

### Adding More Agents

1. Add agent config to `convex/actions.ts`
2. Add agent display config to `src/App.tsx`
3. Import additional icons from `lucide-react`

### Browser Use Integration

Replace the mock scraping function in `convex/actions.ts`:

```typescript
export const scrapeStartupData = action({
  args: { startupName: v.string() },
  handler: async (ctx, args) => {
    // Implement Browser Use here
    // Scrape: website, Crunchbase, LinkedIn, etc.
  },
});
```

## 🎨 Customization

### Colors

The app uses a dark theme with orange accents. Modify in `src/App.tsx` and `src/index.css`:

- Primary: `orange-500` to `red-500`
- Background: `gray-950`, `gray-900`, `gray-800`
- Text: `white`, `gray-300`, `gray-400`

### Animations

Adjust animation timings in `src/index.css`:

```css
@keyframes slideInUp {
  /* Customize animation */
}
```

Modify delays in components:
- Summary cards: `delay={index * 100}`
- Agent cards: `delay={index * 150}`

## 🚢 Deployment

### Deploy Convex

```bash
npx convex deploy
```

### Deploy Frontend

Build the app:
```bash
npm run build
```

Deploy to your preferred platform:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **Cloudflare Pages**: `wrangler pages deploy dist`

Don't forget to set environment variables in your deployment platform!

## 🐛 Troubleshooting

### Convex Connection Issues

- Ensure `VITE_CONVEX_URL` is set correctly
- Check Convex dashboard for deployment status
- Verify internet connection

### AI Analysis Errors

- Verify `CEREBRAS_API_KEY` is set in Convex environment
- Check API key validity at cerebras.ai
- Review Convex function logs in dashboard

### Animation Issues

- Clear browser cache
- Check CSS is loading properly
- Verify Tailwind CSS is configured

## 📝 API Reference

### Convex Actions

- `analyzeStartup(startupName)` - Orchestrates full analysis
- `scrapeStartupData(startupName)` - Scrapes startup data
- `analyzeWithCerebras(startupName, agentId, scrapedData)` - Runs single agent
- `generateSummaries(startupName, scrapedData)` - Creates summaries

### Convex Queries

- `getAnalyses(startupName)` - Fetch all agent analyses
- `getSummaries(startupName)` - Fetch summary cards
- `getScrapedData(startupName)` - Fetch raw scraped data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Convex](https://convex.dev)
- Powered by [Cerebras](https://cerebras.ai)
- Icons by [Lucide](https://lucide.dev)
- Styled with [Tailwind CSS](https://tailwindcss.com)

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check Convex documentation
- Review Cerebras API docs

---

**Built for hackathons. Designed to impress. Ready to deploy.** 🚀
