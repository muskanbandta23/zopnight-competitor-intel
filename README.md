Will it update every day?
Partially. Here's how it works:

Every time someone opens the link, it fetches fresh data from RSS feeds (Reddit, blogs, news, LinkedIn) automatically
The code has a 24-hour auto-refresh (setInterval) but that only works while the tab stays open
The verified direct post links (Twitter/LinkedIn) are hardcoded — those won't update unless you push new code
There's no backend server running — it's a static HTML file, so there's no cron job fetching data overnight
To make it truly auto-update daily, you'd need a backend or CI/CD pipeline — but for now, every page load = fresh RSS data.

How It's Built — Single HTML File, No Backend
Architecture
index.html (914 lines)
├── <style>  — All CSS embedded
├── <body>   — All HTML structure
└── <script> — All JavaScript logic

Key Techniques
1. Data Layer — Hardcoded competitor array

23 competitors stored in a JS array C[] with properties: name, threat level, website, LinkedIn, Twitter handle, blog URL, strengths, weaknesses, etc.
No database needed — all competitor intel is in the code
2. RSS Feeds via CORS Proxy (rss2json.com)

Browsers block cross-origin RSS requests, so we use api.rss2json.com as a free proxy
It converts RSS XML → JSON that JavaScript can read
Used for: Reddit posts, blog feeds, Google News, LinkedIn discovery
fetchRSS(url) → rss2json.com/v1/api.json?rss_url={url} → JSON items

3. Reddit — Global search with OR queries

Instead of 51 separate API calls (17 terms × 3 subreddits), combines terms:
reddit.com/search.rss?q=CloudZero OR Kubecost OR "Cast AI"
Only 7 total API calls instead of 51
Sequential with 600ms delays to avoid rate limits
4. Twitter/X — Verified hardcoded post links

X has no free API and blocks RSS
Solution: Searched Google for actual tweet URLs, hardcoded 18 verified direct links
Also provides: profile page links, Google-based mention searches
5. LinkedIn — Hardcoded posts + Google News RSS

LinkedIn blocks scraping entirely
Solution: 15 verified direct post URLs hardcoded + Google News RSS for site:linkedin.com "CompanyName" to discover more
6. Blogs — Direct RSS feeds

9 competitor blogs have working RSS feeds (Cast AI, nOps, Kubecost, Flexera, etc.)
Fetched in batches of 3 with 500ms delays
7. News — Google News RSS

news.google.com/rss/search?q={term} returns news articles as RSS
Searched for each high-threat competitor + industry keywords
8. Rate Limit Protection

All feeds load sequentially (Twitter → Reddit → Blogs → News → LinkedIn)
Each feed has internal staggered batching with delays
rss2json free tier can't handle 80+ parallel calls, so this prevents 0-result failures
9. UI — Pure CSS, no frameworks

CSS variables for dark theme (--bg, --accent, --card, etc.)
CSS Grid for responsive layouts
Sticky header, tabbed navigation, filter chips, search boxes
All minified class names (.hdr, .pc, .tc, etc.)
What Each Tab Does
Tab	Data Source	Method
Overview	Hardcoded C[] array	Static render
Comparison	Hardcoded feature matrix	Static table
Strengths/Gaps	Hardcoded analysis	Static cards
LinkedIn	15 verified URLs + rss2json	Hardcoded + RSS
X/Twitter	18 verified URLs + Google search links	Hardcoded
Reddit	reddit.com/search.rss via rss2json	Live RSS
Blogs	9 RSS feeds + Google News fallback	Live RSS
News	Google News RSS + direct search links	Live RSS
Total: 0 dependencies, 0 frameworks, 0 backend, 1 file.



file:///Users/zopdev/Desktop/My/index.html
https://muskanbandta23.github.io/zopnight-competitor-intel/
