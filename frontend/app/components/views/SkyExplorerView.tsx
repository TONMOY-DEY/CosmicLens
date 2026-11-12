'use client';

import React, { useState } from 'react';
import { Region, PageId } from '../../lib/types';
import CelestialSkyCanvas from '../CelestialSkyCanvas';
import TimeMachineBar from '../TimeMachineBar';
import {
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Eye,
  GitCompare,
  Award,
  Sparkles,
  Info,
  Clock,
  Crosshair,
} from 'lucide-react';

interface SkyExplorerViewProps {
  activeRegion: Region;
  selectedEpoch: number;
  setSelectedEpoch: (epoch: number) => void;
  selectedObjectId: string;
  setSelectedObjectId: (id: string) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  onNavigate: (page: PageId) => void;
}

export default function SkyExplorerView({
  activeRegion,
  selectedEpoch,
  setSelectedEpoch,
  selectedObjectId,
  setSelectedObjectId,
  playing,
  setPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  onNavigate,
}: SkyExplorerViewProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [showFootprint, setShowFootprint] = useState<boolean>(true);

  const activeEpochData = activeRegion.epochs[selectedEpoch] || activeRegion.epochs[0];
  const selectedSource = activeEpochData?.sources.find((s) => s.id === selectedObjectId) ||
    activeRegion.epochs[0]?.sources.find((s) => s.id === selectedObjectId);

  // Compute total displacement for selected source across available epochs
  const allCoords = activeRegion.epochs.map((ep) => ep.sources.find((s) => s.id === selectedObjectId)).filter(Boolean);
  let totalDisplacementArcsec = 0;
  if (allCoords.length >= 2) {
    const first = allCoords[0]!;
    const last = allCoords[allCoords.length - 1]!;
    const dRa = (last.ra - first.ra) * Math.cos((((first.dec + last.dec) / 2) * Math.PI) / 180);
    const dDec = last.dec - first.dec;
    totalDisplacementArcsec = Math.sqrt(dRa * dRa + dDec * dDec) * 3600.0;
  }

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Header & Interactive Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-space-600/60 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-cyan-electric/15 text-cyan-electric text-xs font-semibold uppercase tracking-wider font-mono-sci mb-1 border border-cyan-electric/30">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Sky Exploration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-3">
            <span>{activeRegion.name}</span>
            <span className="text-xs font-mono-sci text-cyan-electric px-2 py-0.5 rounded bg-space-800 border border-space-600">
              FOV {activeRegion.fov_arcmin || 30.0}&apos;
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Center (J2000): RA {activeRegion.ra_center?.toFixed(4)}° • Dec {activeRegion.dec_center?.toFixed(4)}° • {activeRegion.epochs.length} Observation Epochs
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowFootprint(!showFootprint)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-sci border transition-all ${
              showFootprint
                ? 'bg-cyan-electric/20 text-cyan-electric border-cyan-electric/40'
                : 'bg-space-800/80 text-slate-400 border-space-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Footprint Boundary</span>
          </button>
        </div>
      </div>

      {/* Main Sky Exploration Workspace: Canvas (8 cols) + Side Inspection Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sky Canvas Column */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-cyan-electric/30 bg-space-950 shadow-2xl h-[520px]">
            <CelestialSkyCanvas
              region={activeRegion}
              selectedEpoch={selectedEpoch}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
            />

            {/* Canvas HUD Legend */}
            <div className="absolute top-3 left-3 px-3 py-2 rounded-lg bg-space-950/80 backdrop-blur-md border border-space-600/60 text-[11px] font-mono-sci text-slate-300 space-y-1 pointer-events-none">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-electric" />
                <span>Stationary IR Stars</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Moving Astrometric Candidates</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-cosmic" />
                <span>Photometric Variables</span>
              </div>
            </div>

            {/* Selected Epoch Indicator in Canvas */}
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-space-950/80 backdrop-blur-md border border-cyan-electric/40 text-xs font-mono-sci text-cyan-electric flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{activeEpochData?.timestamp?.slice(0, 10)}</span>
              <span className="text-[10px] text-slate-400">({activeEpochData?.wavelength} µm)</span>
            </div>
          </div>

          {/* Signature Sky Time Machine Bar */}
          <div className="glass-panel p-3.5 rounded-xl border border-space-600/60">
            <TimeMachineBar
              epochs={activeRegion.epochs}
              selectedEpoch={selectedEpoch}
              onSelectEpoch={setSelectedEpoch}
              playing={playing}
              onTogglePlay={() => setPlaying(!playing)}
              playbackSpeed={playbackSpeed}
              onChangeSpeed={setPlaybackSpeed}
            />
          </div>
        </div>

        {/* Selected Candidate Side Panel */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-cyan-electric/30 space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-space-600/50 pb-3">
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4 text-cyan-electric" />
                <h3 className="text-sm font-bold text-white tracking-wide">Target Dossier</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono-sci font-bold bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/30">
                {selectedSource?.id || 'DEMO-001'}
              </span>
            </div>

            {/* Target Scientific Properties */}
            <div className="space-y-3 font-mono-sci text-xs">
              <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40 space-y-2">
                <div className="text-[10px] uppercase text-slate-400 tracking-wider">
                  Celestial Astrometry (J2000)
                </div>
                <div className="flex justify-between text-slate-200">
                  <span className="text-slate-400">Right Ascension:</span>
                  <span className="font-semibold text-white">
                    {selectedSource?.ra.toFixed(6)}°
                  </span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span className="text-slate-400">Declination:</span>
                  <span className="font-semibold text-white">
                    {selectedSource?.dec.toFixed(6)}°
                  </span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span className="text-slate-400">Pos. Uncertainty:</span>
                  <span className="text-cyan-electric">
                    ±{selectedSource?.position_uncertainty_arcsec || 0.25}&quot;
                  </span>
                </div>
                <div className="flex justify-between text-slate-200 border-t border-space-600/30 pt-1.5 mt-1.5">
                  <span className="text-slate-400">Total Motion:</span>
                  <span className="font-bold text-amber-400">
                    {totalDisplacementArcsec.toFixed(3)}&quot;
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-space-950/70 border border-space-600/40 space-y-2">
                <div className="text-[10px] uppercase text-slate-400 tracking-wider">
                  Photometry & Instrument Flags
                </div>
                <div className="flex justify-between text-slate-200">
                  <span className="text-slate-400">Flux Density:</span>
                  <span className="font-semibold text-white">
                    {selectedSource?.flux.toFixed(1)} µJy
                  </span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span className="text-slate-400">Flux Uncertainty:</span>
                  <span className="text-slate-300">
                    ±{selectedSource?.flux_err.toFixed(1)} µJy
                  </span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span className="text-slate-400">PSF Profile FWHM:</span>
                  <span className="text-slate-300">
                    {selectedSource?.psf_fwhm.toFixed(2)}&quot;
                  </span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span className="text-slate-400">Quality Flag:</span>
                  <span
                    className={`font-bold ${
                      selectedSource?.flag === 'good' ? 'text-emerald-soft' : 'text-amber-400'
                    }`}
                  >
                    {selectedSource?.flag || 'good'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => onNavigate('change_analysis')}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-violet-cosmic/20 hover:bg-violet-cosmic/30 text-violet-cosmic hover:text-white border border-violet-cosmic/40 text-xs font-semibold tracking-wide transition-all shadow-violet-glow"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare Epochs in Change Analysis</span>
              </button>

              <button
                onClick={() => onNavigate('discovery_passport')}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-cyan-electric/20 hover:bg-cyan-electric/30 text-cyan-electric hover:text-white border border-cyan-electric/40 text-xs font-semibold tracking-wide transition-all shadow-cyan-glow"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Open Discovery Passport Dossier</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
