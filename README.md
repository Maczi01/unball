# FootyGuess Daily

> Test your football knowledge through visual recognition of iconic moments in football history

**FootyGuess Daily** is a web-first, mobile-responsive game for football fans. Players are shown football-related photos and must guess both the event's location on a world map and the year it occurred. Challenge yourself with 5 photos per round and compete on the global leaderboard!

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Features

### 🎮 Two Game Modes

- **Normal Mode**: Unlimited practice rounds with instant feedback
- **Daily Mode**: One unique daily challenge with global Top-10 leaderboard

### 🎯 Scoring System

- **20,000 points maximum per photo**
  - 10,000 points for location accuracy
  - 10,000 points for time accuracy
- Linear deduction based on distance error (km) and time error (years)
- Transparent scoring formulas with real-time feedback

### 🗺️ Interactive Gameplay

- Place pins on an interactive world map powered by Mapbox
- Select years using a bounded picker (1880-2025)
- Visual feedback showing your guess vs. correct answer
- Detailed event information revealed after completion

### 🏆 Global Leaderboard

- Daily Top-10 rankings
- Fair tie-breakers: completion time → best single-photo score → earliest submission
- Privacy-preserving anonymous device tokens (no personal data collected)

### 📱 Performance & Accessibility

- Mobile-responsive design
- Fast load times (< 2 seconds on 4G)
- Keyboard navigation support
- WCAG AA color contrast compliance

## Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** (v5.13.7) - Modern web framework with SSR
- **[React 19](https://react.dev/)** (v19.1.1) - Interactive components
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** (v4.1.13) - Utility-first styling
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible component library
- **[Mapbox](https://www.mapbox.com/)** - Interactive map interface

### Backend & Infrastructure

- **[Supabase](https://supabase.com/)** - PostgreSQL database, authentication, and BaaS
- **[Openrouter.ai](https://openrouter.ai/)** - AI model integration
- **[Docker](https://www.docker.com/)** - Containerization
- **[DigitalOcean](https://www.digitalocean.com/)** - Hosting platform
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipeline

## Getting Started

### Prerequisites

- **Node.js v22.14.0** (specified in `.nvmrc`)
- **npm** (comes with Node.js)
- **Supabase account** (for database and authentication)
- **Mapbox API key** (for map functionality)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd unball
```

2. **Use the correct Node.js version**

```bash
# If using nvm
nvm use

# Or manually ensure you're on Node.js 22.14.0
node -v  # Should output v22.14.0
```

3. **Install dependencies**

```bash
npm install
```

4. **Set up environment variables**

Create a `.env` file in the root directory with the following variables:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox
MAPBOX_API_KEY=your_mapbox_api_key

# Openrouter (if using AI features)
OPENROUTER_API_KEY=your_openrouter_api_key
```

5. **Run the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

| Script             | Description                           |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Start development server on port 3000 |
| `npm run build`    | Build the application for production  |
| `npm run preview`  | Preview the production build locally  |
| `npm run lint`     | Run ESLint to check code quality      |
| `npm run lint:fix` | Automatically fix ESLint issues       |
| `npm run format`   | Format code with Prettier             |

### Git Hooks

The project uses **Husky** and **lint-staged** to automatically:

- Run ESLint fix on `.ts`, `.tsx`, `.astro` files before commit
- Run Prettier on `.json`, `.css`, `.md` files before commit

## Project Scope

### ✅ MVP Features (In Scope)

- **Game Modes**: Normal and Daily modes
- **Scoring**: Linear scoring with transparent formulas (location + time)
- **Leaderboard**: Daily Top-10 global rankings with tie-breakers
- **Privacy**: Minimal data storage with anonymous device tokens
- **Content**: 100 unique licensed photos with metadata validation
- **UI/UX**: Mobile-responsive web interface with Mapbox integration
- **Accessibility**: Keyboard navigation, ARIA labels, WCAG AA compliance
- **Operations**: Daily scheduling, content ingestion, basic rate limiting

### ❌ Out of Scope for MVP

- User accounts and authentication
- Social features (friend leaderboards, sharing)
- Multi-language support
- Hints, power-ups, or advanced gameplay mechanics
- Advanced anti-cheat mechanisms
- Native mobile applications
- Long-term data warehousing and complex analytics

### 🔮 Future Considerations

- User profiles and historical statistics
- Multiplayer modes
- Additional content categories (leagues, eras, teams)
- Mobile apps for iOS and Android
- Enhanced social features
- Advanced analytics dashboard

## Project Status

**Current Version**: `0.0.1` (MVP Development)

### Development Timeline

- **Target**: 2-week MVP delivery
- **Status**: In active development
- **Goal**: Frozen scope for rapid delivery

### Success Metrics (90-Day Targets)

- **Adoption**: 100+ unique players
- **Engagement**: ≥60% round completion rate
- **Retention**: ≥25% day-1 retention
- **Performance**: <2s initial load, <200ms map interactions
- **Content**: ≥7 days of pre-scheduled Daily sets

### Key Milestones

- [ ] Core gameplay implementation (map + year picker)
- [ ] Scoring system and feedback UI
- [ ] Normal mode functionality
- [ ] Daily mode with scheduling
- [ ] Leaderboard and nickname system
- [ ] Content ingestion and validation
- [ ] Privacy and anonymous token implementation
- [ ] Performance optimization
- [ ] Accessibility compliance
- [ ] Production deployment

## License

TBD

---

**Built with ⚽ for football fans worldwide**
