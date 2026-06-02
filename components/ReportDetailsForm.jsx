'use client';

import { useState, useEffect } from 'react';
import {
  X as XIcon,
  Save,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const STORAGE_KEY = 'reportFormDraft';

const STEP_LABELS = ['Client', 'Portfolios', 'Branding'];

const PROVIDERS = [
  { value: '', label: 'Select provider' },
  { value: 'aia', label: 'AIA' },
  { value: 'etiqa', label: 'Etiqa' },
  { value: 'fame', label: 'FAME Advisory' },
  { value: 'fwd', label: 'FWD' },
  { value: 'hsbc-life', label: 'HSBC Life' },
  { value: 'income', label: 'Income' },
  { value: 'manulife', label: 'Manulife' },
  { value: 'singlife', label: 'Singlife' },
  { value: 'tokiomarine', label: 'Tokio Marine' },
  { value: 'other', label: 'Other' },
];

export default function ReportDetailsForm({
  clientName,
  holdingsSets = [],
  onGenerateReport,
  onCancel,
}) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  const [clientFullName, setClientFullName] = useState(clientName || '');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [primaryAdvisor, setPrimaryAdvisor] = useState('');
  const [secondaryAdvisor, setSecondaryAdvisor] = useState('');
  const [reportPeriod, setReportPeriod] = useState(new Date().toISOString().split('T')[0]);

  const [accountsData, setAccountsData] = useState(
    holdingsSets.map((set, idx) => ({
      id: set.id,
      name: set.name || `Portfolio ${idx + 1}`,
      policyNumber: '',
      startDate: new Date().toISOString().split('T')[0],
      inceptionDate: new Date().toISOString().split('T')[0],
      policyholderName: clientName || '',
      accountProvider: '',
      investmentType: 'lumpsum',
      initialCapital: '',
      totalTopUps: '',
      premiumFrequency: 'annual',
      premiumAmount: '',
      regularTopUps: '',
      regularWithdrawals: '',
      currentValuation: set.totalPortfolioValueSgd || 0,
    }))
  );

  const [companyName, setCompanyName] = useState('Leet Studio');
  const [confidentialityNotice, setConfidentialityNotice] = useState(
    'This document contains confidential information. Unauthorized use or distribution is prohibited.'
  );
  const [colorScheme, setColorScheme] = useState('dark-navy');

  // Load saved draft on mount (restore BEFORE auto-save runs)
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if ('step' in draft) setStep(draft.step);
        if ('clientFullName' in draft) setClientFullName(draft.clientFullName);
        if ('reportDate' in draft) setReportDate(draft.reportDate);
        if ('primaryAdvisor' in draft) setPrimaryAdvisor(draft.primaryAdvisor);
        if ('secondaryAdvisor' in draft) setSecondaryAdvisor(draft.secondaryAdvisor);
        if ('reportPeriod' in draft) setReportPeriod(draft.reportPeriod);
        if ('accountsData' in draft) setAccountsData(draft.accountsData);
        if ('companyName' in draft) setCompanyName(draft.companyName);
        if ('confidentialityNotice' in draft) setConfidentialityNotice(draft.confidentialityNotice);
        if ('colorScheme' in draft) setColorScheme(draft.colorScheme);
        setHasSavedDraft(true);
      } catch (err) {
        console.error('Error loading draft:', err);
      }
    }
  }, []);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSavedDraft(false);
  };

  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!clientFullName.trim()) newErrors.clientFullName = 'Client name is required';
      if (!primaryAdvisor.trim()) newErrors.primaryAdvisor = 'Primary advisor name is required';
    }

    if (stepNum === 2) {
      accountsData.forEach((account, idx) => {
        if (!account.name.trim()) newErrors[`account_${idx}_name`] = 'Account name is required';
        if (!account.policyholderName.trim())
          newErrors[`account_${idx}_policyholder`] = 'Policyholder name is required';
        if (!account.inceptionDate) newErrors[`account_${idx}_inception`] = 'Inception date is required';
        if (!account.currentValuation || account.currentValuation === 0) {
          newErrors[`account_${idx}_valuation`] = 'Current valuation is required';
        }
        if (account.investmentType === 'lumpsum') {
          if (!account.initialCapital && account.initialCapital !== 0) {
            newErrors[`account_${idx}_initialCapital`] = 'Initial capital is required';
          }
        } else if (account.investmentType === 'regular') {
          if (!account.premiumAmount && account.premiumAmount !== 0) {
            newErrors[`account_${idx}_premiumAmount`] = 'Premium amount is required';
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveDraft = () => {
    const formState = {
      step,
      clientFullName,
      reportDate,
      primaryAdvisor,
      secondaryAdvisor,
      reportPeriod,
      accountsData,
      companyName,
      confidentialityNotice,
      colorScheme,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
    setLastSaved(new Date());
    setHasSavedDraft(false);
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      saveDraft();
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => setStep(step - 1);

  const handleAccountChange = (idx, field, value) => {
    const updated = [...accountsData];
    updated[idx] = { ...updated[idx], [field]: value };
    setAccountsData(updated);
  };

  const calculateReturn = (account) => {
    if (!account.inceptionDate || !account.currentValuation) return null;

    const inceptionDate = new Date(account.inceptionDate);
    const reportDateObj = new Date(reportPeriod);
    const daysDiff = Math.floor((reportDateObj - inceptionDate) / (1000 * 60 * 60 * 24));
    const monthsDiff = daysDiff / 30.44;
    const yearsDiff = daysDiff / 365.25;

    if (yearsDiff <= 0) return null;

    let capitalInvested = 0;
    if (account.investmentType === 'lumpsum') {
      capitalInvested =
        (parseFloat(account.initialCapital) || 0) +
        (parseFloat(account.totalTopUps) || 0) -
        (parseFloat(account.regularWithdrawals) || 0);
    } else {
      const monthlyAmount =
        account.premiumFrequency === 'monthly'
          ? parseFloat(account.premiumAmount) || 0
          : (parseFloat(account.premiumAmount) || 0) / 12;
      capitalInvested =
        monthlyAmount * monthsDiff +
        (parseFloat(account.regularTopUps) || 0) -
        (parseFloat(account.regularWithdrawals) || 0);
    }

    const currentValue = parseFloat(account.currentValuation) || 0;
    const gain = currentValue - capitalInvested;
    const pAndLPercent = capitalInvested > 0 ? (gain / capitalInvested) * 100 : 0;
    const cagr =
      capitalInvested > 0 && yearsDiff > 0
        ? (Math.pow(currentValue / capitalInvested, 1 / yearsDiff) - 1) * 100
        : 0;

    return {
      capitalInvested: Math.round(capitalInvested),
      currentValue: Math.round(currentValue),
      gain: Math.round(gain),
      pAndL: isFinite(pAndLPercent) ? pAndLPercent.toFixed(2) : '0.00',
      cagr: isFinite(cagr) ? cagr.toFixed(2) : '0.00',
      years: isFinite(yearsDiff) ? yearsDiff.toFixed(1) : '0.0',
    };
  };

  const handleGenerateReport = () => {
    if (validateStep(step)) {
      const enrichedAccounts = accountsData.map((account) => {
        const returns = calculateReturn(account);
        return {
          ...account,
          investmentSummary:
            account.investmentType === 'lumpsum'
              ? `Lump Sum: Initial Capital SGD ${parseFloat(account.initialCapital || 0).toLocaleString()} + Top Ups SGD ${parseFloat(account.totalTopUps || 0).toLocaleString()}`
              : `Regular ${account.premiumFrequency === 'annual' ? 'Annual' : 'Monthly'} Premium: SGD ${parseFloat(account.premiumAmount || 0).toLocaleString()}${account.regularTopUps ? ` + Top Ups SGD ${parseFloat(account.regularTopUps).toLocaleString()}` : ''}${account.regularWithdrawals ? ` - Withdrawals SGD ${parseFloat(account.regularWithdrawals).toLocaleString()}` : ''}`,
          calculatedReturns: returns,
        };
      });

      const performance = accountsData.map((account) => {
        const returns = calculateReturn(account);
        return {
          inceptionDate: account.inceptionDate,
          currentValuation: parseFloat(account.currentValuation) || 0,
          capitalInvested: returns?.capitalInvested || 0,
          cagr: returns?.cagr || null,
        };
      });

      const reportData = {
        clientDetails: {
          fullName: clientFullName,
          reportDate,
          reportPeriod,
          primaryAdvisor,
          secondaryAdvisor: secondaryAdvisor || null,
        },
        accounts: enrichedAccounts,
        performance,
        branding: {
          companyName,
          confidentialityNotice,
          colorScheme,
        },
      };
      onGenerateReport(reportData);
      clearDraft();
    }
  };

  return (
    <div>
      <header className="dash-modal-head">
        <div className="dash-modal-head-titles">
          <h2>Generate report</h2>
          <p>Add the client and portfolio details we'll use to build the review.</p>
        </div>
        <button className="dash-modal-close" aria-label="Cancel" onClick={onCancel}>
          <XIcon size={16} strokeWidth={2.2} />
        </button>
      </header>

      <div className="dash-modal-body">
        <div className="dash-steps" aria-label="Wizard progress">
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const isCurrent = step === num;
            const isDone = step > num;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i === STEP_LABELS.length - 1 ? 0 : 1, gap: 12 }}>
                <div className={`dash-step ${isCurrent ? 'is-current' : ''} ${isDone ? 'is-done' : ''}`}>
                  <span className="dash-step-num">{isDone ? '✓' : num}</span>
                  <span>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && <span className="dash-step-line" />}
              </div>
            );
          })}
        </div>

        {hasSavedDraft && (
          <div className="dash-banner dash-banner-info">
            <span className="dash-banner-icon">
              <Info size={15} strokeWidth={2.2} />
            </span>
            <div style={{ flex: 1 }}>
              <strong>Draft restored.</strong> We loaded your last unsaved progress.{' '}
              <button className="dash-link" onClick={clearDraft} style={{ fontSize: 13.5 }}>
                Start fresh
              </button>
              .
            </div>
          </div>
        )}

        {lastSaved && !hasSavedDraft && (
          <div style={{ fontSize: 12, color: 'var(--success-600)', textAlign: 'right' }}>
            Saved at {lastSaved.toLocaleTimeString()}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="dash-grid-2">
              <div className="dash-field">
                <label className="dash-label" htmlFor="rf-name">Client full name *</label>
                <input
                  id="rf-name"
                  type="text"
                  className={`dash-input ${errors.clientFullName ? 'is-error' : ''}`}
                  value={clientFullName}
                  onChange={(e) => setClientFullName(e.target.value)}
                  placeholder="e.g., Jordan Tan"
                />
                {errors.clientFullName && <div className="dash-error">{errors.clientFullName}</div>}
              </div>

              <div className="dash-field">
                <label className="dash-label" htmlFor="rf-period">Report period (as of)</label>
                <input
                  id="rf-period"
                  type="date"
                  className="dash-input"
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                />
              </div>
            </div>

            <div className="dash-grid-2">
              <div className="dash-field">
                <label className="dash-label" htmlFor="rf-advisor1">Primary advisor *</label>
                <input
                  id="rf-advisor1"
                  type="text"
                  className={`dash-input ${errors.primaryAdvisor ? 'is-error' : ''}`}
                  value={primaryAdvisor}
                  onChange={(e) => setPrimaryAdvisor(e.target.value)}
                  placeholder="e.g., Jane Doe"
                />
                {errors.primaryAdvisor && <div className="dash-error">{errors.primaryAdvisor}</div>}
              </div>

              <div className="dash-field">
                <label className="dash-label" htmlFor="rf-advisor2">Secondary advisor</label>
                <input
                  id="rf-advisor2"
                  type="text"
                  className="dash-input"
                  value={secondaryAdvisor}
                  onChange={(e) => setSecondaryAdvisor(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {accountsData.map((account, idx) => {
              const returns = calculateReturn(account);
              const isLump = account.investmentType === 'lumpsum';
              return (
                <section key={account.id} className="dash-form-card">
                  <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div className="dash-eyebrow">Portfolio {idx + 1}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{account.name}</div>
                    </div>
                  </header>

                  <div className="dash-grid-2">
                    <div className="dash-field">
                      <label className="dash-label">Account name *</label>
                      <input
                        type="text"
                        className={`dash-input ${errors[`account_${idx}_name`] ? 'is-error' : ''}`}
                        value={account.name}
                        onChange={(e) => handleAccountChange(idx, 'name', e.target.value)}
                        placeholder="e.g., HSBC Wealth Treasure"
                      />
                      {errors[`account_${idx}_name`] && (
                        <div className="dash-error">{errors[`account_${idx}_name`]}</div>
                      )}
                    </div>
                    <div className="dash-field">
                      <label className="dash-label">Policy / account number</label>
                      <input
                        type="text"
                        className="dash-input"
                        value={account.policyNumber}
                        onChange={(e) => handleAccountChange(idx, 'policyNumber', e.target.value)}
                        placeholder="e.g., ABC123456"
                      />
                    </div>
                  </div>

                  <div className="dash-grid-2">
                    <div className="dash-field">
                      <label className="dash-label">Policyholder name *</label>
                      <input
                        type="text"
                        className={`dash-input ${errors[`account_${idx}_policyholder`] ? 'is-error' : ''}`}
                        value={account.policyholderName}
                        onChange={(e) => handleAccountChange(idx, 'policyholderName', e.target.value)}
                      />
                      {errors[`account_${idx}_policyholder`] && (
                        <div className="dash-error">{errors[`account_${idx}_policyholder`]}</div>
                      )}
                    </div>
                    <div className="dash-field">
                      <label className="dash-label">Account provider</label>
                      <select
                        className="dash-select"
                        value={account.accountProvider}
                        onChange={(e) => handleAccountChange(idx, 'accountProvider', e.target.value)}
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="dash-field">
                    <label className="dash-label">Investment type</label>
                    <div className="dash-segmented" role="radiogroup">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isLump}
                        className={`dash-segmented-option ${isLump ? 'is-active' : ''}`}
                        onClick={() => handleAccountChange(idx, 'investmentType', 'lumpsum')}
                      >
                        Lump sum
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={!isLump}
                        className={`dash-segmented-option ${!isLump ? 'is-active' : ''}`}
                        onClick={() => handleAccountChange(idx, 'investmentType', 'regular')}
                      >
                        Regular subscription
                      </button>
                    </div>
                  </div>

                  {isLump && (
                    <div className="dash-fieldset">
                      <div className="dash-fieldset-title">Lump sum details</div>
                      <div className="dash-grid-2">
                        <div className="dash-field">
                          <label className="dash-label">Initial capital (SGD) *</label>
                          <input
                            type="number"
                            className={`dash-input ${errors[`account_${idx}_initialCapital`] ? 'is-error' : ''}`}
                            value={account.initialCapital === null || account.initialCapital === undefined ? '' : account.initialCapital}
                            onChange={(e) => handleAccountChange(idx, 'initialCapital', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                            placeholder="e.g., 100000"
                          />
                          {errors[`account_${idx}_initialCapital`] && (
                            <div className="dash-error">{errors[`account_${idx}_initialCapital`]}</div>
                          )}
                        </div>
                        <div className="dash-field">
                          <label className="dash-label">Total top-ups (SGD)</label>
                          <input
                            type="number"
                            className="dash-input"
                            value={account.totalTopUps === null || account.totalTopUps === undefined ? '' : account.totalTopUps}
                            onChange={(e) => handleAccountChange(idx, 'totalTopUps', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                            placeholder="e.g., 50000"
                          />
                          <div style={{ fontSize: 11.5, color: 'var(--subtle)' }}>Sum of additional contributions.</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isLump && (
                    <div className="dash-fieldset">
                      <div className="dash-fieldset-title">Regular subscription details</div>
                      <div className="dash-grid-2">
                        <div className="dash-field">
                          <label className="dash-label">Premium frequency</label>
                          <select
                            className="dash-select"
                            value={account.premiumFrequency}
                            onChange={(e) => handleAccountChange(idx, 'premiumFrequency', e.target.value)}
                          >
                            <option value="annual">Annual</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        <div className="dash-field">
                          <label className="dash-label">Premium amount (SGD) *</label>
                          <input
                            type="number"
                            className={`dash-input ${errors[`account_${idx}_premiumAmount`] ? 'is-error' : ''}`}
                            value={account.premiumAmount === null || account.premiumAmount === undefined ? '' : account.premiumAmount}
                            onChange={(e) => handleAccountChange(idx, 'premiumAmount', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                            placeholder={account.premiumFrequency === 'annual' ? 'e.g., 12000' : 'e.g., 1000'}
                          />
                          {errors[`account_${idx}_premiumAmount`] && (
                            <div className="dash-error">{errors[`account_${idx}_premiumAmount`]}</div>
                          )}
                        </div>
                      </div>
                      <div className="dash-grid-2">
                        <div className="dash-field">
                          <label className="dash-label">Top-ups (SGD)</label>
                          <input
                            type="number"
                            className="dash-input"
                            value={account.regularTopUps === null || account.regularTopUps === undefined ? '' : account.regularTopUps}
                            onChange={(e) => handleAccountChange(idx, 'regularTopUps', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                            placeholder="e.g., 10000"
                          />
                        </div>
                        <div className="dash-field">
                          <label className="dash-label">Withdrawals (SGD)</label>
                          <input
                            type="number"
                            className="dash-input"
                            value={account.regularWithdrawals === null || account.regularWithdrawals === undefined ? '' : account.regularWithdrawals}
                            onChange={(e) => handleAccountChange(idx, 'regularWithdrawals', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                            placeholder="e.g., 5000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="dash-fieldset">
                    <div className="dash-fieldset-title">Performance period &amp; valuation</div>
                    <div className="dash-grid-2">
                      <div className="dash-field">
                        <label className="dash-label">Inception date *</label>
                        <input
                          type="date"
                          className={`dash-input ${errors[`account_${idx}_inception`] ? 'is-error' : ''}`}
                          value={account.inceptionDate}
                          onChange={(e) => handleAccountChange(idx, 'inceptionDate', e.target.value)}
                        />
                        {errors[`account_${idx}_inception`] && (
                          <div className="dash-error">{errors[`account_${idx}_inception`]}</div>
                        )}
                      </div>
                      <div className="dash-field">
                        <label className="dash-label">Current valuation (SGD) *</label>
                        <input
                          type="number"
                          className={`dash-input ${errors[`account_${idx}_valuation`] ? 'is-error' : ''}`}
                          value={account.currentValuation === null || account.currentValuation === undefined || account.currentValuation === 0 ? '' : account.currentValuation}
                          onChange={(e) => handleAccountChange(idx, 'currentValuation', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                          placeholder="e.g., 125000"
                        />
                        {errors[`account_${idx}_valuation`] && (
                          <div className="dash-error">{errors[`account_${idx}_valuation`]}</div>
                        )}
                      </div>
                    </div>

                    {returns && (
                      <div>
                        <div className="dash-eyebrow" style={{ marginBottom: 6 }}>
                          Auto-calculated · {returns.years} yrs
                        </div>
                        <div className="dash-returns">
                          <div className="dash-returns-cell">
                            <span className="dash-returns-label">Capital invested</span>
                            <span className="dash-returns-value">SGD {returns.capitalInvested.toLocaleString()}</span>
                          </div>
                          <div className="dash-returns-cell">
                            <span className="dash-returns-label">Current value</span>
                            <span className="dash-returns-value">SGD {returns.currentValue.toLocaleString()}</span>
                          </div>
                          <div className="dash-returns-cell">
                            <span className="dash-returns-label">P&amp;L</span>
                            <span className={`dash-returns-value ${parseFloat(returns.pAndL) >= 0 ? 'is-pos' : 'is-neg'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {parseFloat(returns.pAndL) >= 0 ? <TrendingUp size={12} strokeWidth={2.4} /> : <TrendingDown size={12} strokeWidth={2.4} />}
                              {returns.pAndL}%
                            </span>
                          </div>
                          <div className="dash-returns-cell">
                            <span className="dash-returns-label">CAGR</span>
                            <span className={`dash-returns-value ${parseFloat(returns.cagr) >= 0 ? 'is-pos' : 'is-neg'}`}>
                              {returns.cagr}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <>
            <div className="dash-field">
              <label className="dash-label" htmlFor="rf-company">Company name</label>
              <input
                id="rf-company"
                type="text"
                className="dash-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="dash-field">
              <label className="dash-label" htmlFor="rf-confid">Confidentiality notice</label>
              <textarea
                id="rf-confid"
                className="dash-textarea"
                value={confidentialityNotice}
                onChange={(e) => setConfidentialityNotice(e.target.value)}
                rows={3}
              />
            </div>

            <div className="dash-field">
              <label className="dash-label" htmlFor="rf-color">Color scheme</label>
              <select
                id="rf-color"
                className="dash-select"
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
              >
                <option value="dark-navy">Dark navy (premium)</option>
                <option value="light-professional">Light professional</option>
                <option value="modern-blue">Modern blue</option>
              </select>
            </div>

            <div className="dash-banner dash-banner-info">
              <span className="dash-banner-icon">
                <Info size={15} strokeWidth={2.2} />
              </span>
              <span>These settings apply to the generated report. You can change them later.</span>
            </div>
          </>
        )}

        {errors.allocation && (
          <div className="dash-banner dash-banner-danger">
            <span className="dash-banner-icon">
              <AlertCircle size={15} strokeWidth={2.2} />
            </span>
            <span>{errors.allocation}</span>
          </div>
        )}
      </div>

      <footer className="dash-modal-foot">
        <button className="dash-btn dash-btn-ghost" onClick={saveDraft} title="Save your progress so far">
          <Save size={14} strokeWidth={2.2} />
          Save draft
        </button>
        <div className="dash-modal-foot-end">
          <button className="dash-btn dash-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          {step > 1 && (
            <button className="dash-btn dash-btn-ghost" onClick={handlePrevStep}>
              <ArrowLeft size={14} strokeWidth={2.2} />
              Back
            </button>
          )}
          {step < 3 && (
            <button className="dash-btn dash-btn-primary" onClick={handleNextStep}>
              Continue
              <ArrowRight size={14} strokeWidth={2.4} />
            </button>
          )}
          {step === 3 && (
            <button className="dash-btn dash-btn-generate" onClick={handleGenerateReport}>
              <Sparkles size={14} strokeWidth={2.2} />
              Generate report
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
