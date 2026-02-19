# ZopNight Competitor Intelligence Dashboard

**Live:** [https://muskanbandta23.github.io/zopnight-competitor-intel/](https://muskanbandta23.github.io/zopnight-competitor-intel/)

Real-time competitor intelligence dashboard for **ZopNight** (FinOps product for Zopnight). Tracks 23 cloud cost optimization competitors across LinkedIn, X/Twitter, Reddit, Blogs, and News — **auto-updated twice daily** via GitHub Actions.

---

## What It Does

| Tab | What It Shows | Data Count |
|-----|---------------|------------|
| **Overview** | All 23 competitors — threat level, feature comparison, strengths/gaps, direct links | 23 cards |
| **Comparison** | Feature-by-feature table (ZopNight vs top 7 competitors) | 14 features |
| **Strengths** | Where ZopNight wins (One-Click ON/OFF, Group Toggles, ZopAI, IDP) | 6 advantages |
| **Gaps** | Where competitors challenge us (K8s allocation, RI/SP, spot automation) | 6 gap areas |
| **Alerts** | Combined feed of latest activity from all platforms | Top 50 |
| **LinkedIn** | Verified direct post links + Google News discovery | ~1,600 posts |
| **X/Twitter** | 18 verified direct tweet URLs + profile pages + Google mention search | 18+ tweets |
| **Reddit** | Posts via Google News `site:reddit.com` + Reddit JSON API | ~200 posts |
| **Blogs** | Competitor RSS feeds (Cast AI, nOps, Flexera, Harness, Anodot, Finout) | ~140 articles |
| **News** | ALL 23 competitors — funding, product launches, partnerships, marketing | ~600 articles |
| **Blog Ideas** | 20 strategic blog topics for ZopNight based on competitor gaps | 20 ideas |

---

## Competitors Tracked (23)

| Threat | Competitors |
|--------|-------------|
| **High** | CloudZero, Kubecost, Cast AI, nOps, Spot.io |
| **Medium** | Densify, CloudHealth, Flexera, Harness, Turbonomic, ParkMyCloud, ScaleOps, Finout, Cloudability, Datadog |
| **Low** | DuploCloud, Astuto, Neysa, CloudPilot AI, Ternary, GCP Cost Mgmt, Anodot, Holori |

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions (Cron)                   │
│            Runs at 6:00 AM + 6:00 PM UTC daily          │
│                                                         │
│  1. Checkout repo                                       │
│  2. npm ci (install rss-parser)                         │
│  3. node fetch-data.js                                  │
│     ├── Fetches blogs via RSS (rss-parser, no proxy)    │
│     ├── Fetches Reddit via Google News + JSON API       │
│     ├── Fetches news for ALL 23 competitors             │
│     └── Fetches LinkedIn via Google News                │
│  4. Saves data.json (~1.5 MB)                           │
│  5. git commit + push (if data changed)                 │
│  6. GitHub Pages auto-rebuilds                          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                GitHub Pages (Hosting)                    │
│        Serves index.html + data.json to browser         │
│                                                         │
│  User opens dashboard URL                               │
│    → Loads data.json instantly (no API calls)            │
│    → Shows all competitor data in < 1 second             │
│    → Falls back to live RSS if data.json is stale       │
└─────────────────────────────────────────────────────────┘
```

### Why This Architecture?

- **No backend server** — GitHub Actions is the "server" (runs for free)
- **No API keys** — uses public RSS feeds and Google News
- **No rate limiting** — data is pre-fetched server-side, not in the browser
- **Instant load** — dashboard loads pre-cached `data.json`, no waiting
- **Free hosting** — GitHub Pages serves the static site
- **Auto-updates** — cron runs twice daily without manual intervention

---

## Project Structure

```
.
├── index.html                        # Main dashboard (single HTML file)
├── data.json                         # Pre-fetched data (auto-updated by CI)
├── README.md
├── .gitignore
├── scripts/
│   ├── fetch-data.js                 # Node.js data fetcher
│   ├── package.json                  # Dependencies (rss-parser)
│   └── package-lock.json
└── .github/
    └── workflows/
        └── update-data.yml           # Cron workflow (twice daily)
```

---

## Data Sources

| Source | How We Fetch | Why This Method |
|--------|-------------|-----------------|
| **Blogs** | `rss-parser` npm package (direct RSS) | No CORS issues server-side, no rate limits |
| **Reddit** | Google News RSS `site:reddit.com` + Reddit JSON API `/r/{sub}/new.json` | Reddit blocks RSS feeds (403), Google finds the posts instead |
| **News** | Google News RSS for all 23 competitors with specific queries | Covers funding, product, partnerships, marketing for every competitor |
| **LinkedIn** | Google News RSS `site:linkedin.com` + 15 hardcoded verified post URLs | LinkedIn blocks all scraping, Google News indexes LinkedIn posts |
| **Twitter** | 18 hardcoded verified tweet URLs + profile links | X/Twitter has no free API, Nitter is dead |

---

## News Auto-Tagging

Each news article is automatically categorized:

| Tag | Detects | Example |
|-----|---------|---------|
| **Funding** | fundraising, valuations, Series rounds, investments | "Neysa raises $1.2B from Blackstone" |
| **Product** | launches, new features, updates, releases | "Datadog adds Cloud Cost Management" |
| **Partnership** | integrations, acquisitions, mergers | "Ternary + Wipro Partnership" |
| **Marketing** | events, conferences, campaigns | "DASH 2026 Conference" |
| **Leadership** | executive hires, appointments | "Cast AI appoints new CFO" |

---


## Manual Data Refresh

To update data outside the twice-daily schedule:

1. Go to **[Actions](https://github.com/muskanbandta23/zopnight-competitor-intel/actions)**
2. Click **"Update Competitor Intel Data"**
3. Click **"Run workflow"**
4. Data refreshes in ~30 seconds

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML + CSS + JS (no frameworks, no build step) |
| Backend | Node.js + `rss-parser` (runs in GitHub Actions) |
| Hosting | GitHub Pages (free, auto-deploys on push) |
| CI/CD | GitHub Actions cron (free for public repos) |
| Data | RSS feeds, Google News RSS, Reddit JSON API |


Made by Muskan Bandta
