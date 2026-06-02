'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, FileSearch, AlertTriangle, ChevronRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { saveFNASummary } from '../lib/firebaseUtils';
import AdvisorsRead from './AdvisorsRead';

// ---------- FI Ratio engine ----------
// Replaces "$/year of age" with the bridged 25× rule. The score answers a single
// question: can the assets outlive the lifestyle? CPF Life is credited only for
// the post-65 stretch — clients targeting work-optional before 65 carry the
// "bridge years" on non-CPF assets alone.

const BLENDED_RETURN = 0.06;                // long-term blended return (sits between house-view 8.5% equity and 3.8% bond)
const CPF_PROJECTED_RETURN = 0.04;          // conservative CPF compounding rate (SA-weighted)
const CPF_LIFE_ANNUAL_PAYOUT_RATE = 0.094;  // ~9.4%/yr of RA balance (e.g. FRS $220.4k → ~$1.73k/mo Standard Plan)
const CPF_ERS_CAP_2026 = 440800;            // ERS cap from house views
const CPF_LIFE_START_AGE = 65;
const DEFAULT_TARGET_AGE = 65;

const PHASE_BANDS = [
  { min: 0,  max: 25,       label: 'Accumulating',     description: 'Foundation phase. Habit beats optimisation here.' },
  { min: 25, max: 65,       label: 'Building',         description: 'Course-correctable. This is where most clients live.' },
  { min: 65, max: 90,       label: 'Transition Ready', description: 'The end is visible. Optimise drawdown and risk glide.' },
  { min: 90, max: Infinity, label: 'Work Optional',    description: 'Math passes the 25× test. Focus on legacy and control.' },
];

function computeFIMetrics(extractedData, overrideTargetAge) {
  const age = extractedData.personalInfo?.age || 0;
  const extractedTarget = extractedData.personalInfo?.targetWorkOptionalAge || 0;
  const targetAge = overrideTargetAge || extractedTarget || DEFAULT_TARGET_AGE;

  const monthlyIncome =
    (extractedData.cashflow?.income || 0) +
    (extractedData.cashflow?.otherIncome || 0) +
    (extractedData.cashflow?.rentalIncome || 0);
  const monthlyExpenses = extractedData.cashflow?.netExpenses || 0;
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const annualExpenses = monthlyExpenses * 12;
  const annualSavings = Math.max(0, monthlySavings * 12);

  // Non-CPF liquid carries the bridge years (CPF can't be drawn before 55/65)
  const nonCPFLiquid =
    (extractedData.assets?.cashSavings || 0) +
    (extractedData.assets?.equities || 0) +
    (extractedData.assets?.bonds || 0) +
    (extractedData.assets?.mutualFunds || 0) +
    (extractedData.assets?.etfs || 0) +
    (extractedData.assets?.srs || 0) +
    (extractedData.assets?.insuranceCashValue || 0);
  const cpfRetirement = (extractedData.assets?.cpfOA || 0) + (extractedData.assets?.cpfSA || 0);

  // CPF Life estimate — current balance compounded to 65, capped at ERS, paid at ~9.4%/yr
  const yearsToCPFLife = Math.max(0, CPF_LIFE_START_AGE - age);
  const projectedCPFAtPayout = Math.min(
    CPF_ERS_CAP_2026,
    cpfRetirement * Math.pow(1 + CPF_PROJECTED_RETURN, yearsToCPFLife)
  );
  const annualCPFLifeIncome = projectedCPFAtPayout * CPF_LIFE_ANNUAL_PAYOUT_RATE;

  const yearsToTarget = Math.max(0, targetAge - age);
  const isDrawdown = yearsToTarget === 0;
  const bridgeYears = Math.max(0, CPF_LIFE_START_AGE - Math.max(age, targetAge));

  let projectedLiquidAtTarget;
  if (isDrawdown) {
    projectedLiquidAtTarget = nonCPFLiquid;
  } else {
    const growthFactor = Math.pow(1 + BLENDED_RETURN, yearsToTarget);
    const annuityFactor = (growthFactor - 1) / BLENDED_RETURN;
    projectedLiquidAtTarget = nonCPFLiquid * growthFactor + annualSavings * annuityFactor;
  }

  const post65AnnualGap = Math.max(0, annualExpenses - annualCPFLifeIncome);
  const post65NestEgg = 25 * post65AnnualGap;
  const bridgeCost = bridgeYears * annualExpenses;
  const requiredNestEgg = bridgeCost + post65NestEgg;

  const fiRatio = requiredNestEgg > 0 ? (projectedLiquidAtTarget / requiredNestEgg) * 100 : 0;
  const currentRunwayYears = annualExpenses > 0 ? nonCPFLiquid / annualExpenses : 0;

  const score = Math.max(0, Math.min(100, fiRatio));
  const band = PHASE_BANDS.find((b) => score >= b.min && score < b.max) || PHASE_BANDS[PHASE_BANDS.length - 1];
  const bandSpan = band.max === Infinity ? 10 : band.max - band.min;
  const positionInPhase = Math.min(100, ((score - band.min) / bandSpan) * 100);

  return {
    age,
    targetAge,
    targetAgeFromExtraction: extractedTarget > 0,
    yearsToTarget,
    bridgeYears,
    isDrawdown,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    annualExpenses,
    annualSavings,
    nonCPFLiquid,
    cpfRetirement,
    projectedCPFAtPayout,
    annualCPFLifeIncome,
    projectedLiquidAtTarget,
    requiredNestEgg,
    bridgeCost,
    post65NestEgg,
    fiRatio,
    currentRunwayYears,
    score,
    phase: band.label,
    phaseDescription: band.description,
    positionInPhase,
  };
}

// Deterministic insight — picks the most useful lever for this client's FI situation.
// Used in the gauge area so the advisor sees "what to do" not just "where they are".
function buildFIInsight(m) {
  if (m.isDrawdown) {
    return `Drawdown phase — focus shifts to sustainable yield, sequence-of-returns risk, and CPF Life timing.`;
  }
  const yearsToTarget = Math.max(1, m.targetAge - m.age);
  const r = 0.06;
  const annuityFactor = (Math.pow(1 + r, yearsToTarget) - 1) / r;
  const fmtSGD = (v) => `S$${Math.round(v).toLocaleString('en-SG')}`;

  if (m.fiRatio >= 90) {
    return `Math passes the 25× test. Conversation moves to drawdown sequencing, risk glide, and legacy positioning.`;
  }
  if (m.fiRatio >= 65) {
    const gap = Math.max(0, 0.9 * m.requiredNestEgg - m.projectedLiquidAtTarget);
    const extraMonthly = gap > 0 ? gap / annuityFactor / 12 : 0;
    if (extraMonthly < 100) {
      return `On the glide path. Sustain current savings and shift attention to drawdown sequencing.`;
    }
    return `Adding ${fmtSGD(extraMonthly)}/mo would push the FI Ratio to 90% by age ${m.targetAge}.`;
  }
  const gap = Math.max(0, m.requiredNestEgg - m.projectedLiquidAtTarget);
  const extraMonthly = gap > 0 ? gap / annuityFactor / 12 : 0;
  if (extraMonthly < 100) {
    return `Within striking distance. Modest savings lift or a 2-year target shift closes the gap.`;
  }
  return `${fmtSGD(extraMonthly)}/mo extra savings — or pushing the target age out — would close the gap to age ${m.targetAge}.`;
}

const ASSET_COLORS = ['#635bff', '#1a6b35', '#8a5a08', '#697386', '#c1c9d2', '#e3e8ee'];

// ---------- Raw extraction inspector ----------
// Shows every field returned by /api/extract-fna so the user can verify the
// AI picked things up correctly. Zero/blank values are marked as "not detected"
// so misses stand out.

const NUMERIC_FIELDS = new Set([
  'age',
  'yearsOfSupport',
  'annualPremium',
  'yearsLeftToPay',
  'sumAssuredDeath',
  'sumAssuredDisability',
  'sumAssuredCI',
  'totalPremiumPaid',
  // assets
  'cashSavings',
  'cpfOA',
  'cpfSA',
  'cpfMA',
  'srs',
  'equities',
  'bonds',
  'mutualFunds',
  'etfs',
  'insuranceCashValue',
  'residentialPropertyValue',
  'investmentPropertyValue',
  'businessInterests',
  'otherAssets',
  // liabilities
  'loans',
  'mortgage',
  'investmentPropertyMortgage',
  'creditCardDebt',
  'carLoan',
  'otherLiabilities',
  // cashflow
  'income',
  'otherIncome',
  'rentalIncome',
  'netExpenses',
  'netInvestmentRSP',
  // expense breakdown
  'housing',
  'food',
  'transport',
  'utilities',
  'insurance',
  'lifestyle',
  'childrenEducation',
  'parentsAllowance',
  'healthcare',
  'otherExpenses',
  // goals
  'targetAmount',
  'targetYears',
]);

const FIELD_LABELS = {
  // personalInfo
  name: 'Name',
  gender: 'Gender',
  age: 'Age',
  maritalStatus: 'Marital status',
  priorities: 'Key priorities',
  relationship: 'Relationship',
  yearsOfSupport: 'Years of support',
  // policies
  type: 'Type',
  annualPremium: 'Annual premium',
  yearsLeftToPay: 'Years left to pay',
  sumAssuredDeath: 'Sum assured (death)',
  sumAssuredDisability: 'Sum assured (disability)',
  sumAssuredCI: 'Sum assured (critical illness)',
  totalPremiumPaid: 'Total premium paid',
  // assets
  cashSavings: 'Cash savings',
  cpfOA: 'CPF — Ordinary',
  cpfSA: 'CPF — Special',
  cpfMA: 'CPF — Medisave',
  srs: 'SRS',
  equities: 'Equities',
  bonds: 'Bonds',
  mutualFunds: 'Mutual funds',
  etfs: 'ETFs',
  insuranceCashValue: 'Insurance cash value',
  residentialPropertyValue: 'Residential property',
  investmentPropertyValue: 'Investment property',
  businessInterests: 'Business interests',
  otherAssets: 'Other assets',
  // liabilities
  loans: 'Personal loans',
  mortgage: 'Primary mortgage',
  investmentPropertyMortgage: 'Investment property mortgage',
  creditCardDebt: 'Credit card debt',
  carLoan: 'Car loan',
  otherLiabilities: 'Other liabilities',
  // cashflow
  income: 'Monthly income',
  otherIncome: 'Other income',
  rentalIncome: 'Rental income',
  netExpenses: 'Net expenses (total)',
  netInvestmentRSP: 'Net investment RSP',
  // expense breakdown
  housing: 'Housing',
  food: 'Food',
  transport: 'Transport',
  utilities: 'Utilities',
  insurance: 'Insurance premiums',
  lifestyle: 'Lifestyle / dining',
  childrenEducation: "Children's education",
  parentsAllowance: 'Parents allowance',
  healthcare: 'Healthcare',
  otherExpenses: 'Other expenses',
  // goals
  description: 'Goal',
  targetAmount: 'Target amount',
  targetYears: 'Target in (years)',
};

const fmtSGD = (v) => `S$${Number(v).toLocaleString('en-SG', { maximumFractionDigits: 0 })}`;

function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return value === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function formatValue(key, value) {
  if (isEmpty(value)) return null;
  if (NUMERIC_FIELDS.has(key)) {
    // Age + years stay raw; money fields format as SGD.
    if (key === 'age' || key === 'yearsLeftToPay') return String(value);
    return fmtSGD(value);
  }
  return String(value);
}

function RawRow({ keyName, value }) {
  const label = FIELD_LABELS[keyName] || keyName;
  const empty = isEmpty(value);
  const display = empty ? 'Not detected' : formatValue(keyName, value);
  return (
    <tr>
      <td style={{ padding: '8px 14px', fontSize: 13, color: 'var(--slate-700)' }}>{label}</td>
      <td
        style={{
          padding: '8px 14px',
          fontSize: 13,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          color: empty ? 'var(--subtle)' : 'var(--text)',
          fontWeight: empty ? 400 : 500,
          fontStyle: empty ? 'italic' : 'normal',
        }}
      >
        {display}
      </td>
    </tr>
  );
}

function RawSection({ title, rows }) {
  return (
    <div className="dash-panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--slate-50)',
          fontSize: 11.5,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          fontWeight: 600,
          color: 'var(--muted)',
        }}
      >
        {title}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.key} style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border)' }}>
              <td style={{ padding: '8px 14px', fontSize: 13, color: 'var(--slate-700)' }}>
                {FIELD_LABELS[row.key] || row.key}
              </td>
              <td
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  color: row.empty ? 'var(--subtle)' : 'var(--text)',
                  fontWeight: row.empty ? 400 : 500,
                  fontStyle: row.empty ? 'italic' : 'normal',
                }}
              >
                {row.empty ? 'Not detected' : row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function rowsFor(obj, keys) {
  return keys.map((k) => {
    const raw = obj?.[k];
    const empty = isEmpty(raw);
    return { key: k, empty, value: empty ? null : formatValue(k, raw) };
  });
}

function GoalsSection({ title, goals }) {
  return (
    <div className="dash-panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--slate-50)',
          fontSize: 11.5,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          fontWeight: 600,
          color: 'var(--muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{title}</span>
        <span style={{ color: 'var(--text)' }}>{goals.length} goal{goals.length === 1 ? '' : 's'}</span>
      </div>
      {goals.length === 0 ? (
        <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>
          Not detected
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '8px 14px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--subtle)', fontWeight: 600, textAlign: 'left' }}>Goal</th>
              <th style={{ padding: '8px 14px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--subtle)', fontWeight: 600, textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '8px 14px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--subtle)', fontWeight: 600, textAlign: 'right' }}>In (yrs)</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((g, idx) => {
              const amountEmpty = isEmpty(g?.targetAmount);
              const yearsEmpty = isEmpty(g?.targetYears);
              const descEmpty = isEmpty(g?.description);
              return (
                <tr key={idx} style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 14px', fontSize: 13, color: descEmpty ? 'var(--subtle)' : 'var(--slate-700)', fontStyle: descEmpty ? 'italic' : 'normal' }}>
                    {descEmpty ? `Goal ${idx + 1}` : g.description}
                  </td>
                  <td style={{ padding: '8px 14px', fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: amountEmpty ? 'var(--subtle)' : 'var(--text)', fontStyle: amountEmpty ? 'italic' : 'normal', fontWeight: amountEmpty ? 400 : 500 }}>
                    {amountEmpty ? 'Not detected' : fmtSGD(g.targetAmount)}
                  </td>
                  <td style={{ padding: '8px 14px', fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: yearsEmpty ? 'var(--subtle)' : 'var(--text)', fontStyle: yearsEmpty ? 'italic' : 'normal', fontWeight: yearsEmpty ? 400 : 500 }}>
                    {yearsEmpty ? '—' : g.targetYears}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RawExtractionTable({ data }) {
  if (!data) return null;

  const personalRows = rowsFor(data.personalInfo, ['name', 'gender', 'age', 'maritalStatus', 'priorities']);
  const dependents = Array.isArray(data.personalInfo?.dependents) ? data.personalInfo.dependents : [];
  const policies = Array.isArray(data.policies) ? data.policies : [];
  const assetRows = rowsFor(data.assets, [
    'cashSavings',
    'cpfOA',
    'cpfSA',
    'cpfMA',
    'srs',
    'equities',
    'bonds',
    'mutualFunds',
    'etfs',
    'insuranceCashValue',
    'residentialPropertyValue',
    'investmentPropertyValue',
    'businessInterests',
    'otherAssets',
  ]);
  const liabilityRows = rowsFor(data.liabilities, [
    'loans',
    'mortgage',
    'investmentPropertyMortgage',
    'creditCardDebt',
    'carLoan',
    'otherLiabilities',
  ]);
  const cashflowRows = rowsFor(data.cashflow, [
    'income',
    'otherIncome',
    'rentalIncome',
    'netInvestmentRSP',
    'netExpenses',
  ]);
  const expenseRows = rowsFor(data.cashflow?.expenses, [
    'housing',
    'food',
    'transport',
    'utilities',
    'insurance',
    'lifestyle',
    'childrenEducation',
    'parentsAllowance',
    'healthcare',
    'otherExpenses',
  ]);
  const shortGoals = Array.isArray(data.goals?.shortTerm) ? data.goals.shortTerm : [];
  const midGoals = Array.isArray(data.goals?.midTerm) ? data.goals.midTerm : [];
  const longGoals = Array.isArray(data.goals?.longTerm) ? data.goals.longTerm : [];

  const totalFields =
    personalRows.length + assetRows.length + liabilityRows.length +
    cashflowRows.length + expenseRows.length +
    dependents.length * 4 + policies.length * 7 +
    (shortGoals.length + midGoals.length + longGoals.length) * 3;
  const detectedFields =
    personalRows.filter((r) => !r.empty).length +
    assetRows.filter((r) => !r.empty).length +
    liabilityRows.filter((r) => !r.empty).length +
    cashflowRows.filter((r) => !r.empty).length +
    expenseRows.filter((r) => !r.empty).length +
    dependents.reduce((s, d) => s + ['name', 'relationship', 'age', 'yearsOfSupport'].filter((k) => !isEmpty(d?.[k])).length, 0) +
    policies.length * 7 +
    [...shortGoals, ...midGoals, ...longGoals].reduce(
      (s, g) => s + ['description', 'targetAmount', 'targetYears'].filter((k) => !isEmpty(g?.[k])).length,
      0
    );
  const missRate = totalFields > 0 ? Math.round(((totalFields - detectedFields) / totalFields) * 100) : 0;

  return (
    <section style={{ marginTop: 28 }}>
      <div
        className="dash-panel"
        style={{
          padding: 18,
          marginBottom: 16,
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
            <FileSearch size={16} strokeWidth={2.2} />
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Raw scan inspector</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              Every field returned by the extractor — verify the AI picked it up correctly.
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            fontSize: 12.5,
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>
            <strong style={{ color: 'var(--text)', fontSize: 14 }}>{detectedFields}</strong> / {totalFields} detected
          </span>
          {missRate > 50 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: '#8a5a08',
                fontWeight: 500,
              }}
            >
              <AlertTriangle size={12} strokeWidth={2.4} />
              {missRate}% blank — re-scan?
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RawSection title="Personal information" rows={personalRows} />

          <div className="dash-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--slate-50)',
                fontSize: 11.5,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontWeight: 600,
                color: 'var(--muted)',
              }}
            >
              Dependents
            </div>
            {dependents.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>
                Not detected
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {dependents.map((dep, idx) => {
                  const depRows = rowsFor(dep, ['name', 'relationship', 'age', 'yearsOfSupport']);
                  return (
                    <div
                      key={idx}
                      style={{
                        borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                        padding: '10px 14px',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                        Dependent {idx + 1}
                        {dep.name ? ` · ${dep.name}` : ''}
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {depRows.map((row) => (
                            <tr key={row.key}>
                              <td style={{ padding: '4px 0', fontSize: 12.5, color: 'var(--muted)' }}>
                                {FIELD_LABELS[row.key] || row.key}
                              </td>
                              <td
                                style={{
                                  padding: '4px 0',
                                  fontSize: 12.5,
                                  textAlign: 'right',
                                  fontVariantNumeric: 'tabular-nums',
                                  color: row.empty ? 'var(--subtle)' : 'var(--text)',
                                  fontStyle: row.empty ? 'italic' : 'normal',
                                  fontWeight: row.empty ? 400 : 500,
                                }}
                              >
                                {row.empty ? 'Not detected' : row.value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <RawSection title="Liabilities" rows={liabilityRows} />

          <div className="dash-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--slate-50)',
                fontSize: 11.5,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontWeight: 600,
                color: 'var(--muted)',
              }}
            >
              Cashflow
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {cashflowRows.map((row, idx) => (
                  <tr key={row.key} style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 14px', fontSize: 13, color: 'var(--slate-700)' }}>
                      {FIELD_LABELS[row.key] || row.key}
                    </td>
                    <td
                      style={{
                        padding: '8px 14px',
                        fontSize: 13,
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        color: row.empty ? 'var(--subtle)' : 'var(--text)',
                        fontWeight: row.empty ? 400 : 500,
                        fontStyle: row.empty ? 'italic' : 'normal',
                      }}
                    >
                      {row.empty ? 'Not detected' : row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              style={{
                padding: '10px 14px 6px',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--subtle)',
                fontWeight: 600,
              }}
            >
              Expense breakdown
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {expenseRows.map((row, idx) => (
                  <tr key={row.key} style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border)' }}>
                    <td style={{ padding: '7px 14px', fontSize: 12.5, color: 'var(--slate-700)' }}>
                      {FIELD_LABELS[row.key] || row.key}
                    </td>
                    <td
                      style={{
                        padding: '7px 14px',
                        fontSize: 12.5,
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        color: row.empty ? 'var(--subtle)' : 'var(--text)',
                        fontWeight: row.empty ? 400 : 500,
                        fontStyle: row.empty ? 'italic' : 'normal',
                      }}
                    >
                      {row.empty ? 'Not detected' : row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RawSection title="Assets" rows={assetRows} />

          <div className="dash-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--slate-50)',
                fontSize: 11.5,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontWeight: 600,
                color: 'var(--muted)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Insurance policies</span>
              <span style={{ color: 'var(--text)' }}>{policies.length} found</span>
            </div>
            {policies.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>
                Not detected
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {policies.map((policy, idx) => {
                  const policyRows = rowsFor(policy, [
                    'type',
                    'annualPremium',
                    'yearsLeftToPay',
                    'sumAssuredDeath',
                    'sumAssuredDisability',
                    'sumAssuredCI',
                    'totalPremiumPaid',
                  ]);
                  return (
                    <div
                      key={idx}
                      style={{
                        borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                        padding: '10px 14px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text)',
                          marginBottom: 6,
                        }}
                      >
                        {policy.name || `Policy ${idx + 1}`}
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {policyRows.map((row) => (
                            <tr key={row.key}>
                              <td style={{ padding: '4px 0', fontSize: 12.5, color: 'var(--muted)' }}>
                                {FIELD_LABELS[row.key] || row.key}
                              </td>
                              <td
                                style={{
                                  padding: '4px 0',
                                  fontSize: 12.5,
                                  textAlign: 'right',
                                  fontVariantNumeric: 'tabular-nums',
                                  color: row.empty ? 'var(--subtle)' : 'var(--text)',
                                  fontStyle: row.empty ? 'italic' : 'normal',
                                  fontWeight: row.empty ? 400 : 500,
                                }}
                              >
                                {row.empty ? 'Not detected' : row.value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <GoalsSection title="Short-term goals" goals={shortGoals} />
        <GoalsSection title="Mid-term goals" goals={midGoals} />
        <GoalsSection title="Long-term goals" goals={longGoals} />
      </div>
    </section>
  );
}

export default function FNASummaryDashboard({ extractedData, onContinue }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [isSaving, setIsSaving] = useState(false);
  const [targetAgeOverride, setTargetAgeOverride] = useState(null);

  const metrics = useMemo(() => {
    const fi = computeFIMetrics(extractedData, targetAgeOverride);

    // Wealth position — total/liquid/net are display-level numbers, separate
    // from the FI engine's nonCPFLiquid (which excludes CPF for bridge math).
    const liquidAssets =
      (extractedData.assets?.cashSavings || 0) +
      (extractedData.assets?.cpfOA || 0) +
      (extractedData.assets?.cpfSA || 0) +
      (extractedData.assets?.cpfMA || 0) +
      (extractedData.assets?.equities || 0) +
      (extractedData.assets?.mutualFunds || 0) +
      (extractedData.assets?.etfs || 0) +
      (extractedData.assets?.bonds || 0) +
      (extractedData.assets?.srs || 0) +
      (extractedData.assets?.insuranceCashValue || 0);
    const totalAssets =
      liquidAssets +
      (extractedData.assets?.residentialPropertyValue || 0) +
      (extractedData.assets?.investmentPropertyValue || 0) +
      (extractedData.assets?.businessInterests || 0) +
      (extractedData.assets?.otherAssets || 0);
    const personalLoans = extractedData.liabilities?.loans || 0;
    const propertyMortgage =
      (extractedData.liabilities?.mortgage || 0) +
      (extractedData.liabilities?.investmentPropertyMortgage || 0);
    const totalLiabilities =
      personalLoans +
      propertyMortgage +
      (extractedData.liabilities?.creditCardDebt || 0) +
      (extractedData.liabilities?.carLoan || 0) +
      (extractedData.liabilities?.otherLiabilities || 0);
    const netWorth = totalAssets - totalLiabilities;

    const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const savingsRate = fi.monthlyIncome > 0 ? (fi.monthlySavings / fi.monthlyIncome) * 100 : 0;

    return {
      ...fi,
      liquidAssets,
      totalAssets,
      totalLiabilities,
      netWorth,
      debtRatio,
      savingsRate,
      // Aliases for existing gauge JSX that read `scoreOut100`
      scoreOut100: fi.score,
    };
  }, [extractedData, targetAgeOverride]);

  useEffect(() => {
    const autoSave = async () => {
      if (!auth.currentUser || !clientId || !extractedData) return;
      setIsSaving(true);
      try {
        await saveFNASummary(
          auth.currentUser.uid,
          clientId,
          extractedData.personalInfo?.name || 'Client',
          extractedData,
          metrics
        );
      } catch (error) {
        console.error('Failed to auto-save FNA summary:', error);
      } finally {
        setIsSaving(false);
      }
    };
    autoSave();
  }, [clientId, extractedData, metrics]);

  const formatCurrency = (value) => `S$${Math.round(value).toLocaleString('en-SG')}`;

  const assetBreakdown = [
    { name: 'Cash', value: extractedData.assets?.cashSavings || 0 },
    { name: 'CPF', value: (extractedData.assets?.cpfOA || 0) + (extractedData.assets?.cpfSA || 0) + (extractedData.assets?.cpfMA || 0) },
    { name: 'Equities', value: extractedData.assets?.equities || 0 },
    { name: 'Funds', value: extractedData.assets?.mutualFunds || 0 },
    { name: 'Insurance', value: extractedData.assets?.insuranceCashValue || 0 },
    { name: 'Property', value: extractedData.assets?.residentialPropertyValue || 0 },
  ].filter((item) => item.value > 0);

  const positivetraj = metrics.monthlySavings > 0;

  return (
    <div className="dash-root dash-upload">
      <header className="dash-upload-header">
        <div className="dash-upload-header-left">
          <button className="dash-back" onClick={() => router.push('/')}>
            <ArrowLeft size={14} strokeWidth={2.2} />
            Dashboard
          </button>
          <div className="dash-crumbs">
            <span className="dash-crumb">{extractedData.personalInfo?.name || 'Client'}</span>
            <span className="dash-crumb-sep">·</span>
            <span className="dash-crumb dash-crumb-current">Financial health summary</span>
          </div>
        </div>
        <div className="dash-topbar-right">
          <button className="dash-btn dash-btn-primary" onClick={onContinue}>
            4-factor planning
            <ArrowRight size={14} strokeWidth={2.4} />
          </button>
        </div>
      </header>

      <div className="dash-upload-body no-rail" style={{ maxWidth: 1200 }}>
        <main>
          <h1 className="dash-h1" style={{ marginBottom: 6 }}>Financial health summary</h1>
          <p className="dash-section-sub">
            Age {metrics.age} · Generated today {isSaving && <span style={{ color: 'var(--subtle)' }}>· saving…</span>}
          </p>

          {/* Hero: Work Optional Index */}
          <section className="dash-panel" style={{ marginBottom: 18, padding: 28 }}>
            <div className="dash-eyebrow" style={{ marginBottom: 8 }}>Wealth trajectory</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
              <h2 className="dash-h2">Work Optional Index</h2>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                Position on the wealth journey
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, alignItems: 'start' }}>
              <div>
                {/* Phase banner — narrowed to the arc column so it doesn't stretch the panel */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 14px',
                    background: 'var(--accent-50)',
                    borderLeft: '3px solid var(--accent-500)',
                    borderRadius: 'var(--r-md)',
                    marginBottom: 14,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--accent-700)', margin: 0 }}>
                      {metrics.phase}
                    </h3>
                    <p style={{ fontSize: 12.5, color: 'var(--accent-700)', opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
                      {metrics.phaseDescription}
                    </p>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: positivetraj ? 'var(--success-600)' : 'var(--danger-600)',
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {positivetraj ? <TrendingUp size={12} strokeWidth={2.4} /> : <TrendingDown size={12} strokeWidth={2.4} />}
                    {positivetraj ? 'Moving forward' : 'Needs attention'}
                  </span>
                </div>

                <svg viewBox="0 0 280 180" style={{ width: '100%', height: 'auto' }}>
                  <path
                    d="M 40 140 A 120 120 0 0 1 240 140"
                    fill="none"
                    stroke="var(--slate-200)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    pathLength="100"
                  />
                  <path
                    d="M 40 140 A 120 120 0 0 1 240 140"
                    fill="none"
                    stroke="var(--accent-500)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray={`${metrics.scoreOut100} 100`}
                    style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
                  />
                  {/* Tick marks — minor every 10%, labelled major ticks at the band boundaries.
                      Arc geometry: center (140, 206.33), radius 120, sweeps from θ≈-2.556 rad to θ≈-0.585 rad. */}
                  {(() => {
                    const cx = 140;
                    const cy = 206.33;
                    const thetaStart = -2.5562;
                    const thetaTotal = 1.9701;
                    const tickAt = (pos, innerR, outerR) => {
                      const theta = thetaStart + (pos / 100) * thetaTotal;
                      const c = Math.cos(theta);
                      const s = Math.sin(theta);
                      return {
                        x1: cx + innerR * c,
                        y1: cy + innerR * s,
                        x2: cx + outerR * c,
                        y2: cy + outerR * s,
                        lx: cx + (outerR + 8) * c,
                        ly: cy + (outerR + 8) * s,
                      };
                    };
                    const minorTicks = [10, 20, 30, 40, 50, 60, 70, 80, 100];
                    const majorTicks = [
                      { pos: 25, label: '25' },
                      { pos: 65, label: '65' },
                      { pos: 90, label: '90' },
                    ];
                    return (
                      <>
                        {minorTicks.map((pos) => {
                          const t = tickAt(pos, 130, 134);
                          return (
                            <line
                              key={`m-${pos}`}
                              x1={t.x1}
                              y1={t.y1}
                              x2={t.x2}
                              y2={t.y2}
                              stroke="var(--slate-300, #cbd2dc)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          );
                        })}
                        {majorTicks.map(({ pos, label }) => {
                          const t = tickAt(pos, 130, 140);
                          return (
                            <g key={`M-${pos}`}>
                              <line
                                x1={t.x1}
                                y1={t.y1}
                                x2={t.x2}
                                y2={t.y2}
                                stroke="var(--muted)"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <text
                                x={t.lx}
                                y={t.ly}
                                fontSize="10.5"
                                fontWeight="600"
                                fill="var(--muted)"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                {label}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                <div
                  style={{
                    marginTop: 12,
                    padding: '12px 14px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                  }}
                >
                  <div className="dash-eyebrow" style={{ marginBottom: 4 }}>What this means next</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
                    {buildFIInsight(metrics)}
                  </p>
                </div>
              </div>

              <div>
                <div style={{
                  background: 'var(--accent-50)',
                  border: '1px solid var(--accent-100)',
                  borderRadius: 'var(--r-lg)',
                  padding: 20,
                  marginBottom: 18,
                }}>
                  <div className="dash-eyebrow" style={{ color: 'var(--accent-700)' }}>Work Optional Index</div>
                  <div style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: 'var(--accent-700)',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: 4,
                  }}>
                    {Math.round(metrics.fiRatio)}%
                    <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.7, marginLeft: 6 }}>FI Ratio</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--accent-700)', opacity: 0.85, marginTop: 6 }}>
                    {metrics.isDrawdown
                      ? `${metrics.currentRunwayYears.toFixed(1)} years of runway at S$${Math.round(metrics.monthlyExpenses).toLocaleString('en-SG')}/mo spending`
                      : `S$${Math.round(metrics.requiredNestEgg).toLocaleString('en-SG')} nest egg needed by age ${metrics.targetAge}`}
                  </div>
                </div>

                {!metrics.isDrawdown && (
                  <div
                    style={{
                      marginBottom: 18,
                      padding: '14px 16px 16px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                    }}
                  >
                    <style>{`
                      .target-age-slider {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 100%;
                        height: 4px;
                        background: var(--slate-200);
                        border-radius: 2px;
                        outline: none;
                        margin: 0;
                      }
                      .target-age-slider::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 18px;
                        height: 18px;
                        background: var(--accent-500);
                        border: 3px solid white;
                        border-radius: 50%;
                        cursor: pointer;
                        box-shadow: 0 1px 4px rgba(99,91,255,0.35);
                        transition: transform 0.15s ease;
                      }
                      .target-age-slider::-webkit-slider-thumb:hover { transform: scale(1.1); }
                      .target-age-slider::-moz-range-thumb {
                        width: 18px;
                        height: 18px;
                        background: var(--accent-500);
                        border: 3px solid white;
                        border-radius: 50%;
                        cursor: pointer;
                        box-shadow: 0 1px 4px rgba(99,91,255,0.35);
                      }
                    `}</style>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <span className="dash-eyebrow">Target work-optional age</span>
                      <span
                        style={{
                          padding: '1px 7px',
                          background: targetAgeOverride != null
                            ? 'var(--accent-100)'
                            : metrics.targetAgeFromExtraction
                              ? 'var(--accent-100)'
                              : 'var(--slate-100)',
                          color: targetAgeOverride != null || metrics.targetAgeFromExtraction
                            ? 'var(--accent-700)'
                            : 'var(--muted)',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {targetAgeOverride != null
                          ? 'edited'
                          : metrics.targetAgeFromExtraction
                            ? 'from priorities'
                            : 'default'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 26,
                          fontWeight: 700,
                          color: 'var(--accent-700)',
                          letterSpacing: '-0.01em',
                          fontVariantNumeric: 'tabular-nums',
                          lineHeight: 1,
                        }}
                      >
                        {targetAgeOverride ?? metrics.targetAge}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                        years old · {Math.max(0, (targetAgeOverride ?? metrics.targetAge) - metrics.age)} years from now
                      </span>
                    </div>

                    <input
                      type="range"
                      min={metrics.age}
                      max={75}
                      step={1}
                      value={targetAgeOverride ?? metrics.targetAge}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isFinite(v)) return;
                        setTargetAgeOverride(Math.max(metrics.age, Math.min(75, v)));
                      }}
                      aria-label="Target work-optional age"
                      className="target-age-slider"
                    />

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 6,
                        fontSize: 11,
                        color: 'var(--subtle)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <span>now ({metrics.age})</span>
                      <span>75</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </section>

          {/* Key metrics */}
          <section className="dash-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 18 }}>
            {[
              { label: 'Net worth', value: formatCurrency(metrics.netWorth) },
              { label: 'Liquid assets', value: formatCurrency(metrics.liquidAssets) },
              { label: 'Monthly savings', value: formatCurrency(metrics.monthlySavings), tone: metrics.monthlySavings >= 0 ? 'pos' : 'neg' },
              { label: 'Debt ratio', value: `${metrics.debtRatio.toFixed(1)}%`, tone: metrics.debtRatio < 30 ? 'pos' : metrics.debtRatio < 50 ? 'warn' : 'neg' },
            ].map((stat) => (
              <div key={stat.label} className="dash-stat">
                <span className="dash-stat-label">{stat.label}</span>
                <span
                  className="dash-stat-value"
                  style={{
                    color:
                      stat.tone === 'pos'
                        ? 'var(--success-600)'
                        : stat.tone === 'neg'
                        ? 'var(--danger-600)'
                        : stat.tone === 'warn'
                        ? '#8a5a08'
                        : 'var(--text)',
                  }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </section>

          {/* Cashflow + Asset Allocation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
            <section className="dash-panel">
              <div className="dash-eyebrow" style={{ marginBottom: 18 }}>Monthly cashflow</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Income', value: formatCurrency(metrics.monthlyIncome) },
                  { label: 'Expenses', value: formatCurrency(metrics.monthlyExpenses) },
                  { label: 'Savings rate', value: `${metrics.savingsRate.toFixed(1)}%`, tone: metrics.savingsRate > 20 ? 'pos' : 'warn' },
                ].map((item, idx, arr) => (
                  <div key={item.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingBottom: 12,
                    borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item.label}</span>
                    <span style={{
                      fontSize: 15,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      color: item.tone === 'pos' ? 'var(--success-600)' : item.tone === 'warn' ? '#8a5a08' : 'var(--text)',
                    }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {assetBreakdown.length > 0 && (
              <section className="dash-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="dash-eyebrow" style={{ marginBottom: 12 }}>Asset allocation</div>
                <div style={{ flex: 1, minHeight: 160, marginBottom: 14 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={assetBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                        {assetBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {assetBreakdown.map((asset, idx) => (
                    <div key={asset.name} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12.5,
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: ASSET_COLORS[idx % ASSET_COLORS.length],
                        }} />
                        <span style={{ color: 'var(--muted)' }}>{asset.name}</span>
                      </span>
                      <span style={{ color: 'var(--text)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(asset.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <AdvisorsRead extractedData={extractedData} metrics={metrics} />

          <details
            style={{
              marginTop: 28,
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              background: 'var(--surface)',
              overflow: 'hidden',
            }}
          >
            <summary
              style={{
                listStyle: 'none',
                padding: '14px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                color: 'var(--muted)',
                fontWeight: 500,
                userSelect: 'none',
              }}
            >
              <ChevronRight size={14} strokeWidth={2.2} className="advisor-chevron" />
              <span>Show raw extracted data</span>
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--subtle)' }}>
                debug view — field-by-field check
              </span>
            </summary>
            <style>{`
              details[open] .advisor-chevron { transform: rotate(90deg); transition: transform 0.15s ease; }
              .advisor-chevron { transition: transform 0.15s ease; }
              summary::-webkit-details-marker { display: none; }
            `}</style>
            <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
              <RawExtractionTable data={extractedData} />
            </div>
          </details>
        </main>
      </div>
    </div>
  );
}
