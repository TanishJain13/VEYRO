'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  GitCommit,
  ArrowRight,
  AlertTriangle,
  Flame,
  FileCode,
  CheckCircle2,
  Sparkles,
  MousePointer,
  Film,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  SAMPLE_RESOLVED_REPO,
  SAMPLE_SHOWCASE_METRICS,
} from '@/lib/fixtures/sample-repo';

// Register GSAP ScrollTrigger plugin on client
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const SHOWCASE_BEATS = [
  {
    id: 'import',
    step: '01',
    act: 'ACT I',
    codeName: 'INGEST',
    title: 'Repository Ingest & Snapshot',
    tag: 'Immutable Revision',
    subtitle: 'Pin the repository to an exact GitHub commit snapshot',
    desc: 'Enter any public GitHub URL. VEYRO resolves the default branch to an immutable 40-character commit SHA, retrieves the tree, and filters build noise.',
    badge: 'Commit SHA Pinned',
    widthPct: '20%',
  },
  {
    id: 'parse',
    step: '02',
    act: 'ACT II',
    codeName: 'AST PARSE',
    title: 'Index & AST Tokenization',
    tag: 'TypeScript Compiler API & Grammar',
    subtitle: 'Semantic symbol and import extraction',
    desc: 'Files are routed to language-specific adapters. The TypeScript Compiler API parses genuine symbols, interfaces, and imports without regex guessing.',
    badge: 'AST Parsers Active',
    widthPct: '25%',
  },
  {
    id: 'connect',
    step: '03',
    act: 'ACT III',
    codeName: 'TOPOLOGY',
    title: 'Connect Dependency Topology',
    tag: 'Dagre Layout & Directed Graph',
    subtitle: 'Transform files into a navigable architectural map',
    desc: 'Resolved import specifiers are linked to target files, external packages, and standard libraries. Nodes settle into a deterministic topological layout.',
    badge: 'Topology Constructed',
    widthPct: '25%',
  },
  {
    id: 'inspect',
    step: '04',
    act: 'ACT IV',
    codeName: 'TARJAN SCC',
    title: 'Inspect Cycles & Architecture',
    tag: 'Tarjan SCC Cycle Detection',
    subtitle: 'Isolate circular loops and coupling hotspots',
    desc: 'Tarjan’s algorithm detects circular import loops before runtime errors occur. High in-degree architectural hubs and verified coverage are surfaced.',
    badge: 'Cycles Identified',
    widthPct: '18%',
  },
  {
    id: 'explore',
    step: '05',
    act: 'ACT V',
    codeName: 'WORKSPACE',
    title: 'Complete Developer Workspace',
    tag: 'Interactive Developer Workspace',
    subtitle: 'Navigate source code in context with synchronized views',
    desc: 'Inspect code with CodeMirror 6, jump between upstream and downstream dependents, and command-palette search files, symbols, and diagnostics.',
    badge: 'Explorer Ready',
    widthPct: '12%',
  },
];

export function ScrollShowcase() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Scene Elements
  const urlBoxRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const fileTreeRef = useRef<HTMLDivElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const graphLayerRef = useRef<HTMLDivElement>(null);
  const edgesSvgRef = useRef<SVGSVGElement>(null);
  const cycleAlertRef = useRef<HTMLDivElement>(null);
  const inspectorPanelRef = useRef<HTMLDivElement>(null);
  const ctaDockRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Graph Nodes
  const nodeIndexRef = useRef<HTMLDivElement>(null);
  const nodeAuthRef = useRef<HTMLDivElement>(null);
  const nodeUserRef = useRef<HTMLDivElement>(null);
  const nodeTokenRef = useRef<HTMLDivElement>(null);
  const nodeCryptoRef = useRef<HTMLDivElement>(null);
  const nodePkgRef = useRef<HTMLDivElement>(null);

  // SVG Paths
  const edgeIndexAuthRef = useRef<SVGPathElement>(null);
  const edgeAuthTokenRef = useRef<SVGPathElement>(null);
  const edgeAuthCryptoRef = useRef<SVGPathElement>(null);
  const edgeCryptoPkgRef = useRef<SVGPathElement>(null);
  const edgeAuthUserRef = useRef<SVGPathElement>(null);
  const edgeUserAuthRef = useRef<SVGPathElement>(null);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // State
  const [activeBeatIndex, setActiveBeatIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const prefersReducedMotion = useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', callback);
      return () => mq.removeEventListener('change', callback);
    },
    () => (typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false),
    () => false
  );

  useEffect(() => {
    if (prefersReducedMotion || !runwayRef.current || !sceneRef.current) return;

    const ctx = gsap.context(() => {
      // MASTER GSAP TIMELINE CONTROLLED BY SCROLLTRIGGER
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: runwayRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          onUpdate: (self) => {
            const p = self.progress;
            setScrollProgress(p);
            // Map progress to active narrative beat (5 beats: 0..4)
            if (p < 0.20) setActiveBeatIndex(0);
            else if (p < 0.45) setActiveBeatIndex(1);
            else if (p < 0.70) setActiveBeatIndex(2);
            else if (p < 0.88) setActiveBeatIndex(3);
            else setActiveBeatIndex(4);
          },
        },
      });

      timelineRef.current = tl;

      // ─────────────────────────────────────────────────────────────
      // INITIAL STAGE RESET
      // ─────────────────────────────────────────────────────────────
      tl.set(cursorRef.current, { x: 300, y: 220, opacity: 0 });
      tl.set(urlBoxRef.current, { scale: 1, opacity: 1, y: 0, display: 'flex' });
      tl.set(fileTreeRef.current, { x: -60, opacity: 0 });
      tl.set(editorPanelRef.current, { opacity: 0, scale: 0.9, x: 20 });
      tl.set(graphLayerRef.current, { opacity: 0 });
      tl.set(cycleAlertRef.current, { opacity: 0, y: 20 });
      tl.set(inspectorPanelRef.current, { opacity: 0, x: 60 });
      tl.set(ctaDockRef.current, { opacity: 0, y: 40 });

      const forwardEdges = [
        edgeIndexAuthRef.current,
        edgeAuthTokenRef.current,
        edgeAuthCryptoRef.current,
        edgeCryptoPkgRef.current,
        edgeAuthUserRef.current,
      ];
      tl.set([...forwardEdges, edgeUserAuthRef.current], { opacity: 0 });

      // ─────────────────────────────────────────────────────────────
      // BEAT 1: Ingest URL -> Resolves -> Expands into Workspace
      // Timeline: 0.00 -> 0.20
      // ─────────────────────────────────────────────────────────────
      tl.to(cursorRef.current, {
        opacity: 1,
        x: 180,
        y: 80,
        duration: 0.06,
        ease: 'power2.out',
      });

      // Cursor clicks Ingest
      tl.to(cursorRef.current, {
        scale: 0.85,
        duration: 0.02,
        yoyo: true,
        repeat: 1,
      });

      // URL box shrinks and cleanly fades out (completely hidden so center canvas is clear)
      tl.to(urlBoxRef.current, {
        scale: 0.7,
        y: -120,
        opacity: 0,
        duration: 0.08,
        ease: 'power2.in',
      });

      // File tree panel emerges from the left
      tl.to(
        fileTreeRef.current,
        {
          opacity: 1,
          x: 0,
          duration: 0.08,
          ease: 'power2.out',
        },
        '<'
      );

      // Cursor glides to auth.ts in file tree
      tl.to(cursorRef.current, {
        x: -280,
        y: -15,
        duration: 0.06,
        ease: 'power1.inOut',
      });

      // ─────────────────────────────────────────────────────────────
      // BEAT 2: Source Code Opens & AST Tokenization
      // Timeline: 0.20 -> 0.45
      // ─────────────────────────────────────────────────────────────
      tl.to(cursorRef.current, {
        scale: 0.85,
        duration: 0.02,
        yoyo: true,
        repeat: 1,
      });

      // Editor panel unfolds from auth.ts
      tl.to(editorPanelRef.current, {
        opacity: 1,
        scale: 1,
        x: 0,
        duration: 0.12,
        ease: 'power3.out',
      });

      // Fade out pointer cursor once file is opened
      tl.to(cursorRef.current, {
        opacity: 0,
        duration: 0.04,
      });

      // Stagger highlight lines in editor
      tl.fromTo(
        '.showcase-code-line',
        { opacity: 0.3, x: 10 },
        { opacity: 1, x: 0, stagger: 0.02, duration: 0.08 },
        '-=0.04'
      );

      // ─────────────────────────────────────────────────────────────
      // BEAT 3: Imports Become Topological Connections
      // Timeline: 0.45 -> 0.70
      // ─────────────────────────────────────────────────────────────
      // Editor panel transforms/contracts into the graph
      tl.to(editorPanelRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.1,
        ease: 'power2.inOut',
      });

      tl.to(
        fileTreeRef.current,
        {
          opacity: 0.35,
          x: -30,
          duration: 0.1,
        },
        '<'
      );

      // Graph layer enters smoothly
      tl.to(
        graphLayerRef.current,
        {
          opacity: 1,
          duration: 0.1,
        },
        '<'
      );

      // Nodes scale into position
      tl.fromTo(
        [
          nodeIndexRef.current,
          nodeAuthRef.current,
          nodeUserRef.current,
          nodeTokenRef.current,
          nodeCryptoRef.current,
          nodePkgRef.current,
        ],
        { scale: 0.7, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.02,
          duration: 0.1,
          ease: 'back.out(1.4)',
        },
        '<'
      );

      // Forward SVG connector paths appear progressively
      tl.to(
        forwardEdges,
        {
          opacity: 1,
          stagger: 0.02,
          duration: 0.1,
          ease: 'power2.out',
        },
        '<'
      );

      // ─────────────────────────────────────────────────────────────
      // BEAT 4: Tarjan SCC Detects Cycle (auth.ts ⇄ user.ts)
      // Timeline: 0.70 -> 0.88
      // ─────────────────────────────────────────────────────────────
      // Camera zooms toward auth.ts & user.ts
      tl.to(sceneRef.current, {
        scale: 1.15,
        x: -50,
        y: 20,
        duration: 0.1,
        ease: 'power2.inOut',
      });

      // Dim non-cycle nodes
      tl.to(
        [nodeIndexRef.current, nodeTokenRef.current, nodeCryptoRef.current, nodePkgRef.current],
        {
          opacity: 0.15,
          duration: 0.06,
        },
        '<'
      );

      // Draw cyclic reverse edge from user.ts back to auth.ts
      if (edgeUserAuthRef.current) {
        tl.to(
          edgeUserAuthRef.current,
          {
            opacity: 1,
            duration: 0.08,
            ease: 'power2.out',
          },
          '<'
        );
      }

      // Cycle alert banner and finding inspector appear alongside the zoom
      tl.to(
        cycleAlertRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.08,
          ease: 'power2.out',
        },
        '<'
      );

      tl.to(
        inspectorPanelRef.current,
        {
          opacity: 1,
          x: 0,
          duration: 0.08,
          ease: 'power2.out',
        },
        '<'
      );

      // ─────────────────────────────────────────────────────────────
      // BEAT 5: Full Product Workspace & Sample Launch CTA
      // Timeline: 0.88 -> 1.00
      // ─────────────────────────────────────────────────────────────
      // Camera pulls back to full view
      tl.to(sceneRef.current, {
        scale: 1,
        x: 0,
        y: 0,
        duration: 0.1,
        ease: 'power2.inOut',
      });

      // Restore all nodes to full clarity
      tl.to(
        [nodeIndexRef.current, nodeTokenRef.current, nodeCryptoRef.current, nodePkgRef.current],
        {
          opacity: 1,
          duration: 0.06,
        },
        '<'
      );

      tl.to(
        fileTreeRef.current,
        {
          opacity: 0.85,
          x: 0,
          duration: 0.06,
        },
        '<'
      );

      // Dock CTA appears prominently
      tl.to(
        ctaDockRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.08,
          ease: 'back.out(1.2)',
        },
        '-=0.02'
      );
    }, runwayRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  const scrollToBeat = (index: number) => {
    // Explicit progress milestones for the 5 beats
    const beatMilestones = [0.0, 0.35, 0.65, 0.85, 1.0];
    const targetProgress = beatMilestones[index] ?? 0;

    if (timelineRef.current) {
      timelineRef.current.progress(targetProgress);
    }
    setActiveBeatIndex(index);
    setScrollProgress(targetProgress);

    if (!runwayRef.current) return;
    const rect = runwayRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = rect.top + scrollTop;
    const totalScrollable = rect.height - window.innerHeight;
    const targetScroll = containerTop + targetProgress * totalScrollable;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  };

  const formatSMPTE = (progress: number): string => {
    // 30-second virtual cinematic reel at 24 fps
    const totalFrames = Math.floor(progress * 720);
    const minutes = Math.floor(totalFrames / (24 * 60));
    const seconds = Math.floor((totalFrames % (24 * 60)) / 24);
    const frames = totalFrames % 24;
    return `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !runwayRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));

    if (timelineRef.current) {
      timelineRef.current.progress(pct);
    }
    setScrollProgress(pct);

    if (pct < 0.20) setActiveBeatIndex(0);
    else if (pct < 0.45) setActiveBeatIndex(1);
    else if (pct < 0.70) setActiveBeatIndex(2);
    else if (pct < 0.88) setActiveBeatIndex(3);
    else setActiveBeatIndex(4);

    const runwayRect = runwayRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = runwayRect.top + scrollTop;
    const totalScrollable = runwayRect.height - window.innerHeight;
    const targetScroll = containerTop + pct * totalScrollable;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  };

  const currentBeat = SHOWCASE_BEATS[activeBeatIndex];

  return (
    <section
      id="showcase"
      ref={runwayRef}
      className="relative min-h-[580vh] bg-[#08090C] text-[var(--veyro-text-primary)] border-t border-[var(--veyro-border)] select-none"
    >
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#15192315_1px,transparent_1px),linear-gradient(to_bottom,#15192315_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Pinned Viewport Container */}
      <div
        ref={stageContainerRef}
        className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden px-3 sm:px-6 pt-20 pb-3 z-10"
      >
        {/* Top Film Director HUD & Precision Scrubber Bar */}
        <div className="max-w-6xl w-full mx-auto flex flex-col gap-2.5 shrink-0">
          {/* Row 1: Cinematic Director Status & SMPTE Timecode Deck */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Left: Film Slate & Dynamic Act Name */}
            <div className="flex items-center gap-3">
              {/* Live Film Scrub Beacon */}
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/25 font-mono text-[11px] text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <span className="font-bold tracking-wider">LIVE FILM SCRUB</span>
              </div>

              <div className="h-4 w-px bg-[var(--veyro-border)] hidden sm:block" />

              {/* Dynamic Act Name & Scene */}
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-bold text-[var(--veyro-cyan)]">
                  {currentBeat.act}
                </span>
                <span className="text-white font-bold text-sm tracking-tight">
                  {currentBeat.title}
                </span>
                <span className="text-[11px] font-mono text-[var(--veyro-text-tertiary)] hidden md:inline">
                  {`// ${currentBeat.tag}`}
                </span>
              </div>
            </div>

            {/* Right: SMPTE Timecode & Telemetry */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              {/* SMPTE Timecode Display */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#0d0f17] border border-[var(--veyro-border)] font-mono text-xs shadow-inner">
                <span className="text-[10px] text-[var(--veyro-text-tertiary)] uppercase tracking-wider">SMPTE</span>
                <span className="text-[var(--veyro-cyan)] font-bold tracking-widest">
                  {formatSMPTE(scrollProgress)}
                </span>
              </div>

              {/* Frame Counter */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0d0f17] border border-[var(--veyro-border)] font-mono text-[11px] text-[var(--veyro-text-secondary)]">
                <span className="text-[var(--veyro-text-tertiary)]">FR:</span>
                <span className="text-white font-semibold">
                  {String(Math.min(240, Math.floor(scrollProgress * 240) + 1)).padStart(3, '0')}
                </span>
                <span className="text-[var(--veyro-text-tertiary)]">/ 240</span>
              </div>

              {/* Scrub Engine Badge */}
              <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded bg-[var(--veyro-violet)]/10 text-[var(--veyro-violet)] border border-[var(--veyro-violet)]/20">
                <Film className="w-3 h-3 text-[var(--veyro-cyan)]" />
                <span>60 FPS</span>
              </div>
            </div>
          </div>

          {/* Row 2: BESPOKE CONTINUOUS FILMSTRIP SCRUBBER TRACK */}
          <div className="relative w-full">
            <div
              ref={trackRef}
              onClick={handleTrackClick}
              className="group relative w-full h-11 rounded-xl border border-[var(--veyro-border)]/80 bg-[#0A0C12] overflow-hidden shadow-2xl flex items-stretch cursor-pointer select-none transition-colors hover:border-[var(--veyro-cyan)]/40"
              role="slider"
              aria-label="Timeline filmstrip scrubber"
              aria-valuenow={Math.round(scrollProgress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {/* Micro-tick background texture (tactile audio/film ruler effect) */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #9298A7 0px, #9298A7 1px, transparent 1px, transparent 12px), repeating-linear-gradient(90deg, #9298A7 0px, #9298A7 1px, transparent 1px, transparent 60px)',
                  backgroundPosition: '0 bottom',
                  backgroundSize: '100% 6px, 100% 12px',
                  backgroundRepeat: 'no-repeat',
                }}
              />

              {/* 5 Seamlessly Tiled Act Sectors */}
              {SHOWCASE_BEATS.map((beat, idx) => {
                const isActive = activeBeatIndex === idx;
                const isPassed = activeBeatIndex > idx;

                return (
                  <div
                    key={beat.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToBeat(idx);
                    }}
                    style={{ width: beat.widthPct }}
                    className={`relative h-full flex flex-col justify-center px-2 sm:px-3 border-r border-[var(--veyro-border)]/40 transition-all duration-200 z-10 ${
                      isActive
                        ? 'bg-[var(--veyro-cyan)]/[0.08] text-[var(--veyro-cyan)]'
                        : isPassed
                          ? 'bg-transparent text-[var(--veyro-text-primary)] hover:bg-white/[0.02]'
                          : 'bg-transparent text-[var(--veyro-text-tertiary)] hover:text-[var(--veyro-text-secondary)] hover:bg-white/[0.01]'
                    }`}
                  >
                    {/* Active top edge glow line */}
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--veyro-cyan)] to-transparent shadow-[0_0_8px_#5CD6E8]" />
                    )}

                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`font-mono text-[9px] tracking-widest uppercase transition-colors ${
                          isActive
                            ? 'text-[var(--veyro-cyan)] font-bold'
                            : isPassed
                              ? 'text-[var(--veyro-violet)]'
                              : 'text-[var(--veyro-text-tertiary)]'
                        }`}
                      >
                        {beat.act}
                      </span>

                      <span className="text-[9px] font-mono opacity-40 hidden md:inline">
                        {beat.step}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                          isActive
                            ? 'bg-[var(--veyro-cyan)] shadow-[0_0_6px_#5CD6E8] scale-125'
                            : isPassed
                              ? 'bg-[var(--veyro-violet)]/80'
                              : 'bg-white/20'
                        }`}
                      />
                      <span
                        className={`font-mono text-[10px] sm:text-[11px] font-semibold truncate transition-colors ${
                          isActive
                            ? 'text-white'
                            : isPassed
                              ? 'text-[var(--veyro-text-secondary)]'
                              : 'text-[var(--veyro-text-tertiary)]'
                        }`}
                      >
                        {beat.codeName}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic Progress Fill underneath */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[var(--veyro-violet)]/10 via-[var(--veyro-cyan)]/15 to-[var(--veyro-cyan)]/25 pointer-events-none transition-all duration-75"
                style={{ width: `${Math.round(scrollProgress * 100)}%` }}
              />

              {/* Continuous Laser Playhead Needle */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-30 transition-all duration-75 flex flex-col items-center"
                style={{
                  left: `${Math.max(0.5, Math.min(99.5, scrollProgress * 100))}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Top Diamond Head */}
                <div className="w-2.5 h-2.5 rotate-45 bg-[var(--veyro-cyan)] shadow-[0_0_10px_#5CD6E8] shrink-0 -mt-0.5" />
                {/* Vertical Laser Beam */}
                <div className="w-[2px] h-full bg-gradient-to-b from-[var(--veyro-cyan)] via-[var(--veyro-cyan)] to-[var(--veyro-violet)] shadow-[0_0_8px_rgba(92,214,232,0.8)]" />
                {/* Bottom Diamond Foot */}
                <div className="w-2 h-2 rotate-45 bg-[var(--veyro-cyan)] shadow-[0_0_8px_#5CD6E8] shrink-0 -mb-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Central Master Studio Window */}
        <div className="max-w-6xl w-full mx-auto flex-1 my-2 min-h-0 flex items-center justify-center relative">
          {/* Subtle anamorphic ambient light bloom behind the window */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(92,214,232,0.06)_0%,rgba(139,124,255,0.04)_40%,transparent_70%)] pointer-events-none" />

          <div className="w-full h-full max-h-[530px] rounded-2xl border border-[var(--veyro-border)] bg-[var(--veyro-bg-elevated)] shadow-[0_24px_80px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden relative">
            {/* Window Chrome Header */}
            <div className="h-9 px-4 bg-[var(--veyro-bg-base)] border-b border-[var(--veyro-border)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-mono text-[var(--veyro-text-tertiary)] flex items-center gap-2">
                  <span>github.com/veyro-sample/fixture</span>
                  <span className="text-[var(--veyro-border)]">|</span>
                  <GitCommit className="w-3 h-3 text-[var(--veyro-cyan)]" />
                  <span className="text-[var(--veyro-cyan)]">
                    {SAMPLE_RESOLVED_REPO.commitSha.substring(0, 7)}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--veyro-violet)]/10 text-[var(--veyro-violet)] border border-[var(--veyro-violet)]/20">
                  {currentBeat.badge}
                </span>
              </div>
            </div>

            {/* Continuous Cinematic Scene Canvas */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
              {/* Virtual Animated Pointer Cursor */}
              <div
                ref={cursorRef}
                className="absolute z-50 pointer-events-none transition-transform duration-75 text-[var(--veyro-cyan)] drop-shadow-[0_2px_8px_rgba(92,214,232,0.6)]"
              >
                <MousePointer className="w-5 h-5 fill-current" />
              </div>

              {/* CAMERA RIG (Scales and pans smoothly during transitions) */}
              <div
                ref={sceneRef}
                className="w-full h-full relative flex items-center justify-center transition-transform will-change-transform"
              >
                {/* ── SCENE 1: INGESTION HERO RIG ── */}
                <div
                  ref={urlBoxRef}
                  className="absolute z-30 max-w-lg w-full p-6 rounded-xl border border-[var(--veyro-violet)]/40 bg-[var(--veyro-bg-surface)]/95 shadow-2xl flex flex-col gap-4 text-center"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-[var(--veyro-text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--veyro-cyan)]" /> Ingest Codebase
                    </span>
                    <span className="text-[var(--veyro-cyan)]">Git Revision Pinned</span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[var(--veyro-bg-base)] border border-[var(--veyro-border)] font-mono text-xs text-[var(--veyro-text-primary)]">
                    <span className="text-[var(--veyro-text-tertiary)]">https://</span>
                    <span className="text-[var(--veyro-cyan)]">github.com/veyro-sample/fixture</span>
                    <span className="ml-auto inline-block w-1.5 h-4 bg-[var(--veyro-violet)] animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--veyro-text-tertiary)] pt-1">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Commit: {SAMPLE_RESOLVED_REPO.commitSha.substring(0, 10)}...
                    </span>
                    <span>Filtering: node_modules, .git</span>
                  </div>
                </div>

                {/* ── SCENE 2: FILE TREE (Staggers in & selected) ── */}
                <div
                  ref={fileTreeRef}
                  className="absolute left-4 top-4 bottom-4 w-52 rounded-lg border border-[var(--veyro-border)] bg-[var(--veyro-bg-base)]/80 p-3 flex flex-col gap-1.5 text-xs font-mono z-20 opacity-0"
                >
                  <div className="text-[10px] uppercase tracking-wider text-[var(--veyro-text-tertiary)] font-bold pb-1 border-b border-[var(--veyro-border)] flex items-center justify-between">
                    <span>Repository Tree</span>
                    <span className="text-[var(--veyro-cyan)]">8 files</span>
                  </div>
                  <div className="text-[var(--veyro-text-secondary)] flex items-center gap-1.5 pt-1">
                    <span className="text-[var(--veyro-text-tertiary)]">▾</span>
                    <span>src/</span>
                  </div>
                  <div className="pl-3 flex flex-col gap-1 border-l border-[var(--veyro-border)]/50 ml-1.5">
                    <div className="text-[var(--veyro-text-secondary)] flex items-center gap-1">
                      <span className="text-[var(--veyro-text-tertiary)]">▾</span>
                      <span>services/</span>
                    </div>
                    <div className="pl-3 flex flex-col gap-1 border-l border-[var(--veyro-border)]/50 ml-1.5">
                      <div className="px-2 py-1 rounded bg-[var(--veyro-violet)]/20 border border-[var(--veyro-violet)] text-white font-semibold flex items-center justify-between">
                        <span>auth.ts</span>
                        <span className="text-[9px] text-[var(--veyro-cyan)]">ACTIVE</span>
                      </div>
                      <div className="px-2 py-0.5 text-[var(--veyro-text-secondary)]">user.ts</div>
                      <div className="px-2 py-0.5 text-[var(--veyro-text-secondary)]">token.ts</div>
                    </div>
                    <div className="text-[var(--veyro-text-secondary)] flex items-center gap-1">
                      <span className="text-[var(--veyro-text-tertiary)]">▾</span>
                      <span>utils/</span>
                    </div>
                    <div className="pl-3 flex flex-col gap-1 border-l border-[var(--veyro-border)]/50 ml-1.5">
                      <div className="px-2 py-0.5 text-[var(--veyro-text-secondary)]">crypto.ts</div>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 text-[var(--veyro-text-secondary)] mt-1">package.json</div>
                  <div className="mt-auto pt-2 border-t border-[var(--veyro-border)] text-[10px] text-[var(--veyro-text-tertiary)]">
                    AST Parser: TS Compiler API
                  </div>
                </div>

                {/* ── SCENE 2: CODE EDITOR (Expands with real syntax) ── */}
                <div
                  ref={editorPanelRef}
                  className="absolute left-60 right-6 top-4 bottom-4 rounded-lg border border-[var(--veyro-border)] bg-[var(--veyro-bg-base)] flex flex-col overflow-hidden z-20 shadow-xl opacity-0"
                >
                  <div className="h-7 px-3 bg-[var(--veyro-bg-surface)] border-b border-[var(--veyro-border)] flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--veyro-text-primary)] flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-[var(--veyro-violet)]" />
                      src/services/auth.ts
                    </span>
                    <span className="text-[10px] text-[var(--veyro-cyan)]">TypeScript 5 AST</span>
                  </div>
                  <div className="flex-1 p-4 font-mono text-xs leading-relaxed overflow-hidden text-[var(--veyro-text-secondary)] flex flex-col gap-1.5">
                    <div className="showcase-code-line flex items-center gap-4">
                      <span className="w-4 text-[var(--veyro-text-tertiary)] text-right">1</span>
                      <span className="text-purple-400">import</span>
                      <span className="text-amber-300">&#123; getUser &#125;</span>
                      <span className="text-purple-400">from</span>
                      <span className="text-emerald-400">&apos;./user&apos;</span>
                      <span className="text-[var(--veyro-border)]">;</span>
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[var(--veyro-cyan)]/15 text-[var(--veyro-cyan)]">
                        @ast: import_specifier
                      </span>
                    </div>
                    <div className="showcase-code-line flex items-center gap-4">
                      <span className="w-4 text-[var(--veyro-text-tertiary)] text-right">2</span>
                      <span className="text-purple-400">import</span>
                      <span className="text-amber-300">&#123; generateToken &#125;</span>
                      <span className="text-purple-400">from</span>
                      <span className="text-emerald-400">&apos;./token&apos;</span>
                      <span className="text-[var(--veyro-border)]">;</span>
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[var(--veyro-cyan)]/15 text-[var(--veyro-cyan)]">
                        @ast: import_specifier
                      </span>
                    </div>
                    <div className="showcase-code-line flex items-center gap-4">
                      <span className="w-4 text-[var(--veyro-text-tertiary)] text-right">3</span>
                      <span className="text-purple-400">import</span>
                      <span className="text-amber-300">&#123; hashPassword &#125;</span>
                      <span className="text-purple-400">from</span>
                      <span className="text-emerald-400">&apos;../utils/crypto&apos;</span>
                      <span className="text-[var(--veyro-border)]">;</span>
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[var(--veyro-cyan)]/15 text-[var(--veyro-cyan)]">
                        @ast: import_specifier
                      </span>
                    </div>
                    <div className="showcase-code-line flex items-center gap-4 pt-2">
                      <span className="w-4 text-[var(--veyro-text-tertiary)] text-right">4</span>
                      <span className="text-blue-400">export function</span>
                      <span className="text-yellow-200">authenticate</span>
                      <span className="text-[var(--veyro-text-primary)]">(name: string) &#123;</span>
                    </div>
                    <div className="showcase-code-line flex items-center gap-4 pl-4">
                      <span className="w-4 text-[var(--veyro-text-tertiary)] text-right">5</span>
                      <span className="text-blue-400">const</span>
                      <span className="text-[var(--veyro-text-primary)]">user =</span>
                      <span className="text-yellow-200">getUser</span>
                      <span className="text-[var(--veyro-text-primary)]">(name);</span>
                    </div>
                    <div className="showcase-code-line flex items-center gap-4 pl-4">
                      <span className="w-4 text-[var(--veyro-text-tertiary)] text-right">6</span>
                      <span className="text-purple-400">return</span>
                      <span className="text-[var(--veyro-text-primary)]">&#123; token: generateToken(user), user &#125;;</span>
                    </div>
                    <div className="showcase-code-line flex items-center gap-4">
                      <span className="w-4 text-[var(--veyro-text-tertiary)] text-right">7</span>
                      <span className="text-[var(--veyro-text-primary)]">&#125;</span>
                    </div>
                  </div>
                </div>

                {/* ── SCENE 3 & 4: TOPOLOGICAL GRAPH & SVG EDGES ── */}
                <div
                  ref={graphLayerRef}
                  className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center opacity-0"
                >
                  {/* SVG Canvas for Directed Dependency Connectors */}
                  <svg
                    ref={edgesSvgRef}
                    className="absolute inset-0 w-full h-full overflow-visible"
                    viewBox="0 0 960 480"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <marker
                        id="arrow-cyan"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#5CD6E8" />
                      </marker>
                      <marker
                        id="arrow-violet"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#8B7CFF" />
                      </marker>
                      <marker
                        id="arrow-red"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#F87171" />
                      </marker>
                    </defs>

                    {/* index.ts -> auth.ts: right of index (220, 122) to left of auth (350, 122) */}
                    <path
                      ref={edgeIndexAuthRef}
                      d="M 220 122 L 350 122"
                      fill="none"
                      stroke="#8B7CFF"
                      strokeWidth="2"
                      markerEnd="url(#arrow-violet)"
                    />

                    {/* auth.ts -> token.ts: bottom of auth (390, 154) to top of token (250, 280) */}
                    <path
                      ref={edgeAuthTokenRef}
                      d="M 390 154 C 370 210, 280 230, 250 280"
                      fill="none"
                      stroke="#5CD6E8"
                      strokeWidth="2"
                      markerEnd="url(#arrow-cyan)"
                    />

                    {/* auth.ts -> crypto.ts: bottom of auth (470, 154) to top of crypto (510, 280) */}
                    <path
                      ref={edgeAuthCryptoRef}
                      d="M 470 154 C 480 200, 500 230, 510 280"
                      fill="none"
                      stroke="#5CD6E8"
                      strokeWidth="2"
                      markerEnd="url(#arrow-cyan)"
                    />

                    {/* crypto.ts -> package.json: right of crypto (580, 312) to left of package (700, 312) */}
                    <path
                      ref={edgeCryptoPkgRef}
                      d="M 580 312 L 700 312"
                      fill="none"
                      stroke="#5CD6E8"
                      strokeWidth="2"
                      markerEnd="url(#arrow-cyan)"
                    />

                    {/* auth.ts -> user.ts (Forward Dependency): right of auth (510, 110) to left of user (640, 110) */}
                    <path
                      ref={edgeAuthUserRef}
                      d="M 510 110 C 550 95, 600 95, 640 110"
                      fill="none"
                      stroke="#8B7CFF"
                      strokeWidth="2.5"
                      markerEnd="url(#arrow-violet)"
                    />

                    {/* user.ts -> auth.ts (CYCLIC RETURN EDGE — DISCOVERED IN SCENE 4) */}
                    <path
                      ref={edgeUserAuthRef}
                      d="M 640 134 C 600 150, 550 150, 510 134"
                      fill="none"
                      stroke="#F87171"
                      strokeWidth="3"
                      strokeDasharray="4 2"
                      markerEnd="url(#arrow-red)"
                      className="animate-pulse"
                    />
                  </svg>

                  {/* 6 DETERMINISTIC GRAPH NODES (Positioned mathematically) */}
                  {/* Node 1: Entrypoint */}
                  <div
                    ref={nodeIndexRef}
                    style={{ position: 'absolute', left: '80px', top: '90px', width: '140px', height: '64px' }}
                    className="p-2.5 rounded-lg border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] text-xs font-mono shadow-md"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[var(--veyro-text-tertiary)]">
                      <span>ENTRYPOINT</span>
                      <span className="text-[var(--veyro-cyan)]">TS</span>
                    </div>
                    <div className="font-semibold text-[var(--veyro-text-primary)] truncate mt-0.5">src/index.ts</div>
                    <div className="text-[10px] text-[var(--veyro-text-secondary)] mt-0.5">out: 2 • in: 0</div>
                  </div>

                  {/* Node 2: Core Service (auth.ts — morphed from editor) */}
                  <div
                    ref={nodeAuthRef}
                    style={{ position: 'absolute', left: '350px', top: '90px', width: '160px', height: '64px' }}
                    className="p-2.5 rounded-lg border-2 border-[var(--veyro-violet)] bg-[var(--veyro-bg-surface)] text-xs font-mono shadow-xl relative z-10"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[var(--veyro-violet)] font-bold">
                      <span>CORE SERVICE</span>
                      <span className="text-[var(--veyro-cyan)]">TS</span>
                    </div>
                    <div className="font-bold text-white truncate mt-0.5">src/services/auth.ts</div>
                    <div className="text-[10px] text-[var(--veyro-cyan)] mt-0.5">in: 2 • out: 2 (Hub)</div>
                  </div>

                  {/* Node 3: Service (user.ts — cyclic partner) */}
                  <div
                    ref={nodeUserRef}
                    style={{ position: 'absolute', left: '640px', top: '90px', width: '160px', height: '64px' }}
                    className="p-2.5 rounded-lg border-2 border-rose-500/80 bg-[var(--veyro-bg-surface)] text-xs font-mono shadow-xl relative z-10"
                  >
                    <div className="flex items-center justify-between text-[10px] text-rose-400 font-bold">
                      <span>CYCLE PARTNER</span>
                      <span className="text-[var(--veyro-cyan)]">TS</span>
                    </div>
                    <div className="font-bold text-white truncate mt-0.5">src/services/user.ts</div>
                    <div className="text-[10px] text-rose-300 mt-0.5">in: 2 • out: 1 (Cycle)</div>
                  </div>

                  {/* Node 4: Token Helper */}
                  <div
                    ref={nodeTokenRef}
                    style={{ position: 'absolute', left: '180px', top: '280px', width: '140px', height: '64px' }}
                    className="p-2.5 rounded-lg border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] text-xs font-mono shadow-md"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[var(--veyro-text-tertiary)]">
                      <span>AUTH HELPER</span>
                      <span className="text-[var(--veyro-cyan)]">TS</span>
                    </div>
                    <div className="font-semibold text-[var(--veyro-text-primary)] truncate mt-0.5">src/services/token.ts</div>
                    <div className="text-[10px] text-[var(--veyro-text-secondary)] mt-0.5">out: 2 • in: 1</div>
                  </div>

                  {/* Node 5: Utility Hub */}
                  <div
                    ref={nodeCryptoRef}
                    style={{ position: 'absolute', left: '440px', top: '280px', width: '140px', height: '64px' }}
                    className="p-2.5 rounded-lg border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] text-xs font-mono shadow-md"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[var(--veyro-text-tertiary)]">
                      <span>UTILITY</span>
                      <span className="text-[var(--veyro-cyan)]">TS</span>
                    </div>
                    <div className="font-semibold text-[var(--veyro-text-primary)] truncate mt-0.5">src/utils/crypto.ts</div>
                    <div className="text-[10px] text-[var(--veyro-text-secondary)] mt-0.5">out: 2 • in: 1</div>
                  </div>

                  {/* Node 6: External Manifest */}
                  <div
                    ref={nodePkgRef}
                    style={{ position: 'absolute', left: '700px', top: '280px', width: '140px', height: '64px' }}
                    className="p-2.5 rounded-lg border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] text-xs font-mono shadow-md"
                  >
                    <div className="flex items-center justify-between text-[10px] text-amber-400">
                      <span>MANIFEST</span>
                      <span>JSON</span>
                    </div>
                    <div className="font-semibold text-[var(--veyro-text-primary)] truncate mt-0.5">package.json</div>
                    <div className="text-[10px] text-[var(--veyro-text-tertiary)] mt-0.5">bcrypt: ^5.0</div>
                  </div>
                </div>

                {/* ── SCENE 4: TARJAN SCC INSPECTOR & CYCLE ALERT ── */}
                <div
                  ref={cycleAlertRef}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl border border-rose-500/50 bg-rose-950/80 backdrop-blur-md shadow-2xl flex items-center gap-3 text-xs font-mono opacity-0"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">Tarjan SCC Detected:</span>
                    <span className="text-rose-200">src/services/auth.ts ⇄ src/services/user.ts</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                    1 Cycle
                  </span>
                </div>

                <div
                  ref={inspectorPanelRef}
                  className="absolute right-6 top-14 bottom-6 w-64 rounded-xl border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)]/95 backdrop-blur-xl p-3.5 flex flex-col gap-3 z-30 shadow-2xl text-xs font-mono opacity-0"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--veyro-border)]">
                    <span className="text-[var(--veyro-text-primary)] font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> Architectural Finding
                    </span>
                    <span className="text-[10px] text-rose-400">HIGH RISK</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--veyro-bg-base)] border border-rose-500/30 flex flex-col gap-1">
                    <span className="text-[10px] text-[var(--veyro-text-tertiary)] uppercase">Circular Loop</span>
                    <span className="text-white font-semibold">auth.ts ⇄ user.ts</span>
                    <span className="text-[10px] text-[var(--veyro-text-secondary)] leading-tight pt-1">
                      Mutual import may lead to undefined evaluation at module bootstrap.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--veyro-bg-base)] border border-[var(--veyro-border)] flex flex-col gap-1">
                    <span className="text-[10px] text-[var(--veyro-text-tertiary)] uppercase">Coupling Hotspot</span>
                    <span className="text-[var(--veyro-cyan)] font-semibold">src/services/auth.ts</span>
                    <span className="text-[10px] text-[var(--veyro-text-secondary)]">In-Degree: 2 • Out-Degree: 2</span>
                  </div>

                  <div className="mt-auto pt-2 border-t border-[var(--veyro-border)] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--veyro-text-tertiary)]">Coverage:</span>
                    <span className="text-emerald-400 font-bold">{SAMPLE_SHOWCASE_METRICS.coveragePercentage}% (5/6 files)</span>
                  </div>
                </div>

                {/* ── SCENE 5: COMPLETE WORKSPACE LAUNCH CTA DOCK ── */}
                <div
                  ref={ctaDockRef}
                  className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 px-6 py-3.5 rounded-2xl border border-[var(--veyro-cyan)]/40 bg-[var(--veyro-bg-base)]/95 backdrop-blur-2xl shadow-[0_12px_48px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left opacity-0"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-mono font-bold text-white">Full Workspace Ready</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--veyro-cyan)]/15 text-[var(--veyro-cyan)]">
                        Sample Ingested
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--veyro-text-secondary)] mt-0.5">
                      Browse full 2D interactive DAG, CodeMirror 6, and findings.
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href="/explorer?sample=true"
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--veyro-violet)] to-[var(--veyro-cyan)] text-black font-semibold text-xs flex items-center gap-2 hover:opacity-95 transition-transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                    >
                      <span>Launch Sample Explorer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Narration Bar (Synchronized with Timeline Progress) */}
            <div className="h-11 px-4 sm:px-5 bg-[var(--veyro-bg-base)] border-t border-[var(--veyro-border)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-xs font-mono font-bold text-[var(--veyro-cyan)] shrink-0">
                  {currentBeat.act}
                </span>
                <span className="text-xs font-mono text-[var(--veyro-text-primary)] font-medium truncate">
                  {currentBeat.subtitle}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="text-[10px] font-mono text-[var(--veyro-text-tertiary)] hidden sm:inline">
                  Scroll to scrub sequence
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => scrollToBeat(Math.max(0, activeBeatIndex - 1))}
                    disabled={activeBeatIndex === 0}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--veyro-bg-surface)] border border-[var(--veyro-border)] text-[11px] font-mono text-[var(--veyro-text-secondary)] hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prev Act</span>
                  </button>
                  <button
                    onClick={() => scrollToBeat(Math.min(SHOWCASE_BEATS.length - 1, activeBeatIndex + 1))}
                    disabled={activeBeatIndex === SHOWCASE_BEATS.length - 1}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--veyro-bg-surface)] border border-[var(--veyro-border)] text-[11px] font-mono text-[var(--veyro-text-secondary)] hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <span className="hidden sm:inline">Next Act</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
