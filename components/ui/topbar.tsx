'use client';

import React, { useState } from 'react';
import { ChevronRight, Bell, User, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { logoutAction } from '@/app/actions';

interface TopBarProps {
  breadcrumbs: string[];
  userName: string;
}

export const TopBar = ({ breadcrumbs, userName }: TopBarProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-8 bg-brand-surface border-b border-brand-surface-border relative z-40">
      <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 truncate mr-4">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <span className={idx === breadcrumbs.length - 1 ? "font-semibold text-foreground truncate" : "truncate"}>
              {crumb}
            </span>
            {idx < breadcrumbs.length - 1 && <ChevronRight size={14} className="shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-3 md:gap-6 shrink-0">
        <ThemeToggle />
        
        <button className="relative text-slate-400 hover:text-foreground transition-colors hidden md:block">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-brand-accent rounded-full border-2 border-brand-surface" />
        </button>
        
        <div className="flex items-center gap-3 md:pl-6 md:border-l border-brand-surface-border relative">
          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-slate-400">Usuario</p>
          </div>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-9 h-9 bg-background border border-brand-surface-border rounded-full flex items-center justify-center text-slate-500 hover:text-foreground hover:border-brand-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <User size={18} />
          </button>
          
          {/* Mobile Dropdown */}
          {showDropdown && (
            <>
              {/* Overlay for closing dropdown when clicking outside */}
              <div 
                className="fixed inset-0 z-40 md:hidden" 
                onClick={() => setShowDropdown(false)}
              />
              
              <div className="absolute right-0 top-full mt-2 w-48 bg-brand-surface border border-brand-surface-border rounded-xl shadow-xl overflow-hidden z-50 md:hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-brand-surface-border">
                  <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                </div>
                <button 
                  onClick={async () => await logoutAction()}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:text-brand-secondary hover:bg-background transition-colors text-left"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
