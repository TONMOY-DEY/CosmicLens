'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  PageId,
  Region,
  AnalysisResult,
  ScientificDiscoveryPassport,
  DiscoverySummary,
  DatasetItem,
  DISCLAIMER_TEXT,
} from './lib/types';
import {
  DEFAULT_SURVEYS,
  DEFAULT_WEIGHTS,
  analyzeObjectLocally,
  getDiscoveriesLocally,
} from './lib/clientEngine';

// Layout components
import AppSidebar from './components/AppSidebar';
import AppTopbar from './components/AppTopbar';

// Page Views
import OverviewView from './components/views/OverviewView';
import DataCenterView from './components/views/DataCenterView';
import SkyExplorerView from './components/views/SkyExplorerView';
import ObjectCatalogView from './components/views/ObjectCatalogView';
import ChangeAnalysisView from './components/views/ChangeAnalysisView';
import AnomalyDetectionView from './components/views/AnomalyDetectionView';
import CandidateExplorerView from './components/views/CandidateExplorerView';
import ValidationCenterView from './components/views/ValidationCenterView';
import EvidenceExplorerView from './components/views/EvidenceExplorerView';
import ExplainableAIView from './components/views/ExplainableAIView';
import DiscoveryPassportView from './components/views/DiscoveryPassportView';
import SettingsView from './components/views/SettingsView';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AppRoot() {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Active Astronomical Survey & Epoch State
  const [surveys, setSurveys] = useState<Record<string, Region>>(DEFAULT_SURVEYS);
  const [activeRegionId, setActiveRegionId] = useState<string>('region_001');
  const [activeRegion, setActiveRegion] = useState<Region>(DEFAULT_SURVEYS.region_001);
  const [selectedEpoch, setSelectedEpoch] = useState<number>(0);
  const [selectedObjectId, setSelectedObjectId] = useState<string>('DEMO-001');

  // AI Analysis & Triage Ranking State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [passport, setPassport] = useState<ScientificDiscoveryPassport | null>(null);
  const [discoveries, setDiscoveries] = useState<DiscoverySummary[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [datasetsCount, setDatasetsCount] = useState<number>(1);

  // Time Machine Playback State
  const [playing, setPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Backend Connectivity & Global Search
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Initial Health Check & Backend Synchronization
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
        if (res.ok) {
          setIsBackendOnline(true);
          // Fetch real regions from API
          const regRes = await fetch(`${API_BASE}/api/region/${activeRegionId}`);
          if (regRes.ok) {
            const data = await regRes.json();
            setActiveRegion(data);
          }
          // Fetch datasets count
          const dsRes = await fetch(`${API_BASE}/api/datasets`);
          if (dsRes.ok) {
            const dsData = await dsRes.json();
            setDatasetsCount(dsData.total_datasets || 1);
          }
        } else {
          setIsBackendOnline(false);
        }
      } catch {
        setIsBackendOnline(false);
      }
    };
    checkBackend();
  }, [activeRegionId]);

  // 2. Synchronize active survey region changes
  useEffect(() => {
    const reg = surveys[activeRegionId] || DEFAULT_SURVEYS.region_001;
    setActiveRegion(reg);
    setSelectedEpoch(0);
    const firstCand = reg.epochs[0]?.sources[0]?.id || 'DEMO-001';
    setSelectedObjectId(firstCand);
  }, [activeRegionId, surveys]);

  // 3. Compute Anomaly Triage Rankings across region
  useEffect(() => {
    if (!activeRegion) return;

    const fetchDiscoveries = async () => {
      if (isBackendOnline) {
        try {
          const res = await fetch(`${API_BASE}/api/discoveries?region_id=${activeRegion.id}&limit=50`);
          if (res.ok) {
            const data = await res.json();
            setDiscoveries(data.discoveries || []);
            return;
          }
        } catch {
          // Fall through to client engine
        }
      }
      const localDisc = getDiscoveriesLocally(activeRegion, weights, 'all');
      setDiscoveries(localDisc);
    };

    fetchDiscoveries();
  }, [activeRegion, weights, isBackendOnline]);

  // 4. Compute Deep AI Analysis for selected candidate
  useEffect(() => {
    if (!activeRegion) return;

    const runAnalysis = async () => {
      if (isBackendOnline) {
        try {
          const res = await fetch(
            `${API_BASE}/api/analyze/object?region_id=${activeRegion.id}&object_id=${selectedObjectId}`
          );
          if (res.ok) {
            const data = await res.json();
            setAnalysis(data.analysis);
            setPassport(data.passport);
            return;
          }
        } catch {
          // Fall through to local
        }
      }
      const localRes = analyzeObjectLocally(selectedObjectId, activeRegion, weights);
      setAnalysis(localRes.analysis);
      setPassport(localRes.passport);
    };

    runAnalysis();
  }, [activeRegion, selectedObjectId, weights, isBackendOnline]);

  // 5. Sky Time Machine automatic epoch playback loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playing && activeRegion && activeRegion.epochs.length > 1) {
      interval = setInterval(() => {
        setSelectedEpoch((prev) => (prev + 1) % activeRegion.epochs.length);
      }, 1500 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [playing, playbackSpeed, activeRegion]);

  // Global Search Handler
  const handleGlobalSearch = (query: string) => {
    const q = query.trim().toUpperCase();
    if (!q) return;

    // Check if query matches a known source ID
    const matchedSource = discoveries.find((d) => d.object_id.toUpperCase().includes(q));
    if (matchedSource) {
      setSelectedObjectId(matchedSource.object_id);
      setActivePage('candidate_explorer');
    } else {
      // Navigate to catalog with search
      setActivePage('object_catalog');
    }
  };

  const candidateCount = discoveries.filter((d) => d.scientific_priority === 'HIGH').length;
  const anomalyCount = discoveries.filter((d) => d.interestingness_score >= 50).length;

  return (
    <div className="flex h-screen bg-space-900 text-slate-100 overflow-hidden starfield-bg select-none">
      {/* 1. Left Navigation Sidebar */}
      <AppSidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        candidateCount={candidateCount}
        anomalyCount={anomalyCount}
      />

      {/* 2. Main Application Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navigation Bar */}
        <AppTopbar
          surveys={surveys}
          activeRegionId={activeRegionId}
          setActiveRegionId={setActiveRegionId}
          isBackendOnline={isBackendOnline}
          onSearch={handleGlobalSearch}
          onOpenDataCenter={() => setActivePage('data_center')}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Dynamic Main Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {activePage === 'overview' && (
            <OverviewView
              activeRegion={activeRegion}
              discoveries={discoveries}
              onNavigate={setActivePage}
              onSelectCandidate={setSelectedObjectId}
              totalDatasetsCount={datasetsCount}
            />
          )}

          {activePage === 'data_center' && (
            <DataCenterView
              apiBase={API_BASE}
              isBackendOnline={isBackendOnline}
              onDatasetImported={() => {
                setDatasetsCount((prev) => prev + 1);
              }}
            />
          )}

          {activePage === 'sky_explorer' && (
            <SkyExplorerView
              activeRegion={activeRegion}
              selectedEpoch={selectedEpoch}
              setSelectedEpoch={setSelectedEpoch}
              selectedObjectId={selectedObjectId}
              setSelectedObjectId={setSelectedObjectId}
              playing={playing}
              setPlaying={setPlaying}
              playbackSpeed={playbackSpeed}
              setPlaybackSpeed={setPlaybackSpeed}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'object_catalog' && (
            <ObjectCatalogView
              activeRegion={activeRegion}
              discoveries={discoveries}
              selectedObjectId={selectedObjectId}
              setSelectedObjectId={setSelectedObjectId}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'change_analysis' && (
            <ChangeAnalysisView
              activeRegion={activeRegion}
              selectedObjectId={selectedObjectId}
              setSelectedObjectId={setSelectedObjectId}
              analysis={analysis}
              apiBase={API_BASE}
              isBackendOnline={isBackendOnline}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'anomaly_detection' && (
            <AnomalyDetectionView
              activeRegion={activeRegion}
              discoveries={discoveries}
              selectedObjectId={selectedObjectId}
              setSelectedObjectId={setSelectedObjectId}
              weights={weights}
              setWeights={setWeights}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'candidate_explorer' && (
            <CandidateExplorerView
              discoveries={discoveries}
              selectedObjectId={selectedObjectId}
              setSelectedObjectId={setSelectedObjectId}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'validation_center' && (
            <ValidationCenterView
              activeRegion={activeRegion}
              selectedObjectId={selectedObjectId}
              setSelectedObjectId={setSelectedObjectId}
              analysis={analysis}
              apiBase={API_BASE}
              isBackendOnline={isBackendOnline}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'evidence_explorer' && (
            <EvidenceExplorerView
              activeRegion={activeRegion}
              selectedObjectId={selectedObjectId}
              setSelectedObjectId={setSelectedObjectId}
              analysis={analysis}
              apiBase={API_BASE}
              isBackendOnline={isBackendOnline}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'discovery_passport' && (
            <DiscoveryPassportView
              activeRegion={activeRegion}
              passport={passport}
              selectedObjectId={selectedObjectId}
              setSelectedObjectId={setSelectedObjectId}
              apiBase={API_BASE}
              isBackendOnline={isBackendOnline}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'settings' && (
            <SettingsView
              weights={weights}
              setWeights={setWeights}
              apiBase={API_BASE}
              isBackendOnline={isBackendOnline}
            />
          )}
        </main>
      </div>
    </div>
  );
}
