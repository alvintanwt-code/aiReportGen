'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

const VERDICT_STYLES = {
  healthy:     { color: 'var(--success-600)', bg: 'rgba(26,107,53,0.10)', label: 'Healthy' },
  watch:       { color: '#8a5a08',            bg: 'rgba(138,90,8,0.10)',  label: 'Watch' },
  'off-track': { color: 'var(--danger-600)',  bg: 'rgba(200,42,42,0.10)', label: 'Off-track' },
};

const CONFIDENCE_TONE = {
  high:   { color: 'var(--success-600)', bg: 'rgba(26,107,53,0.10)' },
  medium: { color: '#8a5a08',            bg: 'rgba(138,90,8,0.10)'  },
  low:    { color: 'var(--danger-600)',  bg: 'rgba(200,42,42,0.10)' },
};

function VerdictChip({ verdict }) {
  const style = VERDICT_STYLES[verdict] || VERDICT_STYLES.watch;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        background: style.bg,
        color: style.color,
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {style.label}
    </span>
  );
}

function ScoreDial({ value, max = 10 }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const circumference = 2 * Math.PI * 36;
  const dash = pct * circumference;
  const colorByScore = value >= 7.5
    ? 'var(--success-600)'
    : value >= 5
      ? '#8a5a08'
      : 'var(--danger-600)';
  return (
    <div style={{ position: 'relative', width: 96, height: 96 }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="36" fill="none" stroke="var(--slate-200)" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r="36"
          fill="none"
          stroke={colorByScore}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
          {value.toFixed(1)}
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>
          out of {max}
        </span>
      </div>
    </div>
  );
}

function SkeletonLine({ width = '100%', height = 12 }) {
  return (
    <div
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, var(--slate-100) 0%, var(--slate-200) 50%, var(--slate-100) 100%)',
        backgroundSize: '200% 100%',
        borderRadius: 4,
        animation: 'advisorPulse 1.4s ease-in-out infinite',
      }}
    />
  );
}

function LoadingState() {
  return (
    <div className="dash-panel" style={{ padding: 24 }}>
      <style>{`@keyframes advisorPulse { 0%, 100% { background-position: 200% 0; } 50% { background-position: -200% 0; } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Loader2 size={16} style={{ color: 'var(--accent-600)', animation: 'advisorSpin 0.9s linear infinite' }} />
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
          Reading the FNA…
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        <SkeletonLine />
        <SkeletonLine width="92%" />
        <SkeletonLine width="78%" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SkeletonLine height={56} />
        <SkeletonLine height={56} />
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="dash-panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} style={{ color: 'var(--danger-600)' }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>
              Couldn't generate the advisor's read
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {error || 'Unknown error'}
            </div>
          </div>
        </div>
        <button className="dash-btn" onClick={onRetry} style={{ fontSize: 12.5 }}>
          <RefreshCw size={13} strokeWidth={2.2} />
          Try again
        </button>
      </div>
    </div>
  );
}

export default function AdvisorsRead({ extractedData, metrics }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const lastSentTargetAge = useRef(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyse-fna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData, metrics }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setAnalysis(body.analysis);
    } catch (err) {
      console.error('AdvisorsRead fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (!extractedData || !metrics) return;
    lastSentTargetAge.current = metrics.targetAge;
    runAnalysis();
    // Intentionally only on mount — re-runs handled below for target age changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced refetch when target age changes
  useEffect(() => {
    if (!metrics || analysis === null) return;
    if (metrics.targetAge === lastSentTargetAge.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastSentTargetAge.current = metrics.targetAge;
      runAnalysis();
    }, 1200);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics?.targetAge]);

  if (loading && !analysis) return <LoadingState />;
  if (error && !analysis) return <ErrorState error={error} onRetry={runAnalysis} />;
  if (!analysis) return null;

  const archConf = CONFIDENCE_TONE[analysis.archetype?.confidence] || CONFIDENCE_TONE.medium;
  const fragilities = Array.isArray(analysis.fragilities) ? analysis.fragilities : [];
  const priorities = Array.isArray(analysis.priorities) ? analysis.priorities : [];
  const ratios = Array.isArray(analysis.ratios) ? analysis.ratios : [];

  return (
    <section style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
      <style>{`@keyframes advisorSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* Header */}
      <div
        className="dash-panel"
        style={{
          padding: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'var(--accent-50)',
              color: 'var(--accent-600)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Sparkles size={16} strokeWidth={2.2} />
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Advisor's read</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              LEET's snapshot of the client — verify before recommending.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {analysis.archetype && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: archConf.bg,
                color: archConf.color,
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 600,
              }}
              title={analysis.archetype.rationale}
            >
              <span style={{ fontWeight: 700 }}>Archetype {analysis.archetype.code}</span>
              <span style={{ opacity: 0.85, fontWeight: 500 }}>· {analysis.archetype.label}</span>
            </span>
          )}
          {loading && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 12 }}>
              <Loader2 size={13} style={{ animation: 'advisorSpin 0.9s linear infinite' }} />
              refreshing
            </span>
          )}
        </div>
      </div>

      {/* Snapshot paragraph */}
      <div className="dash-panel" style={{ padding: 22 }}>
        <div className="dash-eyebrow" style={{ marginBottom: 10 }}>Snapshot</div>
        <p
          style={{
            margin: 0,
            fontSize: 14.5,
            lineHeight: 1.7,
            color: 'var(--text)',
            fontWeight: 400,
          }}
        >
          {analysis.snapshot}
        </p>
        {analysis.archetype?.rationale && (
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 12.5,
              lineHeight: 1.55,
              color: 'var(--muted)',
              borderTop: '1px solid var(--border)',
              paddingTop: 12,
            }}
          >
            <strong style={{ color: 'var(--text)' }}>Why this archetype:</strong> {analysis.archetype.rationale}
          </p>
        )}
      </div>

      {/* Score + Ratios row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 16 }}>
        <div className="dash-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
          <div className="dash-eyebrow">Financial health score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ScoreDial value={Number(analysis.score?.value) || 0} max={analysis.score?.max || 10} />
            <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, flex: 1 }}>
              {analysis.score?.rationale}
            </div>
          </div>
        </div>

        <div className="dash-panel" style={{ padding: 22 }}>
          <div className="dash-eyebrow" style={{ marginBottom: 14 }}>Key ratios</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ratios.map((r, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  alignItems: 'center',
                  gap: 12,
                  paddingBottom: idx < ratios.length - 1 ? 12 : 0,
                  borderBottom: idx < ratios.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{r.comment}</div>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {r.value}
                </div>
                <VerdictChip verdict={r.verdict} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Priorities */}
      {priorities.length > 0 && (
        <div className="dash-panel" style={{ padding: 22 }}>
          <div className="dash-eyebrow" style={{ marginBottom: 14 }}>Suggested priorities</div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {priorities.map((p, idx) => (
              <li key={idx} style={{ display: 'flex', gap: 14 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: 'var(--accent-50)',
                    color: 'var(--accent-700)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {idx + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                    {p.rationale}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Hidden fragilities */}
      {fragilities.length > 0 && (
        <div
          className="dash-panel"
          style={{
            padding: 22,
            borderLeft: '3px solid #8a5a08',
            background: 'rgba(138,90,8,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={14} style={{ color: '#8a5a08' }} strokeWidth={2.4} />
            <div className="dash-eyebrow" style={{ color: '#8a5a08' }}>Hidden fragilities</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fragilities.map((f, idx) => (
              <div
                key={idx}
                style={{
                  paddingBottom: idx < fragilities.length - 1 ? 12 : 0,
                  borderBottom: idx < fragilities.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55 }}>
                  {f.rationale}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
