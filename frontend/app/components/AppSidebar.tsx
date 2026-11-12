'use client';

import React from 'react';
import { PageId } from '../lib/types';
import {
  LayoutDashboard,
  Database,
  Compass,
  Table as TableIcon,
  GitCompare,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Network,
  Award,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';

interface AppSidebarProps {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  candidateCount?: number;
  anomalyCount?: number;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  category?: string;
}

export default function AppSidebar({
  activePage,
  setActivePage,
  collapsed,
  setCollapsed,
  candidateCount = 0,
  anomalyCount = 0,
}: AppSidebarProps) {
  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'data_center', label: 'Data Center', icon: Database, badge: 'FITS' },
    { id: 'sky_explorer', label: 'Sky Explorer', icon: Compass },
    { id: 'object_catalog', label: 'Object Catalog', icon: TableIcon },
    { id: 'change_analysis', label: 'Change Analysis', icon: GitCompare, badge: 'Epochs' },
    { id: 'anomaly_detection', label: 'Anomaly Detection', icon: AlertTriangle, badge: anomalyCount > 0 ? anomalyCount : undefined, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { id: 'candidate_explorer', label: 'Candidate Explorer', icon: Sparkles, badge: candidateCount > 0 ? candidateCount : undefined, badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { id: 'validation_center', label: 'Validation Center', icon: ShieldCheck },
    { id: 'evidence_explorer', label: 'Evidence Explorer', icon: Network },
    { id: 'discovery_passport', label: 'Discovery Passport', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen border-r border-space-600/60 bg-space-900/90 backdrop-blur-xl transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-space-600/50">
        {!collapsed ? (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-electric/25 to-violet-cosmic/30 border border-cyan-electric/40 shadow-cyan-glow">
              <Radio className="w-5 h-5 text-cyan-electric animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-electric ring-2 ring-space-900" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm tracking-widest text-white">SKYTRACE</span>
                <span className="text-xs font-semibold px-1 py-0.2 rounded bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/30">
                  AI
                </span>
              </div>
              <span className="text-[10px] tracking-wider text-slate-400 uppercase font-mono-sci">
                NASA SPHEREx Engine
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-electric/25 to-violet-cosmic/30 border border-cyan-electric/40 shadow-cyan-glow">
              <Radio className="w-5 h-5 text-cyan-electric animate-pulse" />
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-md hover:bg-space-700/60 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-space-500/40 ${
            collapsed ? 'hidden' : 'block'
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full group relative flex items-center rounded-lg transition-all duration-200 text-left ${
                collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-electric/15 to-violet-cosmic/15 text-white border border-cyan-electric/40 shadow-cyan-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-space-800/70 border border-transparent hover:border-space-600/40'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {/* Active vertical marker */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-cyan-electric shadow-[0_0_8px_#36D9FF]" />
              )}

              <div
                className={`flex items-center justify-center transition-colors ${
                  isActive ? 'text-cyan-electric' : 'text-slate-400 group-hover:text-cyan-electric/80'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
              </div>

              {!collapsed && (
                <div className="ml-3 flex-1 flex items-center justify-between overflow-hidden">
                  <span
                    className={`text-xs font-medium tracking-wide truncate ${
                      isActive ? 'text-white font-semibold' : 'text-slate-300'
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.badge !== undefined && (
                    <span
                      className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-mono-sci border ${
                        item.badgeColor ||
                        (isActive
                          ? 'bg-cyan-electric/25 text-cyan-electric border-cyan-electric/40'
                          : 'bg-space-700/60 text-slate-400 border-space-600/60')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle for Collapsed View */}
      {collapsed && (
        <div className="p-2 border-t border-space-600/50 flex justify-center">
          <button
            onClick={() => setCollapsed(false)}
            className="p-2 rounded-lg bg-space-800/60 text-slate-400 hover:text-cyan-electric border border-space-600/40 hover:border-cyan-electric/40 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer System Status */}
      {!collapsed && (
        <div className="p-3 border-t border-space-600/50 bg-space-950/40">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-sci">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-soft animate-ping" />
              <span className="text-slate-300">SPHEREx PASS</span>
            </span>
            <span className="text-cyan-electric/80">v1.0-RC</span>
          </div>
        </div>
      )}
    </aside>
  );
}
