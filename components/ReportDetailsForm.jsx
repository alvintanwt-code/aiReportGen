'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'reportFormDraft';

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

  // Step 1: Client & Report Details
  const [clientFullName, setClientFullName] = useState(clientName || '');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [primaryAdvisor, setPrimaryAdvisor] = useState('');
  const [secondaryAdvisor, setSecondaryAdvisor] = useState('');
  const [reportPeriod, setReportPeriod] = useState(new Date().toISOString().split('T')[0]);

  // Step 2: Account Information (repeatable per holdings set)
  const [accountsData, setAccountsData] = useState(
    holdingsSets.map((set, idx) => ({
      id: set.id,
      name: set.name || `Portfolio ${idx + 1}`,
      policyNumber: '',
      startDate: new Date().toISOString().split('T')[0],
      inceptionDate: new Date().toISOString().split('T')[0],
      policyholderName: clientName || '',
      accountProvider: '',
      // Investment Type
      investmentType: 'lumpsum', // 'lumpsum' or 'regular'
      // Lump Sum fields
      initialCapital: '',
      totalTopUps: '',
      // Regular Subscription fields
      premiumFrequency: 'annual', // 'annual' or 'monthly'
      premiumAmount: '',
      regularTopUps: '',
      regularWithdrawals: '',
      // Current valuation for return calculation
      currentValuation: set.totalPortfolioValueSgd || 0,
    }))
  );

  // Step 3: Branding/Customization (formerly Step 4)
  const [companyName, setCompanyName] = useState('Leet Advisor');
  const [confidentialityNotice, setConfidentialityNotice] = useState(
    'This document contains confidential information. Unauthorized use or distribution is prohibited.'
  );
  const [colorScheme, setColorScheme] = useState('dark-navy');

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setHasSavedDraft(true);
      } catch (err) {
        console.error('Error loading draft:', err);
      }
    }
  }, []);

  // Auto-save form state to localStorage whenever it changes
  useEffect(() => {
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
  }, [step, clientFullName, reportDate, primaryAdvisor, secondaryAdvisor, reportPeriod, accountsData, companyName, confidentialityNotice, colorScheme]);

  const loadDraft = () => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setStep(draft.step || 1);
        setClientFullName(draft.clientFullName || '');
        setReportDate(draft.reportDate || new Date().toISOString().split('T')[0]);
        setPrimaryAdvisor(draft.primaryAdvisor || '');
        setSecondaryAdvisor(draft.secondaryAdvisor || '');
        setReportPeriod(draft.reportPeriod || new Date().toISOString().split('T')[0]);
        setAccountsData(draft.accountsData || accountsData);
        setCompanyName(draft.companyName || 'Leet Advisor');
        setConfidentialityNotice(draft.confidentialityNotice || 'This document contains confidential information. Unauthorized use or distribution is prohibited.');
        setColorScheme(draft.colorScheme || 'dark-navy');
      } catch (err) {
        console.error('Error loading draft:', err);
      }
    }
  };

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
        if (!account.policyholderName.trim()) newErrors[`account_${idx}_policyholder`] = 'Policyholder name is required';
        if (!account.inceptionDate) newErrors[`account_${idx}_inception`] = 'Inception date is required';
        if (!account.currentValuation || account.currentValuation === 0) {
          newErrors[`account_${idx}_valuation`] = 'Current valuation is required';
        }

        // Validate investment-type-specific fields
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

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleAccountChange = (idx, field, value) => {
    const updated = [...accountsData];
    updated[idx] = { ...updated[idx], [field]: value };
    setAccountsData(updated);
  };

  const calculateReturn = (account) => {
    if (!account.inceptionDate || !account.currentValuation) return null;

    const inceptionDate = new Date(account.inceptionDate);
    const reportDate = new Date(reportPeriod);
    const daysDiff = Math.floor((reportDate - inceptionDate) / (1000 * 60 * 60 * 24));
    const monthsDiff = daysDiff / 30.44;
    const yearsDiff = daysDiff / 365.25;

    if (yearsDiff <= 0) return null;

    // Calculate capital invested (auto-calculated from contributions)
    let capitalInvested = 0;
    if (account.investmentType === 'lumpsum') {
      // Lump sum: initial capital + top-ups - withdrawals
      capitalInvested = (parseFloat(account.initialCapital) || 0) +
                       (parseFloat(account.totalTopUps) || 0) -
                       (parseFloat(account.regularWithdrawals) || 0);
    } else {
      // Regular subscription: monthly/annual contribution × months + top-ups - withdrawals
      const monthlyAmount = account.premiumFrequency === 'monthly'
        ? (parseFloat(account.premiumAmount) || 0)
        : (parseFloat(account.premiumAmount) || 0) / 12;
      capitalInvested = (monthlyAmount * monthsDiff) +
                       (parseFloat(account.regularTopUps) || 0) -
                       (parseFloat(account.regularWithdrawals) || 0);
    }

    const currentValue = parseFloat(account.currentValuation) || 0;
    const gain = currentValue - capitalInvested;

    // P&L % = (Profit & Loss / Capital Invested) × 100
    const pAndLPercent = capitalInvested > 0 ? (gain / capitalInvested) * 100 : 0;

    // Simple CAGR calculation
    const cagr = capitalInvested > 0 && yearsDiff > 0
      ? (Math.pow(currentValue / capitalInvested, 1 / yearsDiff) - 1) * 100
      : 0;

    return {
      capitalInvested: Math.round(capitalInvested),
      currentValue: Math.round(currentValue),
      gain: Math.round(gain),
      pAndL: pAndLPercent.toFixed(2),
      cagr: cagr.toFixed(2),
      years: yearsDiff.toFixed(1),
    };
  };

  const handleGenerateReport = () => {
    if (validateStep(step)) {
      // Prepare comprehensive account data with investment details and auto-calculated returns
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

      // Create performance array from account data
      const performance = accountsData.map((account) => ({
        inceptionDate: account.inceptionDate,
        currentValuation: parseFloat(account.currentValuation) || 0,
        cagr: calculateReturn(account)?.cagr || null,
      }));

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
      // Clear the saved draft after successful generation
      clearDraft();
    }
  };

  return (
    <div style={{
      padding: '32px',
      maxWidth: '800px',
      margin: '0 auto',
    }}>
      {/* Resume Draft Banner */}
      {hasSavedDraft && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffc107',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#856404' }}>
              📝 Draft Saved
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#856404' }}>
              You have an unsaved form. Would you like to resume from where you left off?
              {lastSaved && ` (Last saved: ${lastSaved.toLocaleTimeString()})`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={loadDraft}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffc107',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#ffb300')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#ffc107')}
            >
              Resume
            </button>
            <button
              onClick={clearDraft}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#856404',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}

      {/* Last Saved Indicator */}
      {lastSaved && !hasSavedDraft && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#e8f5e9',
          borderRadius: '6px',
          marginBottom: '24px',
          fontSize: '12px',
          color: '#2e7d32',
          textAlign: 'right',
        }}>
          ✓ Auto-saved at {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* Step 1: Client & Report Details */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>
            Client & Report Details
          </h2>
          <p style={{ color: '#666', margin: '0 0 20px 0' }}>Step 1 of 3</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Client Full Name *
            </label>
            <input
              type="text"
              value={clientFullName}
              onChange={(e) => setClientFullName(e.target.value)}
              placeholder="e.g., John Smith"
              style={{
                padding: '12px 16px',
                fontSize: '15px',
                border: `1px solid ${errors.clientFullName ? '#dc3545' : '#ddd'}`,
                borderRadius: '8px',
                outline: 'none',
              }}
            />
            {errors.clientFullName && (
              <p style={{ color: '#dc3545', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.clientFullName}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Report Period (As of)
            </label>
            <input
              type="date"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              style={{
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Primary Advisor Name *
            </label>
            <input
              type="text"
              value={primaryAdvisor}
              onChange={(e) => setPrimaryAdvisor(e.target.value)}
              placeholder="e.g., Jane Doe"
              style={{
                padding: '12px 16px',
                fontSize: '15px',
                border: `1px solid ${errors.primaryAdvisor ? '#dc3545' : '#ddd'}`,
                borderRadius: '8px',
                outline: 'none',
              }}
            />
            {errors.primaryAdvisor && (
              <p style={{ color: '#dc3545', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.primaryAdvisor}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Secondary Advisor Name (Optional)
            </label>
            <input
              type="text"
              value={secondaryAdvisor}
              onChange={(e) => setSecondaryAdvisor(e.target.value)}
              placeholder="e.g., Mark Wilson"
              style={{
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
              }}
            />
          </div>
        </div>
      )}

      {/* Step 2: Account Information */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>
            Portfolio Accounts & Performance
          </h2>
          <p style={{ color: '#666', margin: '0 0 20px 0' }}>Step 2 of 3</p>

          {accountsData.map((account, idx) => (
            <div
              key={account.id}
              style={{
                padding: '20px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #eee',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
                Portfolio {idx + 1}: {account.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Account Name *
                </label>
                <input
                  type="text"
                  value={account.name}
                  onChange={(e) => handleAccountChange(idx, 'name', e.target.value)}
                  placeholder="e.g., HSBC Wealth Treasure"
                  style={{
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: `1px solid ${errors[`account_${idx}_name`] ? '#dc3545' : '#ddd'}`,
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
                {errors[`account_${idx}_name`] && (
                  <p style={{ color: '#dc3545', fontSize: '12px', margin: '4px 0 0 0' }}>
                    {errors[`account_${idx}_name`]}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Policy/Account Number
                </label>
                <input
                  type="text"
                  value={account.policyNumber}
                  onChange={(e) => handleAccountChange(idx, 'policyNumber', e.target.value)}
                  placeholder="e.g., ABC123456"
                  style={{
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Policyholder Name *
                </label>
                <input
                  type="text"
                  value={account.policyholderName}
                  onChange={(e) => handleAccountChange(idx, 'policyholderName', e.target.value)}
                  placeholder="e.g., John Smith"
                  style={{
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: `1px solid ${errors[`account_${idx}_policyholder`] ? '#dc3545' : '#ddd'}`,
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                />
                {errors[`account_${idx}_policyholder`] && (
                  <p style={{ color: '#dc3545', fontSize: '12px', margin: '4px 0 0 0' }}>
                    {errors[`account_${idx}_policyholder`]}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Account Provider
                </label>
                <select
                  value={account.accountProvider}
                  onChange={(e) => handleAccountChange(idx, 'accountProvider', e.target.value)}
                  style={{
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    outline: 'none',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="">Select Provider</option>
                  <option value="aia">AIA</option>
                  <option value="etiqa">Etiqa</option>
                  <option value="fame">FAME Advisory</option>
                  <option value="fwd">FWD</option>
                  <option value="hsbc-life">HSBC Life</option>
                  <option value="income">Income</option>
                  <option value="manulife">Manulife</option>
                  <option value="singlife">Singlife</option>
                  <option value="tokiomarine">Tokiomarine</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Investment Type Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Investment Type *
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="radio"
                      name={`investmentType_${idx}`}
                      value="lumpsum"
                      checked={account.investmentType === 'lumpsum'}
                      onChange={(e) => handleAccountChange(idx, 'investmentType', e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    Lump Sum
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="radio"
                      name={`investmentType_${idx}`}
                      value="regular"
                      checked={account.investmentType === 'regular'}
                      onChange={(e) => handleAccountChange(idx, 'investmentType', e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    Regular Subscription
                  </label>
                </div>
              </div>

              {/* LUMP SUM Fields */}
              {account.investmentType === 'lumpsum' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', padding: '16px', backgroundColor: '#e8f4f8', borderRadius: '8px', borderLeft: '4px solid #0288d1' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                      Initial Capital (SGD) *
                    </label>
                    <input
                      type="number"
                      value={account.initialCapital}
                      onChange={(e) => handleAccountChange(idx, 'initialCapital', parseFloat(e.target.value) || '')}
                      placeholder="e.g., 100000"
                      style={{
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: `1px solid ${errors[`account_${idx}_initialCapital`] ? '#dc3545' : '#ddd'}`,
                        borderRadius: '8px',
                        outline: 'none',
                      }}
                    />
                    {errors[`account_${idx}_initialCapital`] && (
                      <p style={{ color: '#dc3545', fontSize: '12px', margin: '4px 0 0 0' }}>
                        {errors[`account_${idx}_initialCapital`]}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                      Total Top Ups (SGD)
                    </label>
                    <input
                      type="number"
                      value={account.totalTopUps}
                      onChange={(e) => handleAccountChange(idx, 'totalTopUps', parseFloat(e.target.value) || '')}
                      placeholder="e.g., 50000"
                      style={{
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        outline: 'none',
                      }}
                    />
                    <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>
                      Total of all additional contributions
                    </p>
                  </div>
                </div>
              )}

              {/* REGULAR SUBSCRIPTION Fields */}
              {account.investmentType === 'regular' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px', padding: '16px', backgroundColor: '#f0e8f4', borderRadius: '8px', borderLeft: '4px solid #9b59b6' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        Premium Frequency
                      </label>
                      <select
                        value={account.premiumFrequency}
                        onChange={(e) => handleAccountChange(idx, 'premiumFrequency', e.target.value)}
                        style={{
                          padding: '12px 16px',
                          fontSize: '15px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          outline: 'none',
                          backgroundColor: 'white',
                        }}
                      >
                        <option value="annual">Annual</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        Premium Amount (SGD) *
                      </label>
                      <input
                        type="number"
                        value={account.premiumAmount}
                        onChange={(e) => handleAccountChange(idx, 'premiumAmount', parseFloat(e.target.value) || '')}
                        placeholder={account.premiumFrequency === 'annual' ? 'e.g., 12000' : 'e.g., 1000'}
                        style={{
                          padding: '12px 16px',
                          fontSize: '15px',
                          border: `1px solid ${errors[`account_${idx}_premiumAmount`] ? '#dc3545' : '#ddd'}`,
                          borderRadius: '8px',
                          outline: 'none',
                        }}
                      />
                      {errors[`account_${idx}_premiumAmount`] && (
                        <p style={{ color: '#dc3545', fontSize: '12px', margin: '4px 0 0 0' }}>
                          {errors[`account_${idx}_premiumAmount`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        Any Top Ups (SGD)
                      </label>
                      <input
                        type="number"
                        value={account.regularTopUps}
                        onChange={(e) => handleAccountChange(idx, 'regularTopUps', parseFloat(e.target.value) || '')}
                        placeholder="e.g., 10000"
                        style={{
                          padding: '12px 16px',
                          fontSize: '15px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        Any Withdrawals (SGD)
                      </label>
                      <input
                        type="number"
                        value={account.regularWithdrawals}
                        onChange={(e) => handleAccountChange(idx, 'regularWithdrawals', parseFloat(e.target.value) || '')}
                        placeholder="e.g., 5000"
                        style={{
                          padding: '12px 16px',
                          fontSize: '15px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Inception Date & Current Valuation */}
              <div style={{
                padding: '16px',
                backgroundColor: '#e8f4f8',
                borderRadius: '8px',
                borderLeft: '4px solid #0288d1',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#01579b' }}>
                  Performance Period & Valuation
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                      Inception Date *
                    </label>
                    <input
                      type="date"
                      value={account.inceptionDate}
                      onChange={(e) => handleAccountChange(idx, 'inceptionDate', e.target.value)}
                      style={{
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: `1px solid ${errors[`account_${idx}_inception`] ? '#dc3545' : '#ddd'}`,
                        borderRadius: '8px',
                        outline: 'none',
                      }}
                    />
                    {errors[`account_${idx}_inception`] && (
                      <p style={{ color: '#dc3545', fontSize: '12px', margin: '4px 0 0 0' }}>
                        {errors[`account_${idx}_inception`]}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                      Current Valuation (SGD) *
                    </label>
                    <input
                      type="number"
                      value={account.currentValuation}
                      onChange={(e) => handleAccountChange(idx, 'currentValuation', parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 125000"
                      style={{
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: `1px solid ${errors[`account_${idx}_valuation`] ? '#dc3545' : '#ddd'}`,
                        borderRadius: '8px',
                        outline: 'none',
                      }}
                    />
                    {errors[`account_${idx}_valuation`] && (
                      <p style={{ color: '#dc3545', fontSize: '12px', margin: '4px 0 0 0' }}>
                        {errors[`account_${idx}_valuation`]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Auto-calculated returns preview */}
                {calculateReturn(account) && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #b3e5fc',
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#01579b' }}>
                      📊 Auto-calculated Returns (from {account.inceptionDate})
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                      <div>
                        <p style={{ margin: '0', color: '#666' }}>Capital Invested</p>
                        <p style={{ margin: '0', fontWeight: '600', color: '#1a1a1a' }}>
                          SGD {calculateReturn(account).capitalInvested.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0', color: '#666' }}>Current Value</p>
                        <p style={{ margin: '0', fontWeight: '600', color: '#1a1a1a' }}>
                          SGD {calculateReturn(account).currentValue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0', color: '#666' }}>Profit & Loss %</p>
                        <p style={{ margin: '0', fontWeight: '600', color: parseFloat(calculateReturn(account).pAndL) >= 0 ? '#2e7d32' : '#dc3545' }}>
                          {calculateReturn(account).pAndL}%
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: '0', color: '#666' }}>CAGR</p>
                        <p style={{ margin: '0', fontWeight: '600', color: parseFloat(calculateReturn(account).cagr) >= 0 ? '#2e7d32' : '#dc3545' }}>
                          {calculateReturn(account).cagr}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Branding & Customization */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>
            Report Branding
          </h2>
          <p style={{ color: '#666', margin: '0 0 20px 0' }}>Step 3 of 3 (Optional)</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              style={{
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Confidentiality Notice
            </label>
            <textarea
              value={confidentialityNotice}
              onChange={(e) => setConfidentialityNotice(e.target.value)}
              rows="3"
              style={{
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
              Color Scheme
            </label>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
              style={{
                padding: '12px 16px',
                fontSize: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
                backgroundColor: 'white',
              }}
            >
              <option value="dark-navy">Dark Navy (Premium)</option>
              <option value="light-professional">Light Professional</option>
              <option value="modern-blue">Modern Blue</option>
            </select>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#f0f4f8',
            borderRadius: '8px',
            borderLeft: '4px solid #666',
          }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#333' }}>
              ℹ️ These settings apply to your generated report. You can modify them later if needed.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '40px',
          justifyContent: 'flex-end',
        }}
      >
        {step > 1 && (
          <button
            onClick={handlePrevStep}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#f0f0f0')}
          >
            Back
          </button>
        )}

        {step < 3 && (
          <button
            onClick={handleNextStep}
            style={{
              padding: '12px 24px',
              backgroundColor: '#FFA366',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#FF8F44')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#FFA366')}
          >
            Next
          </button>
        )}

        {step === 3 && (
          <button
            onClick={handleGenerateReport}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#218838')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#28a745')}
          >
            Generate Report
          </button>
        )}

        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#999';
            e.target.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#ddd';
            e.target.style.color = '#666';
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
