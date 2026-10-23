'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Compass, Menu, X, ArrowRight } from 'lucide-react';

export function MarketingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--veyro-border)] bg-[var(--veyro-bg-base)]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--veyro-violet)] to-[var(--veyro-cyan)] p-[1px] flex items-center justify-center shadow-lg shadow-[var(--veyro-violet)]/10">
            <div className="w-full h-full bg-[var(--veyro-bg-base)] rounded-[7px] flex items-center justify-center">
              <Compass className="w-4 h-4 text-[var(--veyro-cyan)] group-hover:rotate-45 transition-transform duration-300" />
            </div>
          </div>
          <span className="font-mono text-base font-bold tracking-wider text-[var(--veyro-text-primary)]">
            VEYRO
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--veyro-violet)]/15 text-[var(--veyro-violet)] border border-[var(--veyro-violet)]/30 font-semibold">
            v0.4
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[var(--veyro-text-secondary)]">
          <a href="#showcase" className="hover:text-[var(--veyro-text-primary)] transition-colors">
            Showcase
          </a>
          <a href="#features" className="hover:text-[var(--veyro-text-primary)] transition-colors">
            Features
          </a>
          <a href="#architecture" className="hover:text-[var(--veyro-text-primary)] transition-colors">
            Architecture
          </a>
          <a href="#limitations" className="hover:text-[var(--veyro-text-primary)] transition-colors">
            Support & Limits
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[var(--veyro-text-secondary)] hover:text-[var(--veyro-text-primary)] hover:bg-[var(--veyro-bg-surface)] rounded-md border border-transparent hover:border-[var(--veyro-border)] transition-colors"
            aria-label="GitHub Repository"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <Link
            href="/explorer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--veyro-violet)] hover:bg-[var(--veyro-violet)]/90 text-white shadow-md shadow-[var(--veyro-violet)]/20 transition-all hover:scale-[1.02]"
          >
            <span>Launch Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[var(--veyro-text-secondary)] hover:text-[var(--veyro-text-primary)]"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-2 text-sm text-[var(--veyro-text-secondary)]">
            <a
              href="#showcase"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[var(--veyro-text-primary)]"
            >
              Showcase
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[var(--veyro-text-primary)]"
            >
              Features
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[var(--veyro-text-primary)]"
            >
              Architecture
            </a>
            <a
              href="#limitations"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[var(--veyro-text-primary)]"
            >
              Support & Limits
            </a>
          </nav>
          <div className="pt-2 border-t border-[var(--veyro-border)] flex flex-col gap-2">
            <Link
              href="/explorer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium bg-[var(--veyro-violet)] text-white"
            >
              <span>Launch Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
