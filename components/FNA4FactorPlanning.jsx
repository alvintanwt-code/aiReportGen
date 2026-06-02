'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Info, ShieldCheck, TrendingUp, Sprout, Landmark, Sparkles, ArrowUpRight } from 'lucide-react';

const FACTOR_META = {
  noFailPosition: { label: 'No fail position', icon: ShieldCheck, accent: 'var(--accent-600)' },
  passiveIncome: { label: 'Passive income', icon: TrendingUp, accent: 'var(--success-600)' },
  investmentsGrowth: { label: 'Growth investing', icon: Sprout, accent: '#8a5a08' },
  legacy: { label: 'Legacy & wealth transfer', icon: Landmark, accent: '#7C3AED' },
};

const PRODUCT_RECS = {
  Accumulation: [
    { name: 'Singlife Choice Saver', provider: 'Singlife', factor: 'noFailPosition', match: 96, rationale: 'Capital-guaranteed endowment to anchor the emergency-fund tier.' },
    { name: 'AIA Pro Term Cover', provider: 'AIA', factor: 'noFailPosition', match: 92, rationale: 'Term life with critical illness rider — affordable protection during accumulation.' },
    { name: 'Manulife InvestReady II', provider: 'Manulife', factor: 'investmentsGrowth', match: 89, rationale: 'Diversified ILP weighted toward global equities for long compounding runway.' },
    { name: 'Endowus Cash Smart Ultra', provider: 'Endowus', factor: 'passiveIncome', match: 81, rationale: 'Low-volatility cash management as a stepping-stone toward yield-bearing assets.' },
  ],
  'Transition Ready': [
    { name: 'HSBC Wealth Heritage', provider: 'HSBC Life', factor: 'legacy', match: 94, rationale: 'Whole-life with cash value — begins to formalise an inter-generational plan.' },
    { name: 'Singlife Flexi Retirement', provider: 'Singlife', factor: 'passiveIncome', match: 91, rationale: 'Defers payouts to start a guaranteed monthly income stream in retirement.' },
    { name: 'Manulife Income Builder', provider: 'Manulife', factor: 'passiveIncome', match: 88, rationale: 'Endowment with quarterly cash benefits — bridges to passive income targets.' },
    { name: 'iFAST Diversified Growth', provider: 'iFAST', factor: 'investmentsGrowth', match: 84, rationale: 'Balanced 60/40 wrapper to dial down volatility while keeping growth exposure.' },
  ],
  'Work Optional Ready': [
    { name: 'AIA Pro Lifetime Protector', provider: 'AIA', factor: 'legacy', match: 97, rationale: 'Whole-life solution structured for wealth-transfer with optional trust nomination.' },
    { name: 'HSBC Premier Trust Solutions', provider: 'HSBC Trustee', factor: 'legacy', match: 93, rationale: 'Standby living-trust arrangement to ring-fence assets for the next generation.' },
    { name: 'Singlife Stable Income', provider: 'Singlife', factor: 'passiveIncome', match: 90, rationale: 'Capital-preservation income product targeting 4–5% yield with low equity beta.' },
    { name: 'Manulife Heirloom', provider: 'Manulife', factor: 'noFailPosition', match: 87, rationale: 'Long-term care add-on insulating against late-life healthcare costs.' },
  ],
};

const RECOMMENDATIONS = {
  Accumulation: {
    summary: 'Focus on building a solid financial foundation with consistent savings and strategic growth investments.',
    factors: {
      noFailPosition: { title: 'No fail position', recommendation: 'Establish an emergency fund of 3–6 months of expenses. Build a basic insurance safety net (term life, health insurance).', actionItems: ['Build emergency fund', 'Get term life insurance', 'Basic health coverage'] },
      passiveIncome: { title: 'Passive income streams', recommendation: 'Start small with dividend stocks or REITs. Focus on growth now, passive income later.', actionItems: ['Explore dividend stocks', 'Consider REITs', 'CPF interest accumulation'] },
      investmentsGrowth: { title: 'Investments for growth', recommendation: 'Prioritise growth-oriented investments. Maximise CPF contribution, diversify across equities and funds.', actionItems: ['Maximise CPF contribution', 'Diversify portfolio', 'Regular investment contributions'] },
      legacy: { title: 'Legacy', recommendation: 'Start thinking about basic estate planning. Create a simple will and designate beneficiaries.', actionItems: ['Draft a will', 'Designate beneficiaries', 'Review annually'] },
    },
  },
  'Transition Ready': {
    summary: 'Balance growth with income generation. Build passive income streams while maintaining growth investments.',
    factors: {
      noFailPosition: { title: 'No fail position', recommendation: 'Expand emergency fund to 6–12 months. Ensure adequate insurance coverage (life, health, disability).', actionItems: ['Increase emergency fund', 'Review insurance adequacy', 'Add disability coverage'] },
      passiveIncome: { title: 'Passive income streams', recommendation: 'Build significant passive income. Target 20–30% of expenses from passive sources.', actionItems: ['Dividend portfolio building', 'REITs investment', 'CPF rental income potential'] },
      investmentsGrowth: { title: 'Investments for growth', recommendation: 'Balanced approach: 60% growth, 40% income-generating. Consider rebalancing strategy.', actionItems: ['Rebalance portfolio', 'Add income-generating assets', 'Optimise asset allocation'] },
      legacy: { title: 'Legacy', recommendation: 'Formalise estate planning. Consider trusts if applicable. Update beneficiaries.', actionItems: ['Formalise estate plan', 'Review insurance trusts', 'Plan wealth transfer'] },
    },
  },
  'Work Optional Ready': {
    summary: 'Protect wealth and legacy. Transition focus from growth to security and wealth transfer.',
    factors: {
      noFailPosition: { title: 'No fail position', recommendation: 'Ensure full security coverage. Optimise healthcare and long-term care planning.', actionItems: ['Verify all coverages', 'Plan for healthcare costs', 'Long-term care insurance'] },
      passiveIncome: { title: 'Passive income streams', recommendation: 'Generate 100%+ of living expenses from passive sources. Optimise tax efficiency.', actionItems: ['Maximise passive income', 'Tax optimisation strategy', 'Income stability check'] },
      investmentsGrowth: { title: 'Investments for growth', recommendation: 'Conservative growth focus. Shift to capital preservation and income. 30% growth, 70% preservation.', actionItems: ['Reduce volatility', 'Capital preservation focus', 'Bond/dividend allocation'] },
      legacy: { title: 'Legacy', recommendation: 'Finalise wealth transfer plan. Consider charitable giving. Optimise for next generation.', actionItems: ['Finalise legacy plan', 'Tax-efficient transfer', 'Charitable planning'] },
    },
  },
};

export default function FNA4FactorPlanning({ extractedData, metrics }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  const [activeFactors, setActiveFactors] = useState({
    noFailPosition: true,
    passiveIncome: false,
    investmentsGrowth: false,
    legacy: false,
  });

  const toggleFactor = (factor) => {
    setActiveFactors((prev) => ({ ...prev, [factor]: !prev[factor] }));
  };

  const phaseRecs = RECOMMENDATIONS[metrics.phase] || RECOMMENDATIONS.Accumulation;
  const factorKeys = Object.keys(phaseRecs.factors);
  const productRecs = PRODUCT_RECS[metrics.phase] || PRODUCT_RECS.Accumulation;
  const anyFactorActive = factorKeys.some((k) => activeFactors[k]);
  const visibleProducts = anyFactorActive
    ? productRecs.filter((p) => activeFactors[p.factor])
    : productRecs;

  return (
    <div className="dash-root dash-upload">
      <header className="dash-upload-header">
        <div className="dash-upload-header-left">
          <button className="dash-back" onClick={() => router.push(`/fna-summary?clientId=${clientId}`)}>
            <ArrowLeft size={14} strokeWidth={2.2} />
            Summary
          </button>
          <div className="dash-crumbs">
            <span className="dash-crumb">Financial needs analysis</span>
            <span className="dash-crumb-sep">·</span>
            <span className="dash-crumb dash-crumb-current">4-factor planning</span>
          </div>
        </div>
      </header>

      <div
        className="dash-upload-body"
        style={{ gridTemplateColumns: '210px 1fr 300px', maxWidth: 1340, alignItems: 'stretch' }}
      >
        <aside className="dash-rail is-flush" aria-label="Planning factors">
          <div className="dash-rail-title">Planning factors</div>
          {factorKeys.map((key) => {
            const meta = FACTOR_META[key];
            const Icon = meta.icon;
            const isActive = activeFactors[key];
            return (
              <button
                key={key}
                className={`dash-rail-item ${isActive ? 'is-active' : ''}`}
                onClick={() => toggleFactor(key)}
                aria-pressed={isActive}
              >
                <Icon size={14} strokeWidth={2} style={{ color: isActive ? meta.accent : 'var(--subtle)' }} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </aside>

        <main>
          <h1 className="dash-h1" style={{ marginBottom: 6 }}>4-factor planning</h1>
          <p className="dash-section-sub">{phaseRecs.summary}</p>

          {factorKeys.every((k) => !activeFactors[k]) && (
            <div className="dash-empty">
              <div className="dash-empty-title">Select a factor</div>
              <div className="dash-empty-body">
                Pick one or more factors from the left to see the recommendation and action items for this phase.
              </div>
            </div>
          )}

          {factorKeys.map((factorKey) => {
            if (!activeFactors[factorKey]) return null;
            const factor = phaseRecs.factors[factorKey];
            const meta = FACTOR_META[factorKey];
            return (
              <section
                key={factorKey}
                className="dash-panel"
                style={{ marginBottom: 16, borderLeft: `3px solid ${meta.accent}` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--accent-50)',
                      color: meta.accent,
                    }}
                  >
                    <meta.icon size={15} strokeWidth={2} />
                  </span>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', margin: 0 }}>
                    {factor.title}
                  </h3>
                </div>

                <p style={{ fontSize: 13.5, color: 'var(--slate-700)', lineHeight: 1.6, margin: '0 0 18px' }}>
                  {factor.recommendation}
                </p>

                <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div className="dash-eyebrow" style={{ marginBottom: 10 }}>Action items</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {factor.actionItems.map((item, idx) => (
                      <li key={idx} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--slate-700)' }}>
                        <span style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          background: 'var(--accent-50)',
                          color: meta.accent,
                          fontSize: 11,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                          marginTop: 2,
                          fontWeight: 600,
                        }}>{idx + 1}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}

          <div className="dash-banner dash-banner-info" style={{ marginTop: 18 }}>
            <span className="dash-banner-icon">
              <Info size={15} strokeWidth={2.2} />
            </span>
            <span>
              <strong>Review periodically.</strong> Revisit this plan as the client's situation changes or life milestones occur. Adjust recommendations based on progress and changing priorities.
            </span>
          </div>
        </main>

        <aside className="dash-rec" aria-label="Product recommendations">
          <div className="dash-rec-head">
            <div className="dash-rec-title-row">
              <span
                aria-hidden="true"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--accent-50)',
                  color: 'var(--accent-600)',
                }}
              >
                <Sparkles size={13} strokeWidth={2.2} />
              </span>
              <span className="dash-rec-title">Recommended products</span>
            </div>
            <span className="dash-rec-badge">
              <Sparkles size={9} strokeWidth={2.6} />
              AI matched
            </span>
          </div>
          <p className="dash-rec-sub">
            Suggestions ranked by fit to this client's phase ({metrics.phase}). {anyFactorActive ? 'Filtered by your active factors.' : 'Select factors to filter.'}
          </p>

          <div className="dash-rec-list">
            {visibleProducts.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
                No products match the selected factors yet.
              </div>
            ) : (
              visibleProducts.map((product) => {
                const meta = FACTOR_META[product.factor];
                const Icon = meta.icon;
                return (
                  <article key={product.name} className="dash-rec-item">
                    <div className="dash-rec-item-head">
                      <div style={{ minWidth: 0 }}>
                        <div className="dash-rec-item-name">{product.name}</div>
                        <div className="dash-rec-item-provider">{product.provider}</div>
                      </div>
                      <span className="dash-rec-item-match">{product.match}%</span>
                    </div>
                    <p className="dash-rec-item-rationale">{product.rationale}</p>
                    <span className="dash-rec-item-tag">
                      <Icon size={10} strokeWidth={2.4} style={{ color: meta.accent }} />
                      {meta.label}
                    </span>
                  </article>
                );
              })
            )}
          </div>

          <div className="dash-rec-foot">
            Indicative only · advisor to confirm suitability
          </div>
        </aside>
      </div>
    </div>
  );
}
