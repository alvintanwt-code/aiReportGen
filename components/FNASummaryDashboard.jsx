'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
  Area,
  AreaChart,
} from 'recharts';
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

function computeFIMetrics(extractedData, overrideTargetAge, overrides = {}) {
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

  // Monthly investment = "Regular Investment (Cash)" line from FNA. This is
  // wealth-building cash actually being directed to investments — distinct
  // from total savings (income − expenses), which is the *ceiling* if all
  // surplus were redirected. Override lets the advisor stress-test what-if.
  const extractedMonthlyInvestment = extractedData.cashflow?.netInvestmentRSP || 0;
  const monthlyInvestment = overrides.monthlyInvestment != null
    ? overrides.monthlyInvestment
    : extractedMonthlyInvestment;
  const annualInvestmentActual = Math.max(0, monthlyInvestment * 12);

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

  // Honest projection — uses actual annual investment contribution, not the
  // theoretical "could be invested if all surplus redirected" ceiling.
  let projectedLiquidAtTarget;
  let projectedLiquidAtTargetUpside;
  if (isDrawdown) {
    projectedLiquidAtTarget = nonCPFLiquid;
    projectedLiquidAtTargetUpside = nonCPFLiquid;
  } else {
    const growthFactor = Math.pow(1 + BLENDED_RETURN, yearsToTarget);
    const annuityFactor = (growthFactor - 1) / BLENDED_RETURN;
    projectedLiquidAtTarget = nonCPFLiquid * growthFactor + annualInvestmentActual * annuityFactor;
    projectedLiquidAtTargetUpside = nonCPFLiquid * growthFactor + annualSavings * annuityFactor;
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
    monthlyInvestment,
    monthlyInvestmentFromExtraction: extractedMonthlyInvestment,
    annualExpenses,
    annualSavings,            // ceiling: income − expenses
    annualInvestmentActual,   // honest: what's actually flowing to investments
    nonCPFLiquid,
    cpfRetirement,
    projectedCPFAtPayout,
    annualCPFLifeIncome,
    projectedLiquidAtTarget,         // honest projection
    projectedLiquidAtTargetUpside,   // potential ceiling
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

/**
 * Build the asset progression line for the hero chart.
 *
 * Returns an array of points from currentAge to endAge. Each point compounds at
 * the blended return rate. While age < drawdownAge, the annual contribution is
 * added each year (accumulation). After drawdownAge, the post-65 expense gap
 * (annualExpenses − CPF Life income) is withdrawn each year (drawdown).
 *
 * Used twice per render — once for the honest line (annualInvestmentActual),
 * once for the potential ceiling (annualSavings).
 */
function buildAssetProjection({
  currentAge,
  endAge,
  startingValue,
  annualContribution,
  drawdownAge,
  annualWithdrawal,
  cpfLifeStartAge,
  annualCPFLifeIncome,
}) {
  const r = BLENDED_RETURN;
  const points = [];
  let value = startingValue;
  for (let a = currentAge; a <= endAge; a++) {
    points.push({ age: a, value: Math.max(0, Math.round(value)) });
    // Step to next year: grow + (contribute or withdraw)
    value = value * (1 + r);
    if (a < drawdownAge) {
      value += annualContribution;
    } else {
      // After drawdown begins. CPF Life relieves the gap from cpfLifeStartAge onward.
      const cpfRelief = a >= cpfLifeStartAge ? annualCPFLifeIncome : 0;
      const netWithdraw = Math.max(0, annualWithdrawal - cpfRelief);
      value -= netWithdraw;
    }
    if (value < 0) value = 0;
  }
  return points;
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
  const [totalContributedOverride, setTotalContributedOverride] = useState(null);

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

  // Chart data — projects the portfolio forward, with drawdown after targetAge.
  // Returns two lines: honest (current pace) and potential (if all surplus invested).
  const chartData = useMemo(() => {
    const startingValue = metrics.nonCPFLiquid;
    const drawdownAge = metrics.targetAge;
    const endAge = 85;
    const honest = buildAssetProjection({
      currentAge: metrics.age,
      endAge,
      startingValue,
      annualContribution: metrics.annualInvestmentActual,
      drawdownAge,
      annualWithdrawal: metrics.annualExpenses,
      cpfLifeStartAge: CPF_LIFE_START_AGE,
      annualCPFLifeIncome: metrics.annualCPFLifeIncome,
    });
    const potential = buildAssetProjection({
      currentAge: metrics.age,
      endAge,
      startingValue,
      annualContribution: metrics.annualSavings,
      drawdownAge,
      annualWithdrawal: metrics.annualExpenses,
      cpfLifeStartAge: CPF_LIFE_START_AGE,
      annualCPFLifeIncome: metrics.annualCPFLifeIncome,
    });
    return honest.map((p, i) => ({
      age: p.age,
      honest: p.value,
      potential: potential[i]?.value || p.value,
    }));
  }, [metrics]);

  const chartDerived = useMemo(() => {
    const drawdownPoint = chartData.find((p) => p.age === metrics.targetAge);
    const projectedAtDrawdown = drawdownPoint ? drawdownPoint.honest : 0;
    const sustainPoint = chartData.find((p) => p.age > metrics.targetAge && p.honest <= 0);
    const sustainAge = sustainPoint ? sustainPoint.age : 85;
    const minAge = metrics.age;
    const maxAge = 85;
    const tickStep = 10;
    const xAxisTicks = [];
    for (let a = Math.ceil(minAge / tickStep) * tickStep; a <= maxAge; a += tickStep) {
      xAxisTicks.push(a);
    }
    if (!xAxisTicks.includes(metrics.targetAge)) xAxisTicks.push(metrics.targetAge);
    xAxisTicks.sort((a, b) => a - b);
    return { projectedAtDrawdown, sustainAge, xAxisTicks };
  }, [chartData, metrics.targetAge, metrics.age]);

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
  const formatCompact = (value) => {
    const n = Math.abs(value);
    if (n >= 1_000_000) return `S$${(value / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    if (n >= 1_000) return `S$${Math.round(value / 1_000)}k`;
    return `S$${Math.round(value)}`;
  };

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

          {/* Hero: Asset Progression — line chart with drawdown reference + dual contribution lines */}
          <section className="dash-panel" style={{ marginBottom: 18, padding: 28 }}>
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
            <div className="dash-eyebrow" style={{ marginBottom: 8 }}>Wealth trajectory</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <h2 className="dash-h2">Asset Progression</h2>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                Current liquid investments + projection to age 85, with drawdown
              </span>
            </div>

            {/* Three-up summary: current, projected, sustains */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24,
                marginBottom: 22,
                paddingBottom: 18,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <div className="dash-eyebrow">Current value</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', marginTop: 2 }}>
                  {formatCurrency(metrics.nonCPFLiquid)}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                  From FNA · cash + investments (excl. CPF, property)
                </div>
              </div>
              <div>
                <div className="dash-eyebrow">Projected at age {metrics.targetAge}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-700)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em', marginTop: 2 }}>
                  {formatCurrency(chartDerived.projectedAtDrawdown)}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                  At current pace · S${Math.round(metrics.monthlyInvestment).toLocaleString('en-SG')}/mo invested
                </div>
              </div>
              <div>
                <div className="dash-eyebrow">Sustains to age</div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: chartDerived.sustainAge >= 85 ? 'var(--success-600)' : 'var(--danger-600)',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.01em',
                    marginTop: 2,
                  }}
                >
                  {chartDerived.sustainAge >= 85 ? '85+' : chartDerived.sustainAge}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                  {chartDerived.sustainAge >= 85 ? 'Money outlives 85' : 'Funds depleted before life expectancy'}
                </div>
              </div>
            </div>

            {/* The chart */}
            <div style={{ width: '100%', height: 320, marginBottom: 14 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--slate-100)" vertical={false} />
                  <XAxis
                    dataKey="age"
                    type="number"
                    domain={[metrics.age, 85]}
                    ticks={chartDerived.xAxisTicks}
                    tick={{ fontSize: 11, fill: 'var(--muted)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--muted)' }}
                    tickFormatter={formatCompact}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(value),
                      name === 'honest' ? 'Current pace' : 'If all surplus invested',
                    ]}
                    labelFormatter={(age) => `Age ${age}`}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 12,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  />
                  <ReferenceLine
                    x={metrics.targetAge}
                    stroke="var(--accent-500)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Drawdown ${metrics.targetAge}`,
                      position: 'insideTopRight',
                      fontSize: 11,
                      fill: 'var(--accent-700)',
                      fontWeight: 600,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="potential"
                    stroke="#b3aeff"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                    isAnimationActive={false}
                    name="potential"
                  />
                  <Line
                    type="monotone"
                    dataKey="honest"
                    stroke="var(--accent-500)"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                    name="honest"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 18, fontSize: 12.5, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 22, height: 3, background: 'var(--accent-500)', borderRadius: 1 }} />
                <span style={{ color: 'var(--muted)' }}>
                  Current pace · S${Math.round(metrics.monthlyInvestment).toLocaleString('en-SG')}/mo invested
                </span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 22, borderTop: '2px dashed #b3aeff' }} />
                <span style={{ color: 'var(--muted)' }}>
                  If all surplus invested · S${Math.max(0, Math.round(metrics.monthlySavings)).toLocaleString('en-SG')}/mo ceiling
                </span>
              </span>
            </div>

            {/* Drawdown age slider */}
            <div
              style={{
                padding: '14px 16px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="dash-eyebrow">Drawdown begins at</span>
                <span
                  style={{
                    padding: '1px 7px',
                    background:
                      targetAgeOverride != null || metrics.targetAgeFromExtraction
                        ? 'var(--accent-100)'
                        : 'var(--slate-100)',
                    color:
                      targetAgeOverride != null || metrics.targetAgeFromExtraction
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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
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
                aria-label="Drawdown age"
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
          </section>

          {/* Key metrics — investment-focused. Total contributed is editable;
              profit/ROE derives from it. Net-worth / debt sit in cashflow below. */}
          <section className="dash-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 18 }}>
            {(() => {
              const currentValue = metrics.nonCPFLiquid;
              const totalContributed = totalContributedOverride;
              const hasContributed = totalContributed != null && totalContributed > 0;
              const profit = hasContributed ? currentValue - totalContributed : null;
              const roe = hasContributed && totalContributed > 0 ? (profit / totalContributed) * 100 : null;

              const profitTone = profit == null ? null : profit >= 0 ? 'pos' : 'neg';
              const tone = (t) =>
                t === 'pos'
                  ? 'var(--success-600)'
                  : t === 'neg'
                    ? 'var(--danger-600)'
                    : t === 'warn'
                      ? '#8a5a08'
                      : 'var(--text)';

              return (
                <>
                  <div className="dash-stat">
                    <span className="dash-stat-label">Monthly investment</span>
                    <span className="dash-stat-value">{formatCurrency(metrics.monthlyInvestment)}</span>
                  </div>

                  <div className="dash-stat">
                    <span className="dash-stat-label">Total contributed</span>
                    <input
                      type="number"
                      value={totalContributedOverride ?? ''}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setTotalContributedOverride(Number.isFinite(v) && v >= 0 ? v : null);
                      }}
                      placeholder="—"
                      aria-label="Total capital contributed"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                        fontFamily: 'inherit',
                        color: hasContributed ? 'var(--text)' : 'var(--subtle)',
                        fontVariantNumeric: 'tabular-nums',
                        width: '100%',
                        outline: 'none',
                      }}
                      className="dash-stat-value"
                    />
                  </div>

                  <div className="dash-stat">
                    <span className="dash-stat-label">Current value</span>
                    <span className="dash-stat-value">{formatCurrency(currentValue)}</span>
                  </div>

                  <div className="dash-stat">
                    <span className="dash-stat-label">Profit / ROE</span>
                    <span
                      className="dash-stat-value"
                      style={{ color: tone(profitTone) }}
                    >
                      {profit == null
                        ? '—'
                        : `${profit >= 0 ? '+' : '−'}${formatCurrency(Math.abs(profit))} · ${roe.toFixed(1)}%`}
                    </span>
                  </div>
                </>
              );
            })()}
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
