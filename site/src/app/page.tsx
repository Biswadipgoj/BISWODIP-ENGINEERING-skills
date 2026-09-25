'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

const SKILLS = [
  { name: 'TypeScript', level: 95 }, { name: 'React / Next.js', level: 92 },
  { name: 'Node.js', level: 88 }, { name: 'Python', level: 82 },
  { name: 'Security Engineering', level: 90 }, { name: 'Animation / Framer Motion', level: 87 },
  { name: 'Kubernetes / Infra', level: 78 }, { name: 'Database / Prisma', level: 85 },
  { name: 'Testing / Keploy', level: 80 }, { name: 'UI/UX Design', level: 88 },
];

const REPOS = [
  { id: 'jev-ultrafast', name: 'Browser Automation', color: '#00d4ff', desc: 'Primary browser driver for goal-driven tasks. Replaces Playwright.', icon: '🔮' },
  { id: 'motion', name: 'Motion', color: '#8b5cf6', desc: 'Layout animations, gestures, springs, scroll-linked motion.', icon: '⚡' },
  { id: 'anime', name: 'Anime.js', color: '#a78bfa', desc: 'Framework-free timelines for DOM, SVG and CSS.', icon: '🎬' },
  { id: 'animate-css', name: 'Animate.css', color: '#c084fc', desc: 'Drop-in CSS keyframe classes. Honour prefers-reduced-motion.', icon: '🎨' },
  { id: 'bootstrap', name: 'Bootstrap', color: '#60a5fa', desc: 'Responsive grid, components, accessible baseline.', icon: '🧱' },
  { id: 'font-awesome', name: 'Font Awesome', color: '#38bdf8', desc: 'Icon set — free tier as SVG, web font or JS.', icon: '📦' },
  { id: 'css-gg', name: 'css.gg', color: '#34d399', desc: 'Pure-CSS/SVG icons. No font or JS. Tiny bundles.', icon: '🔷' },
  { id: 'impeccable', name: 'Impeccable', color: '#f472b6', desc: 'Agent design-quality skill: design vocabulary, audits, anti-patterns.', icon: '✨' },
  { id: 'front-end-checklist', name: 'Front-End Checklist', color: '#fb923c', desc: 'Pre-launch checklist: head/meta/SEO, accessibility, performance.', icon: '✅' },
  { id: 'app-ideas', name: 'App Ideas', color: '#a3e635', desc: 'Tiered app ideas with user stories. Ideation knowledge source.', icon: '💡' },
  { id: 'react-native', name: 'React Native', color: '#67e8f9', desc: 'Native Android/iOS apps in React.', icon: '📱' },
  { id: 'expo', name: 'Expo', color: '#22d3ee', desc: 'React Native framework: Expo Router, EAS Build.', icon: '🚀' },
  { id: 'appwrite', name: 'Appwrite', color: '#10b981', desc: 'Self-hostable backend: auth, databases, storage, functions.', icon: '🔐' },
  { id: 'ruflo', name: 'Ruflo', color: '#a78bfa', desc: 'Multi-agent swarm orchestration for Claude Code.', icon: '🐝' },
  { id: 'crawlee', name: 'Crawlee', color: '#818cf8', desc: 'Crawling framework. HTTP and headless crawlers, retries, rate limits.', icon: '🕷️' },
  { id: 'scrapling', name: 'Scrapling', color: '#6366f1', desc: 'Python scraping with adaptive selectors. Same scraping rules.', icon: '🔍' },
  { id: 'codex-security', name: 'Codex Security', color: '#ef4444', desc: 'AI-powered vulnerability detection and security scanning.', icon: '🛡️' },
  { id: 'sqlmap', name: 'SQLMap', color: '#f87171', desc: 'Authorized SQL injection detection. Destructive, authorized-only.', icon: '⚠️' },
  { id: 'awesome-hacking', name: 'Awesome Hacking', color: '#facc15', desc: 'CTFs, security tools, offensive security knowledge.', icon: '💣' },
  { id: 'cloudflare-security-audit', name: 'Cloudflare Audit', color: '#22d3ee', desc: 'WAF, DDoS, zero-trust, CDN security auditing workflows.', icon: '☁️' },
  { id: 'keploy', name: 'Keploy', color: '#f59e0b', desc: 'API test recording and replay. Linux/eBPF.', icon: '🎯' },
  { id: 'open-code-review', name: 'Open Code Review', color: '#f97316', desc: 'AI code review CLI. Reads OCR_LLM_URL / OCR_LLM_TOKEN.', icon: '📝' },
  { id: 'archify', name: 'Archify', color: '#34d399', desc: 'Turn architecture into self-contained interactive HTML diagrams.', icon: '🏗️' },
  { id: 'superpowers', name: 'Superpowers', color: '#c084fc', desc: 'Brainstorming, TDD, systematic debugging, subagent-driven dev.', icon: '🦸' },
  { id: 'mattpocock-skills', name: 'Matt Pocock Skills', color: '#818cf8', desc: 'Engineering skills for coding agents (TypeScript-heavy).', icon: '🛠️' },
  { id: 'claude-plugins-official', name: 'Claude Plugins', color: '#8b5cf6', desc: 'Official plugin marketplace: code-review, feature-dev, LSPs.', icon: '🔌' },
  { id: 'awesome-claude-code', name: 'Awesome Claude Code', color: '#a78bfa', desc: 'Curated Claude Code skills, hooks, commands, workflows.', icon: '📋' },
  { id: 'kubernetes-the-hard-way', name: 'K8s The Hard Way', color: '#60a5fa', desc: 'Kubernetes bootstrap reference. Every component, certs, etcd.', icon: '☸️' },
  { id: 'awesome-scalability', name: 'Awesome Scalability', color: '#38bdf8', desc: 'Scalable system patterns with real-world case studies.', icon: '📈' },
  { id: 'n8n', name: 'n8n', color: '#e879f9', desc: 'Self-hostable workflow automation. 400+ integrations.', icon: '🔄' },
  { id: 'paperclip', name: 'Paperclip', color: '#fb7185', desc: 'App for running and managing teams of AI agents.', icon: '📎' },
  { id: 'netdata', name: 'Netdata', color: '#34d399', desc: 'Per-second infrastructure monitoring with alerts.', icon: '📊' },
  { id: 'redis', name: 'Redis', color: '#f59e0b', desc: 'Cache, queues, ephemeral state, rate limiting, pub/sub.', icon: '🔶' },
  { id: 'meilisearch', name: 'Meilisearch', color: '#818cf8', desc: 'Typo-tolerant full-text, faceted and hybrid search.', icon: '🔎' },
  { id: 'clickhouse', name: 'ClickHouse', color: '#6366f1', desc: 'Columnar OLAP. Analytics, events, logs, time series.', icon: '📉' },
  { id: 'prisma', name: 'Prisma ORM', color: '#06b6d4', desc: 'Type-safe ORM and migrations. Postgres, MySQL, SQLite.', icon: '🗄️' },
  { id: 'tidb', name: 'TiDB', color: '#22d3ee', desc: 'Distributed SQL database. Horizontal scale, HTAP.', icon: '💿' },
  { id: 'emil-design-eng', name: 'Emil Design Eng', color: '#ec4899', desc: 'UI polish, micro-interactions, premium design engineering.', icon: '🎭' },
  { id: 'make-interfaces-better', name: 'Make Interfaces Better', color: '#f472b6', desc: 'Small UX improvements: timing, spacing, focus, feedback.', icon: '🔬' },
  { id: 'react-doctor', name: 'React Doctor', color: '#fbbf24', desc: 'Auto-finds React perf issues, re-renders, bundle bloat.', icon: '🏥' },
  { id: 'fixing-accessibility', name: 'Fixing Accessibility', color: '#34d399', desc: 'A11y fixes: ARIA, keyboard nav, contrast, WCAG compliance.', icon: '♿' },
  { id: '12-principles-animation', name: '12 Principles', color: '#a78bfa', desc: 'Disney 12 principles applied to UI motion design.', icon: '🎞️' },
  { id: 'shadcn-ui', name: 'shadcn/ui', color: '#818cf8', desc: 'Beautiful accessible components built with Radix + Tailwind.', icon: '🧩' },
  { id: 'playwright-test', name: 'Playwright', color: '#94a3b8', desc: 'E2E test runner. jev-ultrafast primary; Playwright secondary.', icon: '🧪' },
  { id: 'agent-reach', name: 'Agent Reach', color: '#22c55e', desc: 'Web research and context-gathering capability for better planning.', icon: '📡' },
  { id: 'browser-use', name: 'Browser Use', color: '#0ea5e9', desc: 'Fallback browser agent when jev-ultrafast is unavailable.', icon: '🧭' },
];

const PHASES = [
  { num: '01', title: 'Discover', desc: 'Inspect repo, detect stack, understand architecture. Load biswodip-unified-engineering.', color: '#00d4ff' },
  { num: '02', title: 'Plan', desc: 'Requirement analysis, capability selection, task graph, agent waves.', color: '#8b5cf6' },
  { num: '03', title: 'Threat Model', desc: 'Server authority, authorization, attack vectors, financial controls.', color: '#ef4444' },
  { num: '04', title: 'Implement', desc: 'Execute with selected agents, write evidence, preserve working code.', color: '#10b981' },
  { num: '05', title: 'Verify', desc: 'Tests, type checks, lint, browser QA, accessibility review.', color: '#f59e0b' },
  { num: '06', title: 'Attack', desc: 'Authorized pentest with Strix + manual adversarial pass, fix loop.', color: '#ec4899' },
  { num: '07', title: 'Fix', desc: 'Root cause analysis, regression tests, evidence-driven fixes.', color: '#6366f1' },
  { num: '08', title: 'Release Gate', desc: 'Evidence matrix, 100-pt score, blockers, final release status.', color: '#00d4ff' },
];

export default function Home() {
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(true);
  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes scan { 0%{top:-10%} 100%{top:110%} }
        @keyframes glitch { 0%,100%{transform:translate(0)} 20%{transform:translate(-2px,2px)} 40%{transform:translate(-2px,-2px)} 60%{transform:translate(2px,2px)} 80%{transform:translate(2px,-2px)} }
        @keyframes rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .float-anim { animation: float 4s ease-in-out infinite; }
        .pulse-anim { animation: pulse 2s ease-in-out infinite; }
        .glitch-anim { animation: glitch 4s infinite; }
      `}</style>

      <motion.div className="fixed inset-0 pointer-events-none" animate={{ opacity: [0.03, 0.06, 0.03] }} transition={{ duration: 8, repeat: Infinity }} style={{ background: 'radial-gradient(circle at 20% 50%, rgba(0,212,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.08) 0%, transparent 50%)' }} />
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,212,255,0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <motion.div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 8s ease-in-out infinite' }} />
      <motion.div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 10s ease-in-out infinite reverse' }} />

      <Navbar />
      <Hero />
      <About />
      <SkillsSection />
      <WorkflowSection />
      <ReposSection />
      <ProjectsSection />
      <Contact />
      <Footer />
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 50); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h); }, []);

  const links = [
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Capabilities', href: '#repos' },
    { label: 'Projects', href: '#projects' },
  ];
  return (
    <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0.75rem 2rem', background: scrolled ? 'rgba(10,10,15,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none', transition: 'all 0.3s' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.div whileHover={{ scale: 1.05 }} style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ color: '#00d4ff' }}>&lt;</span><span>BG</span><span style={{ color: '#00d4ff' }}>/&gt;</span></motion.div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="hidden md:flex">
          {links.map((l, i) => <motion.a key={l.label} href={l.href} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.05 }} whileHover={{ color: '#00d4ff' }} style={{ fontSize: '0.8rem', fontWeight: 500, color: '#a0a0c0', transition: 'color 0.2s' }}>{l.label}</motion.a>)}
          <motion.a href="#contact" whileHover={{ scale: 1.05 }} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}>Hire Me</motion.a>
        </div>
      </div>
    </motion.nav>
  );
}

function Hero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <section ref={ref} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', paddingTop: '80px' }}>
      <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite' }} />
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(0,212,255,0.05)' }} />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 45, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.05)' }} />
      <motion.div className="text-center max-w-5xl px-6 relative z-10" initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 1 }}>
        <motion.div className="flex items-center justify-center gap-2 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <span className="tag cyan"><span className="inline-block w-2 h-2 rounded-full bg-[#00d4ff] pulse-anim" /> Available for Work</span>
        </motion.div>
        <motion.h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 glitch-anim" style={{ animationDuration: '5s' }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <span className="gradient-text">Biswodip Goj</span>
        </motion.h1>
        <motion.h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4" style={{ color: '#f0f0ff' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          Autonomous Engineering Platform
        </motion.h2>
        <motion.p className="text-lg md:text-xl max-w-2xl mx-auto mb-8" style={{ color: '#a0a0c0' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          Evidence-driven production engineering system. Discover → Plan → Threat Model → Implement → Verify → Attack → Fix → Release Gate.
          <br /><span style={{ color: '#00d4ff' }}>Nothing is called done without evidence.</span>
        </motion.p>
        <motion.div className="flex flex-wrap items-center justify-center gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <motion.a href="#workflow" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary flex items-center gap-2">⚡ Explore the Platform →</motion.a>
          <motion.a href="#repos" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-outline flex items-center gap-2">📦 Capabilities →</motion.a>
        </motion.div>
        <motion.div className="flex items-center justify-center gap-12 mt-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          {[['46', 'Repositories'], ['14', 'Phases'], ['8', 'Subagents'], ['100', 'Weighted Points']].map(([num, label], i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 + i * 0.1 }} whileHover={{ scale: 1.1 }}>
              <div className="text-3xl md:text-4xl font-black" style={{ color: '#00d4ff' }}>{num}</div>
              <div className="text-xs mt-1 uppercase tracking-wider" style={{ color: '#606080' }}>{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}><span className="text-[#00d4ff] text-2xl">↓</span></motion.div>
    </section>
  );
}

const ABOUT_CARDS: { icon: string; title: string; desc: string }[] = [
  { icon: '🛡️', title: 'Evidence-Driven', desc: 'Every claim requires a recorded command, result, and artifact. UNVERIFIED or BLOCKED otherwise.' },
  { icon: '🔒', title: 'Security First', desc: 'Server-authoritative review, authorization controls, financial security, attack catalog, authorized pentesting.' },
  { icon: '📊', title: 'Release Gate', desc: '100 weighted points, hard caps for unresolved criticals. One honest status: RELEASE READY or NOT.' },
  { icon: '🔬', title: 'Agent System', desc: '8 specialist skills, 14 lifecycle phases, specialized subagents in waves, deterministic planning.' },
  { icon: '🎨', title: 'Design Quality', desc: 'Impeccable, Emil Design, Make Interfaces Better, 12 Principles of Animation for premium UI.' },
  { icon: '⚡', title: 'Autonomous', desc: '/dip command plans, selects capabilities, delegates to subagents, verifies, replans, fixes.' },
];

function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <section id="about" ref={ref} style={{ padding: '8rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
        <div className="section-label">01 — About</div>
        <h2 className="text-4xl md:text-5xl font-black mb-6">Engineered with <span className="gradient-text">Evidence</span>, Shipped with <span className="gradient-text">Discipline</span></h2>
        <p className="text-lg mb-12 max-w-3xl" style={{ color: '#a0a0c0' }}>The BISWODIP-ENGINEERING system is a single operating document plus procedures, security deep-dives, verification catalogue, tooling and templates. It takes a repository from discovery to release — nothing is called done without evidence.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {ABOUT_CARDS.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 + i * 0.1 }} whileHover={{ y: -4 }} className="card">
              <div className="text-3xl mb-3">{c.icon}</div>
              <h3 className="font-bold mb-2" style={{ color: '#00d4ff' }}>{c.title}</h3>
              <p className="text-sm" style={{ color: '#a0a0c0' }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function SkillsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <section id="skills" ref={ref} style={{ padding: '8rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
        <div className="section-label">02 — Skills</div>
        <h2 className="text-4xl md:text-5xl font-black mb-4">Technical <span className="gradient-text">Proficiency</span></h2>
        <p className="mb-12" style={{ color: '#a0a0c0' }}>Years of deep expertise across the full engineering stack.</p>
        <div className="grid md:grid-cols-2 gap-8">
          {SKILLS.map((s, i) => (
            <motion.div key={s.name} initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.08, duration: 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span className="text-sm font-medium">{s.name}</span><span className="text-sm font-mono" style={{ color: '#00d4ff' }}>{s.level}%</span></div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}><motion.div initial={{ width: 0 }} animate={inView ? { width: `${s.level}%` } : {}} transition={{ delay: i * 0.08 + 0.3, duration: 1.5, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', background: 'linear-gradient(90deg, #00d4ff, #8b5cf6)', borderRadius: '3px' }} /></div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function WorkflowSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <section id="workflow" ref={ref} style={{ padding: '8rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
        <div className="section-label">03 — Workflow</div>
        <h2 className="text-4xl md:text-5xl font-black mb-4">Autonomous <span className="gradient-text">Lifecycle</span></h2>
        <p className="mb-16" style={{ color: '#a0a0c0' }}>The DIP system orchestrates engineering through 14 disciplined phases, each with defined entry criteria, steps, evidence requirements, and exit gates.</p>
        <div className="relative">
          {PHASES.map((p, i) => (
            <motion.div key={p.num} initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.5 }} style={{ display: 'flex', gap: '1.5rem', marginBottom: i < PHASES.length - 1 ? '0' : '0' }}>
              <div style={{ flexShrink: 0, textAlign: 'right', minWidth: '60px' }}><span className="font-mono text-xs font-bold" style={{ color: p.color }}>{p.num}</span></div>
              <div style={{ flex: 1, paddingBottom: '2rem', borderLeft: `2px solid ${p.color}22`, paddingLeft: '1.5rem' }}>
                <div style={{ position: 'absolute', left: '-5px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: p.color, boxShadow: `0 0 15px ${p.color}`, animation: 'pulse 2s ease-in-out infinite' }} />
                <h3 className="font-bold text-lg mb-1" style={{ color: p.color }}>{p.title}</h3>
                <p className="text-sm" style={{ color: '#a0a0c0' }}>{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

const REPO_CATEGORY: Record<string, string> = {
  'jev-ultrafast': 'browser', 'browser-use': 'browser', 'crawlee': 'browser', 'scrapling': 'browser', 'playwright-test': 'browser',
  'motion': 'animation', 'anime': 'animation', 'animate-css': 'animation', '12-principles-animation': 'animation',
  'codex-security': 'security', 'sqlmap': 'security', 'awesome-hacking': 'security', 'cloudflare-security-audit': 'security',
  'appwrite': 'backend', 'prisma': 'backend', 'redis': 'backend', 'meilisearch': 'backend', 'clickhouse': 'backend',
  'tidb': 'backend', 'netdata': 'backend', 'react-native': 'backend', 'expo': 'backend',
  'keploy': 'quality', 'open-code-review': 'quality', 'archify': 'quality', 'superpowers': 'quality',
  'mattpocock-skills': 'quality', 'claude-plugins-official': 'quality', 'awesome-claude-code': 'quality',
  'kubernetes-the-hard-way': 'quality', 'awesome-scalability': 'quality', 'n8n': 'quality', 'ruflo': 'quality',
  'paperclip': 'quality', 'agent-reach': 'quality',
  'impeccable': 'design', 'front-end-checklist': 'design', 'bootstrap': 'design', 'font-awesome': 'design',
  'css-gg': 'design', 'emil-design-eng': 'design', 'make-interfaces-better': 'design', 'react-doctor': 'design',
  'fixing-accessibility': 'design', 'shadcn-ui': 'design', 'app-ideas': 'design',
};

const REPO_CATEGORIES = [
  { label: 'All', key: 'all' },
  { label: 'Browser', key: 'browser' },
  { label: 'Animation', key: 'animation' },
  { label: 'Design', key: 'design' },
  { label: 'Backend', key: 'backend' },
  { label: 'Security', key: 'security' },
  { label: 'Quality', key: 'quality' },
];

function ReposSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? REPOS : REPOS.filter(r => REPO_CATEGORY[r.id] === filter);
  return (
    <section id="repos" ref={ref} style={{ padding: '8rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
        <div className="section-label">04 — Repository</div>
        <h2 className="text-4xl md:text-5xl font-black mb-4">{REPOS.length} <span className="gradient-text">Capabilities</span></h2>
        <p className="mb-8" style={{ color: '#a0a0c0' }}>Every repository is a registered reference capability — 37 from the specification plus design-engineering, research and test skills. The planner selects only those relevant to your goal.</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {REPO_CATEGORIES.map(c => (
            <motion.button key={c.label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setFilter(c.key)} className={`tag ${filter === c.key ? 'cyan' : ''}`} style={{ cursor: 'pointer', opacity: filter === c.key ? 1 : 0.5 }}>{c.label}</motion.button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.03, duration: 0.5 }} whileHover={{ y: -4, boxShadow: `0 0 30px ${r.color}33` }} style={{ background: '#1a1a25', border: `1px solid ${r.color}22`, borderRadius: '16px', padding: '1.5rem', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="font-mono text-xs" style={{ color: '#606080' }}>#{REPOS.indexOf(r) + 1}</span>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, display: 'inline-block', boxShadow: `0 0 8px ${r.color}` }} />
              </div>
              <h4 className="font-bold text-sm mb-1" style={{ color: r.color }}>{r.name}</h4>
              <p className="text-xs leading-relaxed" style={{ color: '#a0a0c0' }}>{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

const PROJECTS: { name: string; desc: string; tags: string[]; color: string }[] = [
  { name: 'DIP Platform', desc: 'Full autonomous engineering platform. 46 registered repo capabilities, 14 phases, 8 subagents.', tags: ['AI Agents', 'Security', 'Planning'], color: '#00d4ff' },
  { name: 'Security Pipeline', desc: 'Evidence-driven security automation: pentest, vulnerability scan, code review, threat model.', tags: ['Security', 'CI/CD', 'Testing'], color: '#ef4444' },
  { name: 'Animation System', desc: 'Production-grade UI animation with Framer Motion, 12 Principles, CSS animations.', tags: ['Animation', 'Framer Motion', 'CSS'], color: '#8b5cf6' },
];

function ProjectsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <section id="projects" ref={ref} style={{ padding: '8rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
        <div className="section-label">05 — Projects</div>
        <h2 className="text-4xl md:text-5xl font-black mb-4">Featured <span className="gradient-text">Work</span></h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PROJECTS.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 50, rotateX: 10 }} animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}} transition={{ delay: i * 0.15, duration: 0.7 }} whileHover={{ y: -6 }} className="card" style={{ border: `1px solid ${p.color}22` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${p.color}15`, border: `1px solid ${p.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}><span className="text-2xl">🚀</span></div>
              <h3 className="font-bold text-lg mb-2" style={{ color: p.color }}>{p.name}</h3>
              <p className="text-sm mb-4" style={{ color: '#a0a0c0' }}>{p.desc}</p>
              <div className="flex gap-2 flex-wrap">{p.tags.map(t => <span key={t} className="tag" style={{ color: p.color, borderColor: `${p.color}33`, background: `${p.color}08` }}>{t}</span>)}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function Contact() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <section id="contact" ref={ref} style={{ padding: '8rem 2rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
      <motion.div initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
        <div className="section-label" style={{ justifyContent: 'center' }}>06 — Contact</div>
        <h2 className="text-4xl md:text-5xl font-black mb-4">Let&apos;s Build Something <span className="gradient-text">Verified</span></h2>
        <p className="mb-10" style={{ color: '#a0a0c0' }}>Available for engineering work — autonomous systems, security automation, and production-grade frontend.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <motion.a href="https://github.com/Biswadipgoj" target="_blank" rel="noopener" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary">GitHub →</motion.a>
          <motion.a href="https://github.com/Biswadipgoj/BISWODIP-ENGINEERING-skills" target="_blank" rel="noopener" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-outline">View the System →</motion.a>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: '4rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <div className="font-mono text-sm mb-2" style={{ color: '#606080' }}>&lt;Biswodip Goj — Unified Engineering /&gt;</div>
        <p className="text-sm" style={{ color: '#606080' }}>Apache-2.0 License. Built with evidence, shipped with discipline.</p>
        <div className="flex items-center justify-center gap-6 mt-4">
          {[['GitHub', 'https://github.com/Biswadipgoj'], ['Vercel', 'https://vercel.com'], ['npm', 'https://npmjs.com']].map(([name, url]) => (
            <motion.a key={name} href={url} target="_blank" rel="noopener" whileHover={{ color: '#00d4ff' }} className="text-sm" style={{ color: '#606080' }}>{name}</motion.a>
          ))}
        </div>
      </motion.div>
    </footer>
  );
}
