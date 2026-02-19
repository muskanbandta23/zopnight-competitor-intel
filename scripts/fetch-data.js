import Parser from 'rss-parser';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '..', 'data.json');

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'ZopNight-Competitor-Intel/1.0 (GitHub Actions)' }
});

// ── Competitor definitions ──
const COMPETITORS = [
  { id:'cloudzero', name:'CloudZero', threat:'high', blog_feed:'https://www.cloudzero.com/blog/rss.xml', x:'CloudZeroInc', li_slug:'cloudzero' },
  { id:'kubecost', name:'Kubecost', threat:'high', blog_feed:'https://blog.kubecost.com/feed.xml', x:'kubecost', li_slug:'kubecost' },
  { id:'castai', name:'Cast AI', threat:'high', blog_feed:'https://cast.ai/blog/feed/', x:'cast_ai', li_slug:'cast-ai' },
  { id:'nops', name:'nOps', threat:'high', blog_feed:'https://www.nops.io/blog/feed/', x:'nopsio', li_slug:'nopsio' },
  { id:'spotio', name:'Spot.io', threat:'high', blog_feed:null, x:'spot_hq', li_slug:'spothq' },
  { id:'densify', name:'Densify', threat:'medium', blog_feed:null, x:'densify', li_slug:'densify' },
  { id:'cloudhealth', name:'CloudHealth', threat:'medium', blog_feed:null, x:'VMW_CloudHealth', li_slug:'cloudhealth-technologies' },
  { id:'flexera', name:'Flexera', threat:'medium', blog_feed:'https://www.flexera.com/blog/feed/', x:'flexera', li_slug:'flexera' },
  { id:'harness', name:'Harness', threat:'medium', blog_feed:'https://www.harness.io/blog/rss.xml', x:'harnessio', li_slug:'harness-io' },
  { id:'turbonomic', name:'Turbonomic', threat:'medium', blog_feed:null, x:'Turbonomic', li_slug:'ibm-turbonomic' },
  { id:'duplocloud', name:'DuploCloud', threat:'low', blog_feed:null, x:'DuploCloud', li_slug:'duplocloud' },
  { id:'parkmycloud', name:'ParkMyCloud', threat:'medium', blog_feed:null, x:'parkmycloud', li_slug:'parkmycloud' },
  { id:'scaleops', name:'ScaleOps', threat:'medium', blog_feed:'https://www.scaleops.com/blog/rss.xml', x:'ScaleOps_sh', li_slug:'scaleops-sh' },
  { id:'astuto', name:'Astuto', threat:'low', blog_feed:null, x:'astuto_ai', li_slug:'astuto-cloud' },
  { id:'neysa', name:'Neysa', threat:'low', blog_feed:null, x:'', li_slug:'neysaai' },
  { id:'finout', name:'Finout', threat:'medium', blog_feed:'https://www.finout.io/blog/rss.xml', x:'finout_io', li_slug:'finout' },
  { id:'cloudpilot', name:'CloudPilot AI', threat:'low', blog_feed:null, x:'Cloudpilot_ai', li_slug:'cloudpilotai' },
  { id:'ternary', name:'Ternary', threat:'low', blog_feed:null, x:'ternaryinc', li_slug:'ternaryapp' },
  { id:'cloudability', name:'Cloudability', threat:'medium', blog_feed:null, x:'Apptio', li_slug:'cloudability' },
  { id:'datadog', name:'Datadog', threat:'medium', blog_feed:null, x:'datadoghq', li_slug:'datadog' },
  { id:'gcpcost', name:'GCP Cost Mgmt', threat:'low', blog_feed:null, x:'googlecloud', li_slug:'google-cloud' },
  { id:'anodot', name:'Anodot', threat:'low', blog_feed:'https://www.anodot.com/blog/feed/', x:'TeamAnodot', li_slug:'anodot' },
  { id:'holori', name:'Holori', threat:'low', blog_feed:null, x:'holori_cloud', li_slug:'holori' },
];

// ── Helpers ──
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function stripHtml(html) { return (html || '').replace(/<[^>]*>/g, '').substring(0, 300); }
function toTs(dateStr) {
  if (!dateStr) return Math.floor(Date.now() / 1000);
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? Math.floor(Date.now() / 1000) : Math.floor(d.getTime() / 1000);
}

async function safeFetch(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const feed = await parser.parseURL(url);
      return feed.items || [];
    } catch (err) {
      if (attempt === retries) {
        console.warn(`  FAIL (${retries+1} tries): ${url.substring(0,80)}... - ${err.message}`);
        return [];
      }
      await delay(1000 * (attempt + 1));
    }
  }
  return [];
}

// ── Fetch Blogs ──
async function fetchBlogs() {
  console.log('📝 Fetching blogs...');
  const posts = [];
  const seen = new Set();

  const feeds = COMPETITORS.filter(c => c.blog_feed);
  for (const comp of feeds) {
    const items = await safeFetch(comp.blog_feed);
    for (const item of items) {
      const title = item.title || '';
      if (seen.has(title)) continue;
      seen.add(title);
      posts.push({
        id: `bl-${comp.id}-${posts.length}`, title,
        preview: stripHtml(item.contentSnippet || item.content || ''),
        url: item.link || '', source: comp.name,
        timestamp: toTs(item.pubDate || item.isoDate),
      });
    }
    await delay(300);
  }

  // Google News for high-threat without RSS
  const noRss = COMPETITORS.filter(c => c.threat === 'high' && !c.blog_feed);
  for (const comp of noRss) {
    const items = await safeFetch(`https://news.google.com/rss/search?q=%22${encodeURIComponent(comp.name)}%22+blog&hl=en-US&gl=US&ceid=US:en`);
    for (const item of items.slice(0, 3)) {
      const title = item.title || '';
      if (seen.has(title)) continue;
      seen.add(title);
      posts.push({
        id: `bl-gn-${comp.id}-${posts.length}`, title,
        preview: stripHtml(item.contentSnippet || item.content || ''),
        url: item.link || '', source: comp.name,
        timestamp: toTs(item.pubDate || item.isoDate),
      });
    }
    await delay(400);
  }

  posts.sort((a, b) => b.timestamp - a.timestamp);
  console.log(`  Blogs: ${posts.length} posts`);
  return posts;
}

// ── Fetch Reddit (via Google News site:reddit.com — Reddit RSS returns 403) ──
async function fetchReddit() {
  console.log('👽 Fetching Reddit via Google...');
  const posts = [];
  const seen = new Set();

  // Use Google News RSS with site:reddit.com to find Reddit discussions
  const batches = [
    { q: 'site:reddit.com CloudZero OR Kubecost OR "Cast AI" OR nOps OR "Spot.io"', label: 'High Threat' },
    { q: 'site:reddit.com Densify OR Flexera OR Harness OR Turbonomic OR ScaleOps OR Finout OR Datadog', label: 'Medium Threat' },
    { q: 'site:reddit.com DuploCloud OR ParkMyCloud OR Astuto OR Neysa OR CloudPilot OR Ternary OR Cloudability OR Holori OR Anodot', label: 'Other Competitors' },
    { q: 'site:reddit.com CloudHealth OR "GCP cost" OR "cloud cost optimization" OR FinOps', label: 'Industry' },
    { q: 'site:reddit.com "kubernetes cost" OR "cloud waste" OR "right sizing" OR "spot instances"', label: 'Cloud Optimization' },
    { q: 'site:reddit.com "cloud cost management" OR "cloud savings" OR "finops platform" OR "cloud budget"', label: 'FinOps Tools' },
  ];

  for (const b of batches) {
    const items = await safeFetch(`https://news.google.com/rss/search?q=${encodeURIComponent(b.q)}&hl=en-US&gl=US&ceid=US:en`);
    for (const item of items) {
      const title = item.title || '';
      if (seen.has(title)) continue;
      seen.add(title);
      const content = stripHtml(item.contentSnippet || item.content || '');
      const tl = (title + ' ' + content).toLowerCase();
      const matched = COMPETITORS.find(c => tl.includes(c.name.toLowerCase()));
      const subMatch = (item.link || '').match(/\/r\/([^/]+)/);
      posts.push({
        id: `rd-${posts.length}`, title,
        preview: content || `Reddit discussion about ${matched?.name || b.label}`,
        url: item.link || '', source: matched?.name || b.label,
        timestamp: toTs(item.pubDate || item.isoDate),
        subreddit: subMatch ? subMatch[1] : '',
      });
    }
    await delay(400);
  }

  // Also try Reddit JSON API for key subreddits
  for (const sub of ['finops', 'devops', 'kubernetes']) {
    try {
      const resp = await fetch(`https://www.reddit.com/r/${sub}/new.json?limit=15&t=week`, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'ZopNight-Bot/1.0', 'Accept': 'application/json' },
      });
      if (resp.ok) {
        const d = await resp.json();
        for (const ch of (d.data?.children || [])) {
          const p = ch.data;
          if (!p || !p.title || seen.has(p.title)) continue;
          seen.add(p.title);
          const tl = p.title.toLowerCase();
          const matched = COMPETITORS.find(c => tl.includes(c.name.toLowerCase()));
          posts.push({
            id: `rd-j-${posts.length}`, title: p.title,
            preview: (p.selftext || '').substring(0, 300) || `r/${sub} discussion`,
            url: `https://www.reddit.com${p.permalink}`, source: matched?.name || `r/${sub}`,
            timestamp: p.created_utc || Math.floor(Date.now() / 1000),
            subreddit: sub, score: p.score, comments: p.num_comments,
          });
        }
      }
    } catch (err) {
      console.warn(`  Reddit JSON /r/${sub} failed: ${err.message}`);
    }
    await delay(500);
  }

  posts.sort((a, b) => b.timestamp - a.timestamp);
  console.log(`  Reddit: ${posts.length} posts`);
  return posts;
}

// ── Fetch News (ALL 23 competitors — funding, marketing, product, partnerships) ──
async function fetchNews() {
  console.log('📰 Fetching competitor news (all 23)...');
  const posts = [];
  const seen = new Set();

  function tagNewsType(text) {
    const tl = text.toLowerCase();
    if (/fund|rais|valua|invest|\$\d|series [a-e]|ipo/i.test(tl)) return 'Funding';
    if (/launch|releas|announc|new feature|product|update|ga |general avail/i.test(tl)) return 'Product';
    if (/partner|integrat|acqui|merg|join/i.test(tl)) return 'Partnership';
    if (/market|campaign|brand|event|conference|summit/i.test(tl)) return 'Marketing';
    if (/hire|appoint|ceo|cto|cfo|leader|executive/i.test(tl)) return 'Leadership';
    return 'General';
  }

  const newsBatches = [
    { q: '"CloudZero" funding OR partnership OR launch OR pricing OR product', label: 'CloudZero' },
    { q: '"Kubecost" OR "Apptio Kubecost" funding OR acquisition OR launch OR product', label: 'Kubecost' },
    { q: '"Cast AI" funding OR valuation OR launch OR partnership', label: 'Cast AI' },
    { q: '"nOps" cloud cost OR "nOps.io" funding OR launch', label: 'nOps' },
    { q: '"Spot.io" OR "Spot by NetApp" cloud optimization OR product', label: 'Spot.io' },
    { q: '"Densify" OR "Flexera" cloud cost OR funding OR product OR partnership', label: 'Densify/Flexera' },
    { q: '"Harness" cloud cost OR CCM OR "Harness.io" funding OR launch', label: 'Harness' },
    { q: '"Turbonomic" OR "IBM Turbonomic" optimization OR product OR update', label: 'Turbonomic' },
    { q: '"ScaleOps" kubernetes OR funding OR launch', label: 'ScaleOps' },
    { q: '"Finout" cloud cost OR MegaBill OR funding OR launch', label: 'Finout' },
    { q: '"Datadog" cloud cost management OR CCM OR pricing OR feature', label: 'Datadog' },
    { q: '"CloudHealth" VMware OR "cloud management" OR product', label: 'CloudHealth' },
    { q: '"ParkMyCloud" OR "Cloudability" OR "Apptio" FinOps OR cloud cost', label: 'ParkMyCloud/Cloudability' },
    { q: '"DuploCloud" OR "Astuto" OR "Neysa" cloud OR funding OR AI', label: 'DuploCloud/Astuto/Neysa' },
    { q: '"CloudPilot AI" OR "Ternary" OR "Anodot" OR "Holori" cloud cost OR funding', label: 'CloudPilot/Ternary/Others' },
    { q: '"GCP cost management" OR "Google Cloud cost" tools OR update OR feature', label: 'GCP Cost Mgmt' },
  ];

  for (const b of newsBatches) {
    const items = await safeFetch(`https://news.google.com/rss/search?q=${encodeURIComponent(b.q)}&hl=en-US&gl=US&ceid=US:en`);
    for (const item of items) {
      const title = item.title || '';
      if (seen.has(title)) continue;
      seen.add(title);
      const content = stripHtml(item.contentSnippet || item.content || '');
      const tl = (title + ' ' + content).toLowerCase();
      const matched = COMPETITORS.find(c => tl.includes(c.name.toLowerCase()));
      const src = matched?.name || b.label.split('/')[0];
      posts.push({
        id: `nw-${posts.length}`, title,
        preview: content, url: item.link || '', source: src,
        timestamp: toTs(item.pubDate || item.isoDate),
        newsType: tagNewsType(title + ' ' + content),
      });
    }
    await delay(400);
  }

  posts.sort((a, b) => b.timestamp - a.timestamp);
  console.log(`  News: ${posts.length} posts`);
  return posts;
}

// ── Fetch LinkedIn (via Google News site:linkedin.com) ──
async function fetchLinkedIn() {
  console.log('🔗 Fetching LinkedIn...');
  const posts = [];
  const seen = new Set();

  const liComps = COMPETITORS.filter(c => c.threat === 'high' || c.threat === 'medium');
  for (const comp of liComps) {
    const items = await safeFetch(`https://news.google.com/rss/search?q=site:linkedin.com+%22${encodeURIComponent(comp.name)}%22&hl=en-US&gl=US&ceid=US:en`);
    for (const item of items) {
      const title = item.title || '';
      if (seen.has(title)) continue;
      seen.add(title);
      posts.push({
        id: `li-${comp.id}-${posts.length}`, title,
        preview: stripHtml(item.contentSnippet || item.content || ''),
        url: item.link || '', source: comp.name, handle: comp.li_slug,
        timestamp: toTs(item.pubDate || item.isoDate),
      });
    }
    await delay(500);
  }

  for (const term of ['FinOps', 'cloud cost optimization']) {
    const items = await safeFetch(`https://news.google.com/rss/search?q=site:linkedin.com+${encodeURIComponent(term)}&hl=en-US&gl=US&ceid=US:en`);
    for (const item of items) {
      const title = item.title || '';
      if (seen.has(title)) continue;
      seen.add(title);
      posts.push({
        id: `li-br-${posts.length}`, title,
        preview: stripHtml(item.contentSnippet || item.content || ''),
        url: item.link || '', source: term,
        timestamp: toTs(item.pubDate || item.isoDate),
      });
    }
    await delay(400);
  }

  posts.sort((a, b) => b.timestamp - a.timestamp);
  console.log(`  LinkedIn: ${posts.length} posts`);
  return posts;
}

// ── Verified hardcoded posts (always included) ──
const VERIFIED_LINKEDIN = [
  { id:'li-vf-0', title:'Cast AI Valued at Over $1 Billion With Launch of OMNI Compute', url:'https://www.linkedin.com/posts/cast-ai_cast-ai-valued-at-over-1-billion-with-the-activity-7416473846456954880-Q9Bo', source:'Cast AI', timeLabel:'Direct Post' },
  { id:'li-vf-1', title:'Flexera 2026 IT Priorities Report: AI Integration Tops List', url:'https://www.linkedin.com/posts/tiffany-goddard_flexera-2026-it-priorities-report-ai-cost-activity-7416479607542935552-_tfB', source:'Flexera', timeLabel:'Direct Post' },
  { id:'li-vf-2', title:'DuploCloud Launches Agentic Help Desk + Automation Studio for DevOps', url:'https://www.linkedin.com/posts/duplocloud_duplocloud-devops-ai-activity-7363604195796537345-lMlf', source:'DuploCloud', timeLabel:'Direct Post' },
  { id:'li-vf-3', title:'DuploCloud AWS Partnership for Agentic AI in DevOps', url:'https://www.linkedin.com/posts/duplocloud_devops-ai-aws-activity-7349139119622508344-S3C0', source:'DuploCloud', timeLabel:'Direct Post' },
  { id:'li-vf-4', title:'Blackstone Finalises Structured Investment in Neysa ($1.2B)', url:'https://www.linkedin.com/posts/analytics-india-magazine_blackstone-has-finalised-a-structured-investment-activity-7418959929975263232-RZjP', source:'Neysa', timeLabel:'Direct Post' },
  { id:'li-vf-5', title:'Datadog Feature Flags General Availability Announcement', url:'https://www.linkedin.com/posts/datadog_today-datadog-announced-the-general-availability-activity-7424471493486673920-W14Z', source:'Datadog', timeLabel:'Direct Post' },
  { id:'li-vf-6', title:'DASH 2026 Conference Announcement', url:'https://www.linkedin.com/posts/datadog_dash2026-activity-7407092369952542720-lz2F', source:'Datadog', timeLabel:'Direct Post' },
  { id:'li-vf-7', title:'Ternary + Wipro Partnership for Cloud Cost Advantage', url:'https://www.linkedin.com/posts/kirantakkey_finops-cloudcostmanagement-enterpriseit-activity-7409267035358019584-M5Jl', source:'Ternary', timeLabel:'Direct Post' },
  { id:'li-vf-8', title:'Smarter Cloud Cost Allocation: Billing Rules Engine for FinOps', url:'https://www.linkedin.com/posts/ternaryinc_smarter-cloud-cost-allocation-for-finops-activity-7361035920088686593-Qfu6', source:'Ternary', timeLabel:'Direct Post' },
  { id:'li-vf-9', title:'CloudPilot AI V1.5.0 Released: Simplify Kubernetes Optimization', url:'https://www.linkedin.com/posts/cloudpilotai_december-2025-v1150-activity-7408793416991617024-r8Qf', source:'CloudPilot AI', timeLabel:'Direct Post' },
  { id:'li-vf-10', title:'Astuto OneLens: Tagging & FinOps for AWS, Azure, GCP', url:'https://www.linkedin.com/posts/astuto-cloud_tagging-finops-aws-activity-7348226245031006208-gyms', source:'Astuto', timeLabel:'Direct Post' },
  { id:'li-vf-11', title:'ScaleOps Adds Predictive Horizontal Scaling', url:'https://www.linkedin.com/posts/scaleops-sh_scaleops-adds-predictive-horizontal-scaling-activity-7270844533628649472-TS_-', source:'ScaleOps', timeLabel:'Direct Post' },
  { id:'li-vf-12', title:'ScaleOps Raises $58M for Cloud Native Optimization', url:'https://www.linkedin.com/posts/scaleops-sh_scaleops-cloud-native-optimization-has-activity-7262114434179850242-aQ_i', source:'ScaleOps', timeLabel:'Direct Post' },
  { id:'li-vf-13', title:'Kubecost Certification Program Launch', url:'https://www.linkedin.com/posts/kubecost_kubecost-certification-kubecost-activity-7282102631034986499-sD_9', source:'Kubecost', timeLabel:'Direct Post' },
  { id:'li-vf-14', title:'Densify K8s Kubernetes DevOps Container Optimization', url:'https://www.linkedin.com/posts/densify_k8s-kubernetes-devops-activity-7274434270083915777-cnUI', source:'Densify', timeLabel:'Direct Post' },
];

const VERIFIED_TWEETS = [
  { id:'tw-vf-0', title:'Is your IT strategy ready for 2026? Cloud costs, regulatory pressure & AI resilience', url:'https://x.com/flexera/status/1990421950288527721', source:'Flexera', handle:'flexera', timeLabel:'Direct Post' },
  { id:'tw-vf-1', title:'AI Innovation Roadmap: building smarter foundation for AI adoption', url:'https://x.com/flexera/status/1999551604681224639', source:'Flexera', handle:'flexera', timeLabel:'Direct Post' },
  { id:'tw-vf-2', title:'40% of enterprises now spend over $12M annually on cloud', url:'https://x.com/flexera/status/1994480193159811301', source:'Flexera', handle:'flexera', timeLabel:'Direct Post' },
  { id:'tw-vf-3', title:'Cloud strategy: continuous optimization, cost control, Kubernetes management', url:'https://x.com/flexera/status/1991117022550245557', source:'Flexera', handle:'flexera', timeLabel:'Direct Post' },
  { id:'tw-vf-4', title:'Datadog Ambassador Program applications now open', url:'https://x.com/datadoghq/status/2016896893041725877', source:'Datadog', handle:'datadoghq', timeLabel:'Direct Post' },
  { id:'tw-vf-5', title:'54% of compute spend wasted on idle cluster capacity — K8s Autoscaler', url:'https://x.com/datadoghq/status/2001705796845842476', source:'Datadog', handle:'datadoghq', timeLabel:'Direct Post' },
  { id:'tw-vf-6', title:'This Month in Datadog: K8s Autoscaling, AWS cost anomalies', url:'https://x.com/datadoghq/status/1963331231392657501', source:'Datadog', handle:'datadoghq', timeLabel:'Direct Post' },
  { id:'tw-vf-7', title:'Cloud Cost Management: real-time data tied to individual services', url:'https://x.com/datadoghq/status/1925945463070441608', source:'Datadog', handle:'datadoghq', timeLabel:'Direct Post' },
  { id:'tw-vf-8', title:'5 ways AI agents will transform the way we work in 2026', url:'https://x.com/googlecloud/status/2007180093479702874', source:'GCP Cost Mgmt', handle:'googlecloud', timeLabel:'Direct Post' },
  { id:'tw-vf-9', title:'Series C done + AWS partnership: announcing CloudZero Optimize', url:'https://x.com/CloudZeroInc/status/1930695701270282539', source:'CloudZero', handle:'CloudZeroInc', timeLabel:'Direct Post' },
  { id:'tw-vf-10', title:'Who will save the city from spiraling cloud costs?', url:'https://x.com/CloudZeroInc/status/1921909490384781401', source:'CloudZero', handle:'CloudZeroInc', timeLabel:'Direct Post' },
  { id:'tw-vf-11', title:'5x CPU utilization, 70% AWS savings on EKS — Enrollmation case study', url:'https://x.com/Cloudpilot_ai/status/1910735847806185615', source:'CloudPilot AI', handle:'Cloudpilot_ai', timeLabel:'Direct Post' },
  { id:'tw-vf-12', title:'Turbonomic Live event with AWS General Manager', url:'https://x.com/turbonomic/status/1263834036797091844', source:'Turbonomic', handle:'Turbonomic', timeLabel:'Direct Post' },
  { id:'tw-vf-13', title:'Clear visibility into cloud infrastructure is key to cloud optimization', url:'https://x.com/nopsio/status/1616552052951511040', source:'nOps', handle:'nopsio', timeLabel:'Direct Post' },
  { id:'tw-vf-14', title:'Welcoming Pierre-Andre Liduena as CFO — Cast AI expanding leadership', url:'https://x.com/cast_ai/status/1780591246987362477', source:'Cast AI', handle:'cast_ai', timeLabel:'Direct Post' },
  { id:'tw-vf-15', title:'Cloud cost myth: you only pay for what you use', url:'https://x.com/VMW_CloudHealth/status/1246413472780427265', source:'CloudHealth', handle:'VMW_CloudHealth', timeLabel:'Direct Post' },
  { id:'tw-vf-16', title:'The hardware expertise behind the cloud', url:'https://x.com/holori_cloud/status/1458360201082454019', source:'Holori', handle:'holori_cloud', timeLabel:'Direct Post' },
  { id:'tw-vf-17', title:'Cloudbusters podcast: Spotify Cloud FinOps Sr. Manager', url:'https://x.com/apptio/status/1384880873703710720', source:'Cloudability', handle:'Apptio', timeLabel:'Direct Post' },
];

// ── Main ──
async function main() {
  console.log('🚀 Starting data fetch at', new Date().toISOString());
  const start = Date.now();

  const [blogs, reddit, news, linkedin] = await Promise.all([
    fetchBlogs().catch(e => { console.error('Blogs failed:', e.message); return []; }),
    fetchReddit().catch(e => { console.error('Reddit failed:', e.message); return []; }),
    fetchNews().catch(e => { console.error('News failed:', e.message); return []; }),
    fetchLinkedIn().catch(e => { console.error('LinkedIn failed:', e.message); return []; }),
  ]);

  // Merge verified posts with RSS-fetched (verified first, deduped)
  const allLinkedIn = [...VERIFIED_LINKEDIN, ...linkedin.filter(p => !VERIFIED_LINKEDIN.find(v => v.title === p.title))];
  const allTwitter = [...VERIFIED_TWEETS];

  const data = {
    _meta: {
      generated_at: new Date().toISOString(),
      generated_ts: Math.floor(Date.now() / 1000),
      version: 1,
      source: 'github-actions',
      counts: { linkedin: allLinkedIn.length, twitter: allTwitter.length, reddit: reddit.length, blogs: blogs.length, news: news.length },
    },
    linkedin: allLinkedIn,
    twitter: allTwitter,
    reddit,
    blogs,
    news,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s → ${OUTPUT_PATH}`);
  console.log(`   LI:${data._meta.counts.linkedin} TW:${data._meta.counts.twitter} RD:${data._meta.counts.reddit} BL:${data._meta.counts.blogs} NW:${data._meta.counts.news}`);
}

main().then(() => process.exit(0)).catch(err => { console.error('Fatal:', err); process.exit(1); });
