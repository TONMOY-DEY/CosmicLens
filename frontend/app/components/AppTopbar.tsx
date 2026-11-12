'use client';

import React, { useState } from 'react';
import { Region } from '../lib/types';
import {
  Search,
  Bell,
  Cpu,
  Globe,
  SlidersHorizontal,
  Upload,
  User,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface AppTopbarProps {
  surveys: Record<string, Region>;
  activeRegionId: string;
  setActiveRegionId: (id: string) => void;
  isBackendOnline: boolean;
  onSearch: (query: string) => void;
  onOpenDataCenter: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function AppTopbar({
  surveys,
  activeRegionId,
  setActiveRegionId,
  isBackendOnline,
  onSearch,
  onOpenDataCenter,
  searchQuery,
  setSearchQuery,
}: AppTopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  const activeRegion = surveys[activeRegionId] || Object.values(surveys)[0];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchQuery);
    }
  };

  const notifications = [
    {
      id: 1,
      title: 'Astrometric Anomaly Confirmed',
      target: 'DEMO-001',
      time: '3 min ago',
      type: 'success',
      desc: '12.4 arcsec proper motion verified across 4 epochs with 95% SNR.',
    },
    {
      id: 2,
      title: 'Water Ice Absorption Detected',
      target: 'DEMO-004',
      time: '18 min ago',
      type: 'info',
      desc: '3.05 µm absorption trough matches volatile-rich comet profile.',
    },
    {
      id: 3,
      title: 'Sub-Diffraction PSF Alert',
      target: 'DEMO-ART-99',
      time: '42 min ago',
      type: 'warning',
      desc: 'FWHM < 1.0 arcsec flagged as instrumental artifact (CAUTION).',
    },
  ];

  return (
    <header className="h-16 border-b border-space-600/60 bg-space-900/80 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Survey Workspace Selector */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <button
            onClick={() => setShowRegionDropdown(!showRegionDropdown)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-space-800/80 hover:bg-space-700/80 border border-space-600/60 hover:border-cyan-electric/40 text-left transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-electric animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-mono-sci leading-tight">
                Active Survey Field
              </span>
              <span className="text-xs font-semibold text-white tracking-wide flex items-center space-x-1">
                <span className="truncate max-w-[180px]">{activeRegion?.name || 'Survey Field'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </span>
            </div>
          </button>

          {/* Region Dropdown */}
          {showRegionDropdown && (
            <div className="absolute left-0 top-full mt-1.5 w-72 rounded-xl glass-panel-elevated p-2 shadow-2xl z-50 animate-fadeIn">
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-mono-sci border-b border-space-600/50 mb-1">
                Select Celestial Survey
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {Object.values(surveys).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveRegionId(r.id);
                      setShowRegionDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      r.id === activeRegionId
                        ? 'bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/40'
                        : 'hover:bg-space-700/60 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white">{r.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono-sci">
                        RA: {r.ra_center?.toFixed(2)}° • Dec: {r.dec_center?.toFixed(2)}°
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-space-800 font-mono-sci text-cyan-electric border border-space-600">
                      {r.epochs?.length || 4} ep
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Provenance Badge */}
        <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-mono-sci">
          <Globe className="w-3 h-3 text-amber-400" />
          <span>NASA SPHEREx 0.75-5.0µm</span>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search candidate (e.g. DEMO-001, RA/Dec, Asteroid)..."
            className="w-full pl-9 pr-16 py-1.5 bg-space-950/70 text-slate-200 placeholder-slate-500 text-xs rounded-lg border border-space-600/60 focus:border-cyan-electric/70 focus:outline-none focus:ring-1 focus:ring-cyan-electric/50 transition-all font-mono-sci"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-space-800/80 text-slate-400 px-1.5 py-0.5 rounded border border-space-600/60 font-mono-sci">
            ↵ Enter
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Connection, Notifications, Profile */}
      <div className="flex items-center space-x-3">
        {/* Quick Upload Button */}
        <button
          onClick={onOpenDataCenter}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-electric/15 hover:bg-cyan-electric/25 border border-cyan-electric/40 text-cyan-electric text-xs font-semibold tracking-wide transition-all shadow-cyan-glow"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Data</span>
        </button>

        {/* Connection Status Pill */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-sci border ${
            isBackendOnline
              ? 'bg-emerald-soft/10 text-emerald-300 border-emerald-soft/30'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}
          title={isBackendOnline ? 'FastAPI Python Engine Connected' : 'Offline / Client Engine Fallback'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendOnline ? 'bg-emerald-soft animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="hidden sm:inline">
            {isBackendOnline ? 'API LIVE' : 'CLIENT MODE'}
          </span>
        </div>

        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-space-800/60 hover:bg-space-700/60 text-slate-300 hover:text-white border border-space-600/60 transition-colors relative"
            title="Activity Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-electric ring-2 ring-space-900" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl glass-panel-elevated p-3 shadow-2xl z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-space-600/50">
                <span className="text-xs font-bold text-white tracking-wide">Analysis Activity</span>
                <span className="text-[10px] text-cyan-electric font-mono-sci">Real-Time Feed</span>
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2 rounded-lg bg-space-800/50 border border-space-600/40 text-xs space-y-1 hover:border-space-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center space-x-1">
                        {n.type === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-soft" />}
                        {n.type === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {n.type === 'info' && <Layers className="w-3 h-3 text-cyan-electric" />}
                        <span>{n.target}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-sci">{n.time}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-200">{n.title}</div>
                    <div className="text-[10px] text-slate-400">{n.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center space-x-2 pl-2 border-l border-space-600/50">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-cosmic/30 to-cyan-electric/30 border border-violet-cosmic/40 flex items-center justify-center text-slate-200">
            <User className="w-4 h-4 text-cyan-electric" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200">Science Investigator</span>
            <span className="text-[9px] text-slate-400 font-mono-sci">NASA/IPAC Session</span>
          </div>
        </div>
      </div>
    </header>
  );
}
