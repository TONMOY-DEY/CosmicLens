# SKYTRACE AI: An Explainable AI Scientific Discovery Engine for the Changing Infrared Sky

[![NASA Space Apps Challenge](https://img.shields.io/badge/NASA%20Space%20Apps-Challenge%202026-0B3D91?style=for-the-badge&logo=nasa)](https://www.spaceappschallenge.org/)
[![Mission](https://img.shields.io/badge/Mission-NASA%20SPHEREx%200.75--5.0%C2%B5m-0ea5e9?style=for-the-badge)](https://spherex.caltech.edu/)
[![Status](https://img.shields.io/badge/Status-Production%20Grade%20%7C%20Full%20Stack-10b981?style=for-the-badge)]()
[![Astropy](https://img.shields.io/badge/Powered%20By-Astropy%20%7C%20FastAPI%20%7C%20Next.js-36d9ff?style=for-the-badge)]()

**SKYTRACE AI** is a premium, full-stack, scientific discovery and explainable AI platform designed for professional astronomers, research institutions, and citizen scientists to explore repeated observations from NASA's **SPHEREx** (Spectro-Photometer for the History of the Universe, Epoch of Reionization, and Ices Explorer) mission.

**Tagline:** *An Explainable AI Scientific Discovery Engine for the Changing Infrared Sky.*

Core Scientific Discovery Journey:
```
NASA SPHEREx Data → Data Processing → Object Identification → Multi-Epoch Comparison → 
Change Detection → AI Anomaly Analysis → Scientific Validation → Explainable Results → Discovery Passport
```

---

## 🌌 Platform Identity & Premium Space Observatory UI

Built with a specialized space observatory visual design system:
- **Main Background**: Deep Space Navy (`#050816`)
- **Secondary Background**: Midnight Blue (`#0B1024`)
- **Card Background**: Dark Blue Translucent Glassmorphism Surfaces (`#0e1533` / `rgba(11, 16, 36, 0.75)`)
- **Primary Accent**: Electric Cyan (`#36D9FF`)
- **Secondary Accent**: Cosmic Violet (`#9274FF`)
- **Status Indicators**: Soft Emerald (`#10B981`), Warm Amber (`#F59E0B`), Soft Red (`#EF4444`)

---

## 🏛️ Application Architecture & The 11 Core Workspaces

The platform features a collapsible sidebar with dedicated workspaces:

### 1. Overview Dashboard (`PAGE 1`)
- Executive welcome hero banner with mission parameters and provenance guardrails.
- High-level metric cards: Total Datasets, Identified Sources, Total Observations, Anomalies Detected, High-Priority Candidates, Data Quality Index.
- Interactive visualizations: 5-Dimensional Anomaly Breakdown, Multi-Epoch Observation Cadence, and Triage Priority Pie Distribution.
- Top interesting candidates table with direct links to full dossiers.

### 2. NASA Data Import Center (`PAGE 2`)
- Drag-and-drop file ingestion for **FITS**, **CSV**, **ECSV**, and **JSON** datasets.
- Native **Astropy** FITS header parsing (`astropy.io.fits`, `astropy.wcs.WCS`, `astropy.table.Table`).
- **8-Step Scientific Import Workflow**:
  1. *Upload files*
  2. *Inspect file format*
  3. *Read metadata*
  4. *Identify observation time and sky coordinates*
  5. *Check available measurements and quality information*
  6. *Validate dataset completeness*
  7. *Import the dataset into SQLite store*
  8. *Show import summary & dimension readiness matrix*
- Inspect raw 80-column FITS header cards directly in the UI. Unsupported dimensions are explicitly marked as `NOT AVAILABLE` (never fabricated).

### 3. Sky Explorer (`PAGE 3`)
- High-performance interactive 2D Celestial Sky Map with accurate astronomical projection (RA inverted, East left, cosine dec correction).
- Pan, zoom, center-on-source, and FOV boundary footprint overlay.
- **Sky Time Machine**: Scrub across observation epochs with automated playback controls ($0.5\times, 1.0\times, 2.0\times, 5.0\times$).
- Target Dossier side panel displaying J2000 coordinates, flux, PSF FWHM, and proper motion vectors.

### 4. Astronomical Object Catalog (`PAGE 4`)
- Searchable, filterable, and sortable table of all identified celestial sources.
- Columns: Object ID, RA, Dec, Observations, Mean Flux, Interestingness, Priority, Data Quality.
- Multi-source selection tool to choose candidates and jump directly to side-by-side Change Analysis.

### 5. Multi-Epoch Change Analysis (`PAGE 5`)
- Core two-column **Before vs After** comparative workspace:
  - **Astrometric Differential**: Previous vs New RA/Dec, angular displacement ($\Delta \theta$ in arcsec), position angle (direction in compass degrees), and proper motion speed ($\text{arcsec/yr}$).
  - **Photometric Differential**: Absolute difference $\Delta F$ ($\mu\text{Jy}$), percentage variation, delta magnitude $\Delta m$, and interactive multi-epoch light curve with error bars.
  - **Infrared Spectral Residuals**: SPHEREx 10-band continuum and ice absorption residual plot with automated water ice ($3.05\,\mu m$) and $\text{CO}_2$ ($4.27\,\mu m$) trough diagnostics.
  - **Morphology Differential**: Point Spread Function Full-Width-at-Half-Maximum ($\Delta \text{FWHM}$) and quality flag state transitions.

### 6. AI Anomaly Detection Workspace (`PAGE 6`)
- 5 independent statistical and physical dimensions:
  1. **Motion Anomaly**: Astropy spherical kinematics proper motion detector ($\ge 3.0\sigma$ threshold).
  2. **Photometric Anomaly**: Median Absolute Deviation (MAD) & Reduced Chi-Squared ($\chi^2_\nu$).
  3. **Spectral Anomaly**: SPHEREx 102-band infrared color slope and ice absorption trough indices.
  4. **Temporal Anomaly**: Transient emergence and non-periodic outburst rate evaluation.
  5. **Context Anomaly**: Local neighborhood spatial outlier isolation.
- Interactive weight calibration sliders and minimum score sensitivity threshold.

### 7. Candidate Explorer (`PAGE 7`)
- Triage workspace separating **Scientific Interestingness** (physical novelty) from **Evidence Confidence** (data quality and multi-epoch corroboration).
- Card Grid and Table views with priority filtering (High, Moderate, Low) and category filtering.

### 8. Dedicated Scientific Validation Center (`PAGE 8`)
- Rigorous false-alarm vetting:
  - Signal-to-Noise Ratio ($\text{SNR} > 5.0$) test.
  - PSF sub-diffraction spike test to eliminate cosmic rays.
  - Single-epoch glitch vetter (requires $\ge 2$ epochs to corroborate).
  - Background RMS and nebular contamination test.
  - Cross-match separation vs beam size check.
- Four distinct statuses: `PASS`, `CAUTION`, `FAIL`, `UNKNOWN` with full explanatory text.

### 9. Evidence Explorer & Traceability Graph (`PAGE 9`)
- Interactive 6-tier relationship network:
  $$\text{Object} \longrightarrow \text{Observations} \longrightarrow \text{Measurements} \longrightarrow \text{Anomalies} \longrightarrow \text{Validation} \longrightarrow \text{Explanation}$$
- Traceable audit table detailing applied mathematical algorithms, thresholds, and residual uncertainties.

### 10. Explainable AI Reasoner (`PAGE 10`)
- Deterministic scientific explanation grounded strictly in backend computed metrics (zero LLM hallucinations).
- Explains why a candidate was flagged, contributing measurements, confidence justification, and recommended follow-up observations (e.g. JWST NIRSpec, Keck spectroscopy, MPC orbit cross-matching).

### 11. Scientific Discovery Passport (`PAGE 11`)
- Publication-quality scientific report dossier.
- Complete provenance, astrometric history, light curves, SED profiles, validation matrix, and observer recommendations.
- **Publication PDF Export**: Powered by backend ReportLab engine, generating formal PDF preprints directly from `/api/reports/pdf/{region_id}/{object_id}`.
- Native browser print integration (`window.print()`).

### 12. Settings & Calibration Studio
- Runtime detector weight adjustment and normalization.
- Sensitivity threshold configuration ($\sigma$ multiplier and variability %).
- Telemetry monitor for FastAPI Python backend and Astropy engine.

---

## 🔬 Scientific Data Integrity Rules

SKYTRACE AI strictly obeys core astronomical data integrity principles:
1. **Never invent NASA measurements.**
2. **Never claim synthetic demo data is real NASA data.**
3. All demonstration records are prominently labeled: `SIMULATED DEMO DATA — NOT A REAL ASTRONOMICAL DISCOVERY`.
4. Original uploaded FITS files are parsed genuinely with Astropy and preserved unchanged.
5. Missing measurements are explicitly marked as `NOT EVALUATED` / `NOT AVAILABLE`.
6. Scientific Interestingness is rigorously separated from Evidence Confidence.
7. An anomaly is never claimed to be a confirmed discovery merely because it passed automated quality checks.

---

## 🛠️ Technology Stack

### Backend
- **Python 3.12**
- **FastAPI**: Asynchronous high-performance REST APIs
- **Astropy**: Authentic FITS parsing, WCS extraction, and celestial coordinate calculations
- **NumPy & Pandas**: Numerical astrophysics and tabular operations
- **SciPy & Scikit-learn**: Chi-squared, robust MAD, and outlier detection
- **ReportLab**: PDF publication generator
- **SQLite3**: Metadata, dataset catalog, and provenance persistence
- **pytest**: Automated unit and integration test suite

### Frontend
- **Next.js 14 (App Router)**
- **React 18 & TypeScript**
- **Tailwind CSS**: Custom Space Observatory design system
- **Recharts**: Responsive scientific charting
- **Lucide React**: Clean, modern iconography
- **HTML5 Canvas & SVG**: Custom high-resolution celestial charts

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ and npm

### 2. Backend Setup & Startup
```powershell
# Navigate to backend directory
cd backend

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Run pytest test suite to verify all modules
pytest tests

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be live at `http://127.0.0.1:8000` with interactive OpenAPI docs at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup & Startup
```powershell
# In a separate terminal, navigate to frontend directory
cd frontend

# Build optimized production bundle
npm run build

# Start Next.js development or production server
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 🧪 Testing & Verification

Run the comprehensive backend test suite:
```powershell
pytest backend/tests
```
Output:
```text
backend\tests\test_anomaly_pipeline.py .........   [ 64%]
backend\tests\test_skytrace_v2.py .....            [100%]
======================== 14 passed in 2.70s ========================
```

---

## 📄 License & Attribution
Developed for the NASA Space Apps Challenge 2026 — "Planet X and SPHEREx."
All astronomical data schemas follow NASA/IPAC SPHEREx and STScI standards.
