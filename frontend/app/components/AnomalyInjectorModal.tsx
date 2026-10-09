'use client';

import React, { useState } from 'react';

interface AnomalyInjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (data: {
    objectId: string;
    anomalyType: string;
    raShiftArcsec: number;
    decShiftArcsec: number;
    baseFlux: number;
    flareMultiplier: number;
    isArtifact: boolean;
  }) => void;
}

export default function AnomalyInjectorModal({
  isOpen,
  onClose,
  onInject,
}: AnomalyInjectorModalProps) {
  const [objectId, setObjectId] = useState('CUSTOM-TARGET-01');
  const [anomalyType, setAnomalyType] = useState<'moving_asteroid' | 'infrared_transient' | 'variable_star' | 'cosmic_ray'>('moving_asteroid');
  const [raShiftArcsec, setRaShiftArcsec] = useState(25.0);
  const [decShiftArcsec, setDecShiftArcsec] = useState(-18.0);
  const [baseFlux, setBaseFlux] = useState(55.0);
  const [flareMultiplier, setFlareMultiplier] = useState(4.5);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInject({
      objectId,
      anomalyType,
      raShiftArcsec: anomalyType === 'moving_asteroid' ? raShiftArcsec : 0.0,
      decShiftArcsec: anomalyType === 'moving_asteroid' ? decShiftArcsec : 0.0,
      baseFlux,
      flareMultiplier: anomalyType === 'infrared_transient' ? flareMultiplier : 1.0,
      isArtifact: anomalyType === 'cosmic_ray',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#030d17] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-cyan-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
                Simulation Studio
              </span>
            </div>
            <h2 className="text-xl font-bold font-mono text-cyan-100 mt-1">
              Inject Synthetic Astrophysical Anomaly
            </h2>
            <p className="text-xs font-mono text-cyan-400/70">
              Benchmark the AI detection and classification pipeline against controlled phenomena.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs font-mono">
          <div className="flex flex-col gap-1.5">
            <label className="text-cyan-300 font-bold">Candidate Identifier</label>
            <input
              type="text"
              value={objectId}
              onChange={(e) => setObjectId(e.target.value)}
              className="bg-black/40 border border-cyan-500/30 rounded-xl px-3 py-2 text-cyan-100 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-cyan-300 font-bold">Phenomenon Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'moving_asteroid', label: 'Near-Earth Asteroid' },
                { key: 'infrared_transient', label: 'Infrared Transient' },
                { key: 'variable_star', label: 'Pulsating Variable' },
                { key: 'cosmic_ray', label: 'Cosmic Ray Artifact' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setAnomalyType(t.key as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    anomalyType === t.key
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-black/30 border-cyan-500/15 text-cyan-400/70 hover:bg-cyan-500/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {anomalyType === 'moving_asteroid' && (
            <div className="grid grid-cols-2 gap-3 bg-black/30 p-3 rounded-2xl border border-cyan-500/15">
              <div className="flex flex-col gap-1">
                <label className="text-cyan-300">RA Drift: {raShiftArcsec.toFixed(1)}&quot;</label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={raShiftArcsec}
                  onChange={(e) => setRaShiftArcsec(parseFloat(e.target.value))}
                  className="accent-cyan-400 cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-cyan-300">Dec Drift: {decShiftArcsec.toFixed(1)}&quot;</label>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={decShiftArcsec}
                  onChange={(e) => setDecShiftArcsec(parseFloat(e.target.value))}
                  className="accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {anomalyType === 'infrared_transient' && (
            <div className="bg-black/30 p-3 rounded-2xl border border-cyan-500/15 flex flex-col gap-1">
              <label className="text-cyan-300">Peak Flare Multiplier: {flareMultiplier.toFixed(1)}x</label>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={flareMultiplier}
                onChange={(e) => setFlareMultiplier(parseFloat(e.target.value))}
                className="accent-cyan-400 cursor-pointer"
              />
            </div>
          )}

          <div className="bg-black/30 p-3 rounded-2xl border border-cyan-500/15 flex flex-col gap-1">
            <label className="text-cyan-300">Base Flux: {baseFlux.toFixed(0)} μJy</label>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={baseFlux}
              onChange={(e) => setBaseFlux(parseFloat(e.target.value))}
              className="accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyan-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-black/40 text-cyan-400 hover:text-white font-mono text-xs"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-mono text-xs font-bold hover:bg-cyan-400 transition-all shadow-lg"
            >
              INJECT & RE-EVALUATE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
