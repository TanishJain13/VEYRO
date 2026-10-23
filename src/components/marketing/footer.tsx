'use client';

import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--veyro-border)] bg-[var(--veyro-bg-base)] text-xs text-[var(--veyro-text-tertiary)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Mission */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[var(--veyro-violet)] to-[var(--veyro-cyan)] p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[var(--veyro-bg-base)] rounded-[5px] flex items-center justify-center">
                <Compass className="w-3.5 h-3.5 text-[var(--veyro-cyan)]" />
              </div>
            </div>
            <span className="font-mono text-sm font-bold tracking-wider text-[var(--veyro-text-primary)]">
              VEYRO
            </span>
          </Link>
          <span className="hidden sm:inline text-[var(--veyro-border)]">•</span>
          <span>Visual codebase intelligence & dependency mapping</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link href="/explorer" className="hover:text-[var(--veyro-text-primary)] transition-colors">
            Explorer
          </Link>
          <Link href="/explorer?sample=true" className="hover:text-[var(--veyro-text-primary)] transition-colors">
            Sample Repository
          </Link>
          <a
            href="https://github.com/TanishJain13/VEYRO"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--veyro-text-primary)] transition-colors"
          >
            GitHub
          </a>
          <a
            href="#limitations"
            className="hover:text-[var(--veyro-text-primary)] transition-colors"
          >
            Platform Limits
          </a>
        </div>

        {/* Right copyright */}
        <div className="font-mono text-[11px] text-[var(--veyro-text-tertiary)] flex items-center gap-1.5">
          <span>Engineered with Next.js 16 & Tanish Jain </span>
        </div>
      </div>
    </footer>
  );
}
