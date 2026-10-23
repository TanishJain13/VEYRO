import React from 'react';
import { MarketingNavbar } from '@/components/marketing/navbar';
import { MarketingHero } from '@/components/marketing/hero';
import { ScrollShowcase } from '@/components/marketing/scroll-showcase';
import { MarketingFeatures } from '@/components/marketing/features';
import { MarketingArchitecture } from '@/components/marketing/architecture';
import { MarketingLimitations } from '@/components/marketing/limitations';
import { MarketingFooter } from '@/components/marketing/footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--veyro-bg-base)] text-[var(--veyro-text-primary)] flex flex-col font-sans selection:bg-[var(--veyro-violet)]/30 selection:text-[var(--veyro-cyan)]">
      <MarketingNavbar />
      <main className="flex-1">
        <MarketingHero />
        <ScrollShowcase />
        <MarketingFeatures />
        <MarketingArchitecture />
        <MarketingLimitations />
      </main>
      <MarketingFooter />
    </div>
  );
}
