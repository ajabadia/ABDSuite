/**
 * @purpose Renders a customizable action card component for the admin dashboard, displaying an icon, category, title, description, footer metadata, and a button to navigate elsewhere.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1xae5t2
 * @lastUpdated 2026-06-23T21:44:45.215Z
 */

import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardActionCardProps {
  icon: LucideIcon;
  category: string;
  title: string;
  description: string;
  footerLabel: string;
  footerValue: string;
  buttonText: string;
  href: string;
}

export function DashboardActionCard({
  icon: Icon,
  category,
  title,
  description,
  footerLabel,
  footerValue,
  buttonText,
  href,
}: DashboardActionCardProps) {
  return (
    <div className="group relative p-8 flex flex-col justify-between min-h-[300px] overflow-hidden rounded-none bg-card backdrop-blur-sm border border-border transition-all duration-500 hover:border-primary/40">
      {/* Decorative Watermark */}
      <Icon className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none text-foreground" size={96} aria-hidden="true" />
      
      <div className="z-10">
        {/* Mono Category Tag */}
        <span className="inline-block font-mono text-[9px] uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-1 mb-4">
          {category}
        </span>
        
        {/* Narrative Title Block */}
        <h2 className="text-2xl font-bold mb-3 uppercase tracking-tight text-foreground leading-none">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {description}
        </p>

        {/* Metadata Tray */}
        <div className="border-t border-border pt-4 mb-6 flex items-center justify-between gap-4 text-[9px] font-mono uppercase text-muted-foreground/50">
          <span>{footerLabel}</span>
          <span className="text-primary font-bold">{footerValue}</span>
        </div>
      </div>

      {/* Tactical Action Area */}
      <Link 
        href={href}
        className="w-full h-14 z-10 flex items-center justify-center gap-2 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98]"
      >
        {buttonText}
        <ArrowRight className="w-4 h-4 ml-2 animate-pulse" aria-hidden="true" />
      </Link>
    </div>
  );
}
