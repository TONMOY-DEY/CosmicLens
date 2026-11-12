"""SQLite database access layer for SKYTRACE AI metadata and dataset provenance."""

import sqlite3
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_DIR = Path(__file__).parent.parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "skytrace.db"


def get_db_connection() -> sqlite3.Connection:
    """Open connection with dict row factory."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize SQLite tables for datasets, observations, candidate audits, and settings."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data_provenance TEXT NOT NULL,
        disclaimer TEXT NOT NULL,
        format TEXT NOT NULL,
        file_path TEXT,
        file_size_bytes INTEGER DEFAULT 0,
        ra_center REAL,
        dec_center REAL,
        fov_arcmin REAL,
        telescope TEXT,
        instrument TEXT,
        date_obs TEXT,
        epoch_count INTEGER DEFAULT 1,
        source_count INTEGER DEFAULT 0,
        metadata_json TEXT,
        dimensions_status_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS candidates (
        candidate_id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        object_id TEXT NOT NULL,
        ra REAL NOT NULL,
        dec REAL NOT NULL,
        interestingness_score REAL NOT NULL,
        evidence_confidence_tier TEXT NOT NULL,
        evidence_confidence_numeric REAL NOT NULL,
        scientific_priority TEXT NOT NULL,
        primary_classification TEXT NOT NULL,
        dominant_dimension TEXT NOT NULL,
        usable_epoch_count INTEGER DEFAULT 1,
        quality_status TEXT NOT NULL,
        summary_text TEXT,
        full_analysis_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        target_id TEXT,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()


init_db()
