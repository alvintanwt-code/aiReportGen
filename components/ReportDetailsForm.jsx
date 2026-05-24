'use client';

import { useState } from 'react';

export default function ReportDetailsForm({
  clientName,
  holdingsSets = [],
  onGenerateReport,
  onCancel,
}) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

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
      policyholderName: clientName || '',
      initialCapital: '',
      accountProvider: '',
    }))
  );

  // Step 3: Performance Data
  const [performanceData, setPerformanceData] = useState(
    holdingsSets.map((set) => ({
      setId: set.id,
      inceptionDate: new Date().toISOString().split('T')[0],
      currentValuation: set.totalPortfolioValueSgd || 0,
      cagr: '',
      pAndL: '',
    }))
  );

  // Step 4: Branding/Customization
  const [companyName, setCompanyName] = useState('Leet Advisor');
  const [confidentialityNotice, setConfidentialityNotice] = useState(
    'This document contains confidential information. Unauthorized use or distribution is prohibited.'
  );
  const [colorScheme, setColorScheme] = useState('dark-navy');

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
      });
    }

    if (stepNum === 3) {
      performanceData.forEach((perf, idx) => {
        if (!perf.currentValuation || perf.currentValuation === 0) {
          newErrors[`perf_${idx}_valuation`] = 'Current valuation is required';
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

  const handlePerformanceChange = (idx, field, value) => {
    const updated = [...performanceData];
    updated[idx] = { ...updated[idx], [field]: value };
    setPerformanceData(updated);
  };

  const handleGenerateReport = () => {
    if (validateStep(step)) {
      const reportData = {
        clientDetails: {
          fullName: clientFullName,
          reportDate,
          reportPeriod,
          primaryAdvisor,
          secondaryAdvisor: secondaryAdvisor || null,
        },
        accounts: accountsData,
        performance: performanceData,
        branding: {
          companyName,
          confidentialityNotice,
          colorScheme,
        },
      };
      onGenerateReport(reportData);
    }
  };

  return (
    <div style={{
      padding: '32px',
      maxWidth: '800px',
      margin: '0 auto',
    }}>
      {/* Step 1: Client & Report Details */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>
            Client & Report Details
          </h2>
          <p style={{ color: '#666', margin: '0 0 20px 0' }}>Step 1 of 4</p>

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Report Date
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
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
            Portfolio Accounts
          </h2>
          <p style={{ color: '#666', margin: '0 0 20px 0' }}>Step 2 of 4</p>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                    Account Start Date
                  </label>
                  <input
                    type="date"
                    value={account.startDate}
                    onChange={(e) => handleAccountChange(idx, 'startDate', e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    Initial Capital (SGD)
                  </label>
                  <input
                    type="number"
                    value={account.initialCapital}
                    onChange={(e) => handleAccountChange(idx, 'initialCapital', parseFloat(e.target.value) || '')}
                    placeholder="e.g., 100000"
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
                    <option value="hsbc">HSBC</option>
                    <option value="tokio-marine">TOKIO MARINE</option>
                    <option value="philip-capital">PHILIP CAPITAL</option>
                    <option value="aia">AIA</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Performance Data */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>
            Performance Data
          </h2>
          <p style={{ color: '#666', margin: '0 0 20px 0' }}>Step 3 of 4</p>

          {performanceData.map((perf, idx) => (
            <div
              key={perf.setId}
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
                {accountsData[idx]?.name || `Portfolio ${idx + 1}`}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    Inception Date
                  </label>
                  <input
                    type="date"
                    value={perf.inceptionDate}
                    onChange={(e) => handlePerformanceChange(idx, 'inceptionDate', e.target.value)}
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
                    Current Valuation (SGD) *
                  </label>
                  <input
                    type="number"
                    value={perf.currentValuation}
                    onChange={(e) => handlePerformanceChange(idx, 'currentValuation', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 125000"
                    style={{
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: `1px solid ${errors[`perf_${idx}_valuation`] ? '#dc3545' : '#ddd'}`,
                      borderRadius: '8px',
                      outline: 'none',
                    }}
                  />
                  {errors[`perf_${idx}_valuation`] && (
                    <p style={{ color: '#dc3545', fontSize: '12px', margin: '4px 0 0 0' }}>
                      {errors[`perf_${idx}_valuation`]}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    CAGR (%) (Optional)
                  </label>
                  <input
                    type="number"
                    value={perf.cagr}
                    onChange={(e) => handlePerformanceChange(idx, 'cagr', parseFloat(e.target.value) || '')}
                    placeholder="e.g., 8.5"
                    step="0.01"
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
                    P&L % (Optional)
                  </label>
                  <input
                    type="number"
                    value={perf.pAndL}
                    onChange={(e) => handlePerformanceChange(idx, 'pAndL', parseFloat(e.target.value) || '')}
                    placeholder="e.g., 25"
                    step="0.01"
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
          ))}

          <div style={{
            padding: '16px',
            backgroundColor: '#e8f4f8',
            borderRadius: '8px',
            borderLeft: '4px solid #0288d1',
          }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#01579b' }}>
              💡 Tip: If you don't have CAGR or P&L calculated, leave blank. We can calculate these from your inception date and valuations.
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Branding & Customization */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600', margin: '0 0 16px 0', color: '#1a1a1a' }}>
            Report Branding
          </h2>
          <p style={{ color: '#666', margin: '0 0 20px 0' }}>Step 4 of 4 (Optional)</p>

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

        {step < 4 && (
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

        {step === 4 && (
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
