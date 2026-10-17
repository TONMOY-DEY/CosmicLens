'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Region, SourceObservation } from '../lib/types';

interface CelestialSkyCanvasProps {
  region: Region;
  selectedEpoch: number;
  selectedObjectId: string;
  onSelectObject: (objectId: string) => void;
}

export default function CelestialSkyCanvas({
  region,
  selectedEpoch,
  selectedObjectId,
  onSelectObject,
}: CelestialSkyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSource, setHoveredSource] = useState<SourceObservation | null>(null);

  const activeEpoch = region.epochs[selectedEpoch] || region.epochs[0];

  // Reset pan and zoom when region changes
  useEffect(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, [region.id]);

  // Coordinate transformation: RA/Dec to Canvas %
  const fovDeg = (region.fov_arcmin || 30.0) / 60.0;
  const halfFov = fovDeg / 2.0;

  const toCanvasCoords = (ra: number, dec: number) => {
    // RA increases to the left in celestial charts (East is left)
    const dRa = (ra - region.ra_center) * Math.cos((region.dec_center * Math.PI) / 180);
    const dDec = dec - region.dec_center;

    // Map [-halfFov, +halfFov] to [0, 100] %
    const xPct = 50 - (dRa / halfFov) * 45;
    const yPct = 50 - (dDec / halfFov) * 45;

    return { x: xPct, y: yPct };
  };

  // Trajectory history for selected object
  const trajectoryPoints = region.epochs.map((ep, idx) => {
    const src = ep.sources.find((s) => s.id === selectedObjectId);
    if (!src) return null;
    const coords = toCanvasCoords(src.ra, src.dec);
    return { ...coords, epochIdx: idx, ra: src.ra, dec: src.dec };
  }).filter(Boolean);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(3.5, Math.max(0.6, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#020b14] select-none shadow-2xl group">
      {/* Background Deep-Space Starfield Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.15) 0%, transparent 70%),
            linear-gradient(to right, rgba(56, 189, 248, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />

      {/* Canvas Viewport (Supports Pan & Zoom) */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        {/* Field of View (FOV) Astronomical Reticle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] rounded-full border border-cyan-500/20 pointer-events-none">
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/15" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/15" />
          <span className="absolute top-2 right-4 text-[10px] tracking-widest text-cyan-400/50 uppercase font-mono">
            FOV: {region.fov_arcmin} arcmin
          </span>
        </div>

        {/* Trajectory Path Line for Selected Object across Epochs */}
        {trajectoryPoints.length > 1 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <polyline
              points={trajectoryPoints.map((p) => `${p!.x}%,${p!.y}%`).join(' ')}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 3"
              className="opacity-75"
            />
            {trajectoryPoints.map((p, idx) => (
              <circle
                key={idx}
                cx={`${p!.x}%`}
                cy={`${p!.y}%`}
                r={idx === selectedEpoch ? '5' : '3'}
                fill={idx === selectedEpoch ? '#f59e0b' : '#38bdf8'}
                stroke="#fff"
                strokeWidth="1"
              />
            ))}
          </svg>
        )}

        {/* Celestial Sources Rendered as Glowing Astronomical Objects */}
        {activeEpoch.sources.map((src) => {
          const { x, y } = toCanvasCoords(src.ra, src.dec);
          const isSelected = src.id === selectedObjectId;

          // Object classification visual cues
          const isNeo = src.type?.includes('asteroid') || src.id.includes('RW-001') || src.id.includes('NEO');
          const isVar = src.type?.includes('variable') || src.id.includes('MIRA') || src.id.includes('RW-002');
          const isTransient = src.type?.includes('transient') || src.id.includes('SN');
          const isIce = src.type?.includes('ice') || src.id.includes('ICE');
          const isArtifact = src.type?.includes('artifact') || src.id.includes('ART') || src.psf_fwhm < 1.0;

          // Star brightness radius scaled by flux
          const baseRadius = Math.max(6, Math.min(18, Math.sqrt(src.flux) * 1.8));

          let haloColor = 'rgba(56, 189, 248, 0.4)';
          let coreColor = '#bae6fd';
          if (isNeo) {
            haloColor = 'rgba(59, 130, 246, 0.7)';
            coreColor = '#60a5fa';
          } else if (isVar) {
            haloColor = 'rgba(245, 158, 11, 0.8)';
            coreColor = '#fcd34d';
          } else if (isTransient) {
            haloColor = 'rgba(236, 72, 153, 0.8)';
            coreColor = '#f472b6';
          } else if (isIce) {
            haloColor = 'rgba(20, 184, 166, 0.8)';
            coreColor = '#5eead4';
          } else if (isArtifact) {
            haloColor = 'rgba(239, 68, 68, 0.8)';
            coreColor = '#f87171';
          }

          return (
            <div
              key={src.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-10"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectObject(src.id);
              }}
              onMouseEnter={() => setHoveredSource(src)}
              onMouseLeave={() => setHoveredSource(null)}
            >
              {/* Outer Diffraction Glow */}
              <div
                className="rounded-full animate-pulse"
                style={{
                  width: `${baseRadius * 2.4}px`,
                  height: `${baseRadius * 2.4}px`,
                  backgroundColor: haloColor,
                  filter: 'blur(3px)',
                }}
              />

              {/* Star Core */}
              <div
                className="absolute inset-0 m-auto rounded-full shadow-lg"
                style={{
                  width: `${baseRadius}px`,
                  height: `${baseRadius}px`,
                  backgroundColor: coreColor,
                  boxShadow: `0 0 12px ${coreColor}`,
                }}
              />

              {/* Selection Target Ring */}
              {isSelected && (
                <div className="absolute -inset-2.5 rounded-full border-2 border-amber-400 animate-spin border-dashed pointer-events-none" />
              )}

              {/* Identification Label Tag */}
              <div
                className={`absolute left-full top-1/2 -translate-y-1/2 ml-2 px-1.5 py-0.5 rounded text-[11px] font-mono whitespace-nowrap pointer-events-none transition-opacity ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 opacity-100 font-bold'
                    : 'bg-black/60 text-cyan-200/80 border border-cyan-500/20 opacity-0 group-hover:opacity-75'
                }`}
              >
                {src.id}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top HUD Telemetry Overlay */}
      <div className="absolute top-3 left-4 flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/20 text-xs font-mono text-cyan-300 pointer-events-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span>RA: {region.ra_center.toFixed(2)}°</span>
        <span>DEC: {region.dec_center.toFixed(2)}°</span>
        <span className="text-cyan-400/60">|</span>
        <span>BAND: {activeEpoch.wavelength} μm</span>
        <span className="text-cyan-400/60">|</span>
        <span>EPOCH: T{selectedEpoch + 1}/{region.epochs.length}</span>
      </div>

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Reset) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-cyan-500/20 z-20">
        <button
          onClick={() => setZoom((z) => Math.min(3.5, z * 1.2))}
          className="w-7 h-7 rounded flex items-center justify-center text-cyan-300 hover:bg-cyan-500/20 text-sm font-bold"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z * 0.8))}
          className="w-7 h-7 rounded flex items-center justify-center text-cyan-300 hover:bg-cyan-500/20 text-sm font-bold"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="px-2 h-7 rounded flex items-center justify-center text-cyan-300 hover:bg-cyan-500/20 text-xs font-mono"
          title="Reset View"
        >
          RESET
        </button>
      </div>

      {/* Hover Info Tooltip Bar */}
      {hoveredSource && (
        <div className="absolute bottom-3 left-4 right-4 bg-black/85 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/30 flex items-center justify-between text-xs font-mono text-cyan-200 z-20 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold text-sm">{hoveredSource.id}</span>
            <span>RA: {hoveredSource.ra.toFixed(5)}°</span>
            <span>DEC: {hoveredSource.dec.toFixed(5)}°</span>
            <span>FLUX: {hoveredSource.flux.toFixed(1)} μJy</span>
            <span>PSF FWHM: {hoveredSource.psf_fwhm.toFixed(2)}&quot;</span>
          </div>
          <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
            {hoveredSource.type || 'Source'}
          </span>
        </div>
      )}
    </div>
  );
}
