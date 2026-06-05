'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reload } from 'firebase/auth';
import {
  Search,
  Plus,
  LogOut,
  MoreHorizontal,
  Trash2,
  FileText,
  ClipboardCheck,
  LayoutGrid,
  List as ListIcon,
  Check,
  ChevronRight,
  Users,
  Wallet,
  Scan,
  X as XIcon,
} from 'lucide-react';
import ReviewUploadView from '../components/ReviewUploadView';
import LoginPage from '../components/LoginPage';
import { getInitialClients, getInitialReviews } from '../lib/mockData';
import { onAuthChange, logout, saveClients, loadClients, saveReviews, loadReviews, getUserProfile, loadFNASummary } from '../lib/firebaseUtils';
import { auth } from '../lib/firebase';

// Simple UUID generator
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

function BrandMark({ size = 26 }) {
  const [fallback, setFallback] = useState(false);
  return (
    <div className="dash-brand-mark" style={{ width: size, height: size }}>
      {fallback ? (
        'L'
      ) : (
        <img
          src="/leet-logo.png"
          alt="Leet Studio"
          width={size}
          height={size}
          onError={() => setFallback(true)}
          style={{ width: '92%', height: '92%', objectFit: 'contain' }}
        />
      )}
    </div>
  );
}

const AVATAR_TINTS = [
  { bg: 'var(--accent-50)', fg: 'var(--accent-600)' },
  { bg: 'var(--success-50)', fg: 'var(--success-500)' },
  { bg: 'var(--review-50)', fg: 'var(--review-600)' },
  { bg: '#fef0e6', fg: '#c2611b' },
  { bg: '#e6f3f8', fg: '#1e6f8c' },
  { bg: '#fef5e7', fg: '#a4760a' },
];

function tintForName(name) {
  if (!name) return AVATAR_TINTS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + second).toUpperCase() || '?';
}

function useClickAway(ref, onAway, active = true) {
  useEffect(() => {
    if (!active) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onAway();
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') onAway();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [ref, onAway, active]);
}

function StatusChips({ hasFNASummary, hasReviews, reviewCount, onFNAClick, onReviewsClick }) {
  return (
    <div className="dash-status-chips">
      {hasFNASummary ? (
        <button
          type="button"
          className="dash-status-chip is-fna-done"
          onClick={(e) => { e.stopPropagation(); onFNAClick(); }}
          title="View FNA summary"
        >
          <span className="dash-status-chip-icon"><Check size={12} strokeWidth={2.6} /></span>
          <span>FNA · view</span>
          <span className="dash-status-chip-chev"><ChevronRight size={12} strokeWidth={2.2} /></span>
        </button>
      ) : (
        <span className="dash-status-chip is-empty">
          <span className="dash-status-chip-dot" />
          <span>No FNA yet</span>
        </span>
      )}

      {hasReviews ? (
        <button
          type="button"
          className="dash-status-chip is-review-done"
          onClick={(e) => { e.stopPropagation(); onReviewsClick(); }}
          title="View past reviews"
        >
          <span className="dash-status-chip-dot" />
          <span>{reviewCount} review{reviewCount === 1 ? '' : 's'} · history</span>
          <span className="dash-status-chip-chev"><ChevronRight size={12} strokeWidth={2.2} /></span>
        </button>
      ) : (
        <span className="dash-status-chip is-empty">
          <span className="dash-status-chip-dot" />
          <span>No reviews yet</span>
        </span>
      )}
    </div>
  );
}

function HoverCTAs({ hasFNASummary, hasReviews, onNewReview, onScanFNA }) {
  const needsReview = !hasReviews;
  const needsFNA = !hasFNASummary;
  if (!needsReview && !needsFNA) return null;
  return (
    <div className="dash-status-cta" onClick={(e) => e.stopPropagation()}>
      {needsReview && (
        <button type="button" className="dash-btn dash-btn-primary" onClick={onNewReview}>
          <Plus size={13} strokeWidth={2.6} />
          New review
        </button>
      )}
      {needsFNA && (
        <button type="button" className="dash-btn dash-btn-success" onClick={onScanFNA}>
          <Scan size={13} strokeWidth={2.4} />
          Scan FNA
        </button>
      )}
    </div>
  );
}

function ClientCardItem({
  client,
  stats,
  hasFNASummary,
  index,
  onSelect,
  onNewReview,
  onPastReviews,
  onFNA,
  onViewFNASummary,
  onDelete,
  formatAUM,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef(null);
  useClickAway(menuRef, () => setMenuOpen(false), menuOpen);

  const createdLabel = new Date(client.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const tint = tintForName(client.name);
  const hasReviews = stats.reviewCount > 0;

  if (confirming) {
    return (
      <div className="dash-card" style={{ animationDelay: `${Math.min(index, 12) * 30}ms`, cursor: 'default' }}>
        <div className="dash-confirm">
          <div>
            <div className="dash-confirm-title">Delete {client.name}?</div>
            <div className="dash-confirm-body">
              This removes the client along with every linked review and portfolio. It cannot be undone.
            </div>
          </div>
          <div className="dash-confirm-actions">
            <button className="dash-btn dash-btn-ghost" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button className="dash-btn dash-btn-danger" onClick={() => onDelete(client.id)}>
              <Trash2 size={14} strokeWidth={2.2} />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dash-card"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms`, cursor: 'default' }}
    >
      <div className="dash-card-head">
        <div className="dash-card-name-row">
          <div className="dash-avatar" aria-hidden="true" style={{ background: tint.bg, color: tint.fg }}>
            {getInitials(client.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="dash-card-name" title={client.name}>{client.name}</p>
            <p className="dash-card-sub">Added {createdLabel}</p>
          </div>
        </div>

        <div className="dash-kebab-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            className="dash-kebab"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={16} strokeWidth={2.2} />
          </button>
          {menuOpen && (
            <div className="dash-menu" role="menu">
              <button className="dash-menu-item" role="menuitem"
                onClick={() => { setMenuOpen(false); onFNA(client.id); }}>
                <ClipboardCheck size={14} strokeWidth={2} />
                Financial needs analysis
              </button>
              {hasFNASummary && (
                <button className="dash-menu-item" role="menuitem"
                  onClick={() => { setMenuOpen(false); onViewFNASummary(client.id); }}>
                  <FileText size={14} strokeWidth={2} />
                  View FNA summary
                </button>
              )}
              <div className="dash-menu-divider" />
              <button className="dash-menu-item dash-menu-item-danger" role="menuitem"
                onClick={() => { setMenuOpen(false); setConfirming(true); }}>
                <Trash2 size={14} strokeWidth={2} />
                Delete client
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="dash-card-stats">
        <div>
          <div className="dash-card-stat-label">Reviews</div>
          <div className="dash-card-stat-value">{stats.reviewCount}</div>
        </div>
        <div>
          <div className="dash-card-stat-label">Portfolios</div>
          <div className="dash-card-stat-value">{stats.portfolioCount}</div>
        </div>
        <div>
          <div className="dash-card-stat-label">AUM</div>
          <div className="dash-card-stat-value">{formatAUM(stats.totalAUM)}</div>
        </div>
      </div>

      <div className="dash-status-stack">
        <StatusChips
          hasFNASummary={hasFNASummary}
          hasReviews={hasReviews}
          reviewCount={stats.reviewCount}
          onFNAClick={() => onViewFNASummary(client.id)}
          onReviewsClick={() => onPastReviews(client.id)}
        />
      </div>

      <div className="dash-card-cta-slot">
        <div className="dash-card-cta" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="dash-btn dash-btn-primary" onClick={() => onNewReview(client.id)}>
            <Plus size={13} strokeWidth={2.6} />
            New review
          </button>
          <button type="button" className="dash-btn dash-btn-success" onClick={() => onFNA(client.id)}>
            <Scan size={13} strokeWidth={2.4} />
            Scan FNA
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientListRow({
  client,
  stats,
  hasFNASummary,
  onSelect,
  onNewReview,
  onPastReviews,
  onFNA,
  onViewFNASummary,
  onDelete,
  formatAUM,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef(null);
  useClickAway(menuRef, () => setMenuOpen(false), menuOpen);

  const tint = tintForName(client.name);
  const createdLabel = new Date(client.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const hasReviews = stats.reviewCount > 0;

  if (confirming) {
    return (
      <div className="dash-list-row" style={{ gridTemplateColumns: '1fr auto' }}>
        <div style={{ fontSize: 13.5, color: 'var(--text)' }}>
          Delete <strong>{client.name}</strong>? This removes the client and all linked data.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="dash-btn dash-btn-ghost" onClick={() => setConfirming(false)} style={{ height: 32, fontSize: 12.5 }}>
            Cancel
          </button>
          <button className="dash-btn dash-btn-danger" onClick={() => onDelete(client.id)} style={{ height: 32, fontSize: 12.5 }}>
            <Trash2 size={13} strokeWidth={2.2} />
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-list-row">
      <div className="dash-list-name">
        <div className="dash-avatar" aria-hidden="true" style={{ background: tint.bg, color: tint.fg, width: 32, height: 32, fontSize: 12 }}>
          {getInitials(client.name)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="dash-list-name-text" title={client.name}>{client.name}</div>
          <div className="dash-list-name-sub">{createdLabel}</div>
        </div>
      </div>

      <div className="dash-list-cell">
        <div className="dash-list-cell-label">Reviews</div>
        <div className="dash-list-cell-value">{stats.reviewCount}</div>
      </div>
      <div className="dash-list-cell">
        <div className="dash-list-cell-label">Portfolios</div>
        <div className="dash-list-cell-value">{stats.portfolioCount}</div>
      </div>
      <div className="dash-list-cell">
        <div className="dash-list-cell-label">AUM</div>
        <div className="dash-list-cell-value">{formatAUM(stats.totalAUM)}</div>
      </div>

      <div className="dash-status-stack">
        <StatusChips
          hasFNASummary={hasFNASummary}
          hasReviews={hasReviews}
          reviewCount={stats.reviewCount}
          onFNAClick={() => onViewFNASummary(client.id)}
          onReviewsClick={() => onPastReviews(client.id)}
        />
      </div>

      <div className="dash-list-row-actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="dash-btn dash-btn-primary" onClick={() => onNewReview(client.id)}>
          <Plus size={13} strokeWidth={2.6} />
          New review
        </button>
        <button type="button" className="dash-btn dash-btn-success" onClick={() => onFNA(client.id)}>
          <Scan size={13} strokeWidth={2.4} />
          Scan FNA
        </button>
        <div className="dash-kebab-wrap" ref={menuRef}>
          <button
            className="dash-kebab"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={15} strokeWidth={2.2} />
          </button>
          {menuOpen && (
            <div className="dash-menu" role="menu">
              {hasFNASummary && (
                <button className="dash-menu-item" role="menuitem"
                  onClick={() => { setMenuOpen(false); onViewFNASummary(client.id); }}>
                  <FileText size={14} strokeWidth={2} />
                  View FNA summary
                </button>
              )}
              <div className="dash-menu-divider" />
              <button className="dash-menu-item dash-menu-item-danger" role="menuitem"
                onClick={() => { setMenuOpen(false); setConfirming(true); }}>
                <Trash2 size={14} strokeWidth={2} />
                Delete client
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewToggle({ mode, onChange }) {
  return (
    <div className="dash-viewtoggle" role="tablist" aria-label="View mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'cards'}
        className={`dash-viewtoggle-btn ${mode === 'cards' ? 'is-active' : ''}`}
        onClick={() => onChange('cards')}
      >
        <LayoutGrid size={13} strokeWidth={2.2} />
        Cards
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'list'}
        className={`dash-viewtoggle-btn ${mode === 'list' ? 'is-active' : ''}`}
        onClick={() => onChange('list')}
      >
        <ListIcon size={13} strokeWidth={2.2} />
        List
      </button>
    </div>
  );
}

function AddClientButton({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  useClickAway(wrapRef, () => setOpen(false), open);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    } else {
      setName('');
    }
  }, [open]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setName('');
    setOpen(false);
  };

  return (
    <div className="dash-addclient-wrap" ref={wrapRef}>
      <button
        type="button"
        className="dash-btn dash-btn-primary"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <Plus size={14} strokeWidth={2.6} />
        Add client
      </button>
      {open && (
        <div className="dash-addclient-popover" role="dialog" aria-label="Add a new client">
          <input
            ref={inputRef}
            type="text"
            className="dash-addclient-popover-input"
            placeholder="Client name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
              else if (e.key === 'Escape') setOpen(false);
            }}
          />
          <div className="dash-addclient-popover-actions">
            <button
              type="button"
              className="dash-btn dash-btn-ghost"
              onClick={() => setOpen(false)}
              style={{ flex: 1, height: 34, fontSize: 13 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="dash-btn dash-btn-primary"
              onClick={submit}
              disabled={!name.trim()}
              style={{ flex: 1, height: 34, fontSize: 13, ...(!name.trim() ? { opacity: 0.55, cursor: 'not-allowed' } : null) }}
            >
              <Plus size={13} strokeWidth={2.6} />
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupHeader({ label, count, kind }) {
  return (
    <div className="dash-group-header">
      <span className="dash-group-label">{label}</span>
      <span className={`dash-group-count is-${kind}`}>
        {count} client{count === 1 ? '' : 's'}
      </span>
      <span className="dash-group-line" />
    </div>
  );
}

function LandingPage({
  clients,
  reviews,
  onAddClient,
  onSelectClient,
  onDeleteClient,
  onNewReview,
  onPastReviews,
  onLogout,
  userName,
  searchQuery,
  onSearchChange,
  savedSummaryClientIds,
}) {
  const router = useRouter();
  const [displayedText, setDisplayedText] = useState('');
  const [viewMode, setViewMode] = useState('cards');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('leetstudio_viewmode');
    if (saved === 'cards' || saved === 'list') setViewMode(saved);
  }, []);

  const updateViewMode = (m) => {
    setViewMode(m);
    if (typeof window !== 'undefined') window.localStorage.setItem('leetstudio_viewmode', m);
  };

  const fullName = userName || 'Advisor';
  const fullGreeting = `Hello, ${fullName}`;

  useEffect(() => {
    setDisplayedText('');
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullGreeting.length) {
        setDisplayedText(fullGreeting.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 55);
    return () => clearInterval(typingInterval);
  }, [fullGreeting]);

  // Most recently added first. Future grouping (upcoming birthdays, SRS gaps,
  // budget shortfalls, etc.) will layer on top of this base sort rather than
  // replace it — see the planned tag/filter work.
  const filteredClients = clients
    .filter((client) => client.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice()
    .sort((a, b) => {
      const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });

  const getClientStats = (client) => {
    const savedReviews = reviews.filter(
      (r) => r.clientId === client.id && r.status === 'extracted'
    );
    let totalPortfolios = 0;
    let totalAUM = 0;
    savedReviews.forEach((review) => {
      if (review.holdingsSets) {
        totalPortfolios += review.holdingsSets.length;
        review.holdingsSets.forEach((set) => {
          totalAUM += set.totalPortfolioValueSgd || 0;
        });
      }
    });
    return {
      reviewCount: savedReviews.length,
      portfolioCount: totalPortfolios,
      totalAUM,
    };
  };

  const formatAUM = (amount) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 1 : 2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(amount >= 10_000 ? 0 : 1)}K`;
    return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const totals = clients.reduce(
    (acc, c) => {
      const s = getClientStats(c);
      acc.reviews += s.reviewCount;
      acc.portfolios += s.portfolioCount;
      acc.aum += s.totalAUM;
      return acc;
    },
    { reviews: 0, portfolios: 0, aum: 0 }
  );

  const isTyping = displayedText.length < fullGreeting.length;

  const renderClientList = (list) => {
    if (viewMode === 'list') {
      return (
        <section className="dash-list" aria-label="Clients list">
          {list.map((client) => (
            <ClientListRow
              key={client.id}
              client={client}
              stats={getClientStats(client)}
              hasFNASummary={savedSummaryClientIds.has(client.id)}
              onSelect={onSelectClient}
              onNewReview={onNewReview}
              onPastReviews={onPastReviews}
              onFNA={(id) => router.push(`/fna?clientId=${id}`)}
              onViewFNASummary={(id) => router.push(`/fna-summary-view?clientId=${id}`)}
              onDelete={onDeleteClient}
              formatAUM={formatAUM}
            />
          ))}
        </section>
      );
    }
    return (
      <section className="dash-grid">
        {list.map((client, idx) => (
          <ClientCardItem
            key={client.id}
            client={client}
            index={idx}
            stats={getClientStats(client)}
            hasFNASummary={savedSummaryClientIds.has(client.id)}
            onSelect={onSelectClient}
            onNewReview={onNewReview}
            onPastReviews={onPastReviews}
            onFNA={(id) => router.push(`/fna?clientId=${id}`)}
            onViewFNASummary={(id) => router.push(`/fna-summary-view?clientId=${id}`)}
            onDelete={onDeleteClient}
            formatAUM={formatAUM}
          />
        ))}
      </section>
    );
  };

  return (
    <div className="dash-root">
      <header className="dash-topbar">
        <div className="dash-brand">
          <BrandMark />
          <span>Leet Studio</span>
        </div>
        <div className="dash-topbar-right">
          {clients.length > 0 && (
            <div className="dash-search" role="search">
              <span className="dash-search-icon">
                <Search size={15} strokeWidth={2} />
              </span>
              <input
                type="text"
                placeholder="Search clients"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search clients"
              />
            </div>
          )}
          {clients.length > 0 && <ViewToggle mode={viewMode} onChange={updateViewMode} />}
          <AddClientButton onCreate={onAddClient} />
          <button className="dash-btn dash-btn-ghost" onClick={onLogout}>
            <LogOut size={14} strokeWidth={2} />
            Log out
          </button>
        </div>
      </header>

      <main className="dash-container">
        <section className="dash-welcome">
          <div>
            <h1>
              {displayedText}
              {isTyping && <span className="dash-typing-cursor" aria-hidden="true" />}
            </h1>
            <p>Create and review client portfolios with AI-assisted analysis.</p>
          </div>
        </section>

        {clients.length > 0 && (
          <section className="dash-stats" aria-label="Portfolio totals">
            <div className="dash-stat">
              <div className="dash-stat-icon is-accent" aria-hidden="true">
                <Users size={15} strokeWidth={2.2} />
              </div>
              <div className="dash-stat-content">
                <span className="dash-stat-label">Clients</span>
                <span className="dash-stat-value">{clients.length}</span>
              </div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-icon is-review" aria-hidden="true">
                <FileText size={15} strokeWidth={2.2} />
              </div>
              <div className="dash-stat-content">
                <span className="dash-stat-label">Reviews completed</span>
                <span className="dash-stat-value">{totals.reviews}</span>
              </div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-icon is-success" aria-hidden="true">
                <Wallet size={15} strokeWidth={2.2} />
              </div>
              <div className="dash-stat-content">
                <span className="dash-stat-label">Assets under review</span>
                <span className="dash-stat-value">{formatAUM(totals.aum)}</span>
              </div>
            </div>
          </section>
        )}

        {clients.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon">
              <Users size={20} strokeWidth={2} />
            </div>
            <div className="dash-empty-title">No clients yet</div>
            <div className="dash-empty-body">
              Hit <strong>Add client</strong> in the top bar to create your first profile.
            </div>
          </div>
        ) : searchQuery && filteredClients.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-title">No matches</div>
            <div className="dash-empty-body">
              Nothing matches “{searchQuery}”. Try a different name or clear the search.
            </div>
          </div>
        ) : (
          // Single flat list, newest first. Filters and grouping will return
          // when we add tags / smart segments (birthdays, SRS gaps, etc.).
          renderClientList(filteredClients)
        )}
      </main>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSummaryClientIds, setSavedSummaryClientIds] = useState(new Set());

  console.log('[App] Render - user:', user?.email, 'currentView:', currentView);

  // Check auth state on mount
  useEffect(() => {
    console.log('[App] useEffect: Setting up auth listener');

    const unsubscribe = onAuthChange(async (currentUser) => {
      console.log('[App] Auth state changed:', currentUser?.email);

      if (currentUser) {
        // Reload to ensure displayName is current
        await reload(currentUser);
        console.log('[App] User displayName:', currentUser.displayName);

        // Get user profile from Firestore
        const profile = await getUserProfile(currentUser.uid);
        console.log('[App] User profile:', profile);
        setUserProfile(profile);

        // User is logged in - load their data from Firebase
        console.log('[App] Loading data from Firebase for user:', currentUser.uid);
        const savedClients = await loadClients(currentUser.uid);
        const savedReviews = await loadReviews(currentUser.uid);

        console.log('[App] Loaded', savedClients.length, 'clients and', savedReviews.length, 'reviews');
        setClients(savedClients);
        setReviews(savedReviews);
      } else {
        setUserProfile(null);
      }

      setUser(currentUser);
      setIsLoading(false);
      setIsHydrated(true);
    });

    return unsubscribe;
  }, []);

  // Load FNA summary status for all clients
  useEffect(() => {
    console.log('[App] FNA Check: user=', user?.uid, 'clients=', clients.length);
    if (user && clients.length > 0) {
      console.log('[App] Loading FNA summary status for', clients.length, 'clients');
      const loadSummaryStatus = async () => {
        const summaryIds = new Set();
        for (const client of clients) {
          try {
            const summary = await loadFNASummary(user.uid, client.id);
            if (summary) {
              console.log('[App] Found FNA summary for client:', client.id);
              summaryIds.add(client.id);
            } else {
              console.log('[App] No FNA summary for client:', client.id);
            }
          } catch (error) {
            console.error('[App] Error loading FNA summary for client', client.id, ':', error);
          }
        }
        console.log('[App] Summary check complete, found', summaryIds.size, 'summaries');
        setSavedSummaryClientIds(summaryIds);
      };
      loadSummaryStatus();
    }
  }, [user, clients]);

  // Save clients to Firebase whenever they change
  useEffect(() => {
    if (isHydrated && user) {
      console.log('[App] Saving clients to Firebase');
      saveClients(user.uid, clients);
    }
  }, [clients, isHydrated, user]);

  // Save reviews to Firebase whenever they change
  useEffect(() => {
    if (isHydrated && user) {
      console.log('[App] Saving reviews to Firebase');
      saveReviews(user.uid, reviews);
    }
  }, [reviews, isHydrated, user]);

  const handleAddClient = (name) => {
    console.log('[App] handleAddClient:', { name });
    const newClient = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      reviews: [],
    };
    setClients([...clients, newClient]);
    // Stay on dashboard — no auto-created review, no view change.
  };

  const handleDeleteClient = (clientId) => {
    console.log('[App] handleDeleteClient:', clientId);

    const updatedClients = clients.filter((c) => c.id !== clientId);
    setClients(updatedClients);

    const updatedReviews = reviews.filter((r) => r.clientId !== clientId);
    setReviews(updatedReviews);

    console.log('[App] Deleted client and', reviews.length - updatedReviews.length, 'reviews');
  };

  const handleNewReview = (clientId) => {
    console.log('[App] handleNewReview:', clientId);

    const reviewId = generateId();
    const newReview = {
      id: reviewId,
      clientId,
      reviewName: '',
      createdAt: new Date().toISOString(),
      status: 'not_started',
      holdingsSets: [],
    };

    setReviews([...reviews, newReview]);
    setSelectedClientId(clientId);
    setSelectedReviewId(reviewId);
    setCurrentView('upload');
  };

  const handlePastReviews = (clientId) => {
    console.log('[App] handlePastReviews:', clientId);

    // Get the latest (most recent) extracted review for this client
    const clientReviews = reviews.filter((r) => r.clientId === clientId && r.status === 'extracted');
    const latestReview = clientReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (latestReview) {
      setSelectedClientId(clientId);
      setSelectedReviewId(latestReview.id);
      setCurrentView('upload');
    }
  };

  const handleAddReview = (clientId, reviewName, reviewId) => {
    console.log('[App] handleAddReview:', { clientId, reviewName, reviewId });

    const newReview = {
      id: reviewId || generateId(),
      clientId,
      reviewName,
      createdAt: new Date().toISOString(),
      status: 'not_started',
      holdings: [],
    };

    console.log('[App] Created new review:', newReview);
    setReviews([...reviews, newReview]);

    const updatedClients = clients.map((c) =>
      c.id === clientId
        ? { ...c, reviews: [...c.reviews, newReview.id] }
        : c
    );
    setClients(updatedClients);
  };

  const handleDeleteReview = (reviewId) => {
    console.log('[App] handleDeleteReview:', reviewId);

    const reviewToDelete = reviews.find((r) => r.id === reviewId);
    const clientId = reviewToDelete.clientId;

    const updatedReviews = reviews.filter((r) => r.id !== reviewId);
    setReviews(updatedReviews);

    const updatedClients = clients.map((c) =>
      c.id === clientId
        ? {
            ...c,
            reviews: c.reviews.filter((rid) => rid !== reviewId),
          }
        : c
    );
    setClients(updatedClients);

    console.log('[App] Deleted review');
  };

  const handleStartReview = (reviewId) => {
    console.log('[App] handleStartReview:', reviewId);

    setSelectedReviewId(reviewId);
    setCurrentView('upload');
  };

  const handleBackToDashboard = () => {
    console.log('[App] handleBackToDashboard');

    setCurrentView('dashboard');
    setSelectedReviewId(null);
    setSelectedClientId(null);
  };

  const handleLogout = async () => {
    console.log('[App] handleLogout');
    try {
      await logout();
      setUser(null);
      setClients([]);
      setReviews([]);
      setCurrentView('dashboard');
    } catch (err) {
      console.error('[App] Logout error:', err);
    }
  };

  const handleSelectClient = (clientId) => {
    console.log('[App] handleSelectClient:', clientId);

    setSelectedClientId(clientId);

    // Check if there's an existing saved review for this client
    const existingReview = reviews.find((r) => r.clientId === clientId && r.status === 'extracted');

    if (existingReview) {
      console.log('[App] Loading existing review:', existingReview.id);
      setSelectedReviewId(existingReview.id);
    } else {
      // Create a new review for this client
      const reviewId = generateId();
      handleAddReview(clientId, '', reviewId);
      setSelectedReviewId(reviewId);
    }

    setCurrentView('upload');
  };

  const handleSaveHoldings = (holdingsSets, reviewName) => {
    console.log('[App] handleSaveHoldings:', holdingsSets.length, 'holdings sets, review name:', reviewName);

    const updatedReviews = reviews.map((r) =>
      r.id === selectedReviewId
        ? {
            ...r,
            holdingsSets,
            reviewName,
            status: 'extracted',
          }
        : r
    );

    setReviews(updatedReviews);
    console.log('[App] Review status updated to "extracted" with', holdingsSets.length, 'portfolio(ies)');

    setCurrentView('dashboard');
    setSelectedReviewId(null);
  };

  const handleUpdateReviewName = (reviewName) => {
    console.log('[App] handleUpdateReviewName:', reviewName);

    const updatedReviews = reviews.map((r) =>
      r.id === selectedReviewId
        ? {
            ...r,
            reviewName,
          }
        : r
    );

    setReviews(updatedReviews);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '16px', color: '#666' }}>Loading...</p>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <LoginPage
        onAuthSuccess={() => {
          console.log('[App] Auth successful, user logged in');
        }}
      />
    );
  }

  return (
    <>
      {currentView === 'dashboard' && (
        <LandingPage
          clients={clients}
          reviews={reviews}
          onAddClient={handleAddClient}
          onSelectClient={handleSelectClient}
          onDeleteClient={handleDeleteClient}
          onNewReview={handleNewReview}
          onPastReviews={handlePastReviews}
          onLogout={handleLogout}
          userName={userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Advisor'}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          savedSummaryClientIds={savedSummaryClientIds}
        />
      )}

      {currentView === 'upload' && selectedReviewId && (
        <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
          {(() => {
            const selectedReview = reviews.find((r) => r.id === selectedReviewId);
            if (!selectedReview) {
              return <p>Review not found</p>;
            }
            const selectedClient = clients.find((c) => c.id === selectedClientId);
            return (
              <ReviewUploadView
                review={selectedReview}
                clientName={selectedClient?.name || 'Client'}
                onSaveHoldings={handleSaveHoldings}
                onUpdateReviewName={handleUpdateReviewName}
                onBack={handleBackToDashboard}
                reviews={reviews}
                selectedClientId={selectedClientId}
                onSelectReview={(reviewId) => {
                  setSelectedReviewId(reviewId);
                }}
              />
            );
          })()}
        </div>
      )}
    </>
  );
}
