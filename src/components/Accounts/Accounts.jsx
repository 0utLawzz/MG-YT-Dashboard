import { useState, useMemo } from 'react';
import { Copy, Eye, EyeOff, Database, Pencil, Check, X } from 'lucide-react';
import { useAccounts } from '../../hooks/useAccounts';
import { toast } from 'sonner';
import './Accounts.css';

const TAG_OPTIONS = ['new', 'verified', 'v-pending', 'used'];

export default function Accounts() {
  const { accounts, loading, error, refresh, updateAccount } = useAccounts();
  const [filter, setFilter] = useState('ALL');
  const [showPassword, setShowPassword] = useState({});
  const [editingRow, setEditingRow] = useState(null); // username of row being edited
  const [editValues, setEditValues] = useState({ Credit: 0, tags: '' });
  const [saving, setSaving] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const togglePassword = (username) => {
    setShowPassword(prev => ({ ...prev, [username]: !prev[username] }));
  };

  const startEdit = (acc) => {
    setEditingRow(acc.username);
    setEditValues({ Credit: acc.Credit ?? 0, tags: acc.tags ?? '' });
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditValues({ Credit: 0, tags: '' });
  };

  const saveEdit = async (acc) => {
    setSaving(true);
    try {
      await updateAccount(acc.sheetRow, {
        Credit: Number(editValues.Credit),
        tags: editValues.tags,
      });
      toast.success('Account updated!');
      setEditingRow(null);
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    if (filter === 'ALL') return accounts;
    const filterMap = { 'VPENDING': ['v-pending', 'vpending'], 'USED': ['used', 'uded'], 'NEW': ['new'], 'VERIFIED': ['verified'] };
    const targets = filterMap[filter] || [filter.toLowerCase()];
    return accounts.filter(acc => targets.includes(acc.tags?.toLowerCase()));
  }, [accounts, filter]);

  const counts = useMemo(() => {
    const c = { TOTAL: accounts.length, NEW: 0, VPENDING: 0, USED: 0 };
    accounts.forEach(acc => {
      const tag = acc.tags?.toLowerCase();
      if (tag === 'new') c.NEW++;
      if (tag === 'v-pending' || tag === 'vpending') c.VPENDING++;
      if (tag === 'used' || tag === 'uded') c.USED++;
    });
    return c;
  }, [accounts]);

  const normalizeTag = (tag) => {
    const t = tag?.toLowerCase();
    if (t === 'v-pending' || t === 'vpending') return 'VPENDING';
    if (t === 'uded' || t === 'used') return 'USED';
    return (tag || 'UNKNOWN').toUpperCase();
  };

  const tagClass = (tag) => {
    const t = tag?.toLowerCase();
    if (t === 'new') return 'new';
    if (t === 'verified') return 'verified';
    if (t === 'v-pending' || t === 'vpending') return 'vpend';
    if (t === 'used' || t === 'uded') return 'used';
    return 'default';
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loader"></div>
        <p>Loading accounts from Vault...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state panel">
        <p>⚠️ {error}</p>
        <button className="btn btn-sm btn-primary" onClick={refresh}>🔄 Retry</button>
      </div>
    );
  }

  return (
    <div className="accounts-container">
      {/* Top Bar */}
      <div className="accounts-top-bar">
        <div className="accounts-brand">
          <div className="brand-icon">
            <Database size={24} color="var(--bg)" />
          </div>
          <h2>CREDVAULT</h2>
        </div>

        <div className="accounts-stats">
          <div className="stat-item">
            <span>TOTAL</span>
            <span className="stat-badge total">{counts.TOTAL}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span>NEW</span>
            <span className="stat-badge new">{counts.NEW}</span>
          </div>
          <div className="stat-item">
            <span>VPEND</span>
            <span className="stat-badge vpend">{counts.VPENDING}</span>
          </div>
          <div className="stat-item">
            <span>USED</span>
            <span className="stat-badge used">{counts.USED}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="accounts-filters">
        {['ALL', 'NEW', 'VPENDING', 'USED'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active ' + f.toLowerCase() : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' && <Database size={14} style={{ marginRight: '6px' }} />}
            {f}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="accounts-grid">
        {filteredAccounts.map((acc, index) => {
          const isEditing = editingRow === acc.username;

          return (
            <div className={`account-card ${isEditing ? 'editing' : ''}`} key={index}>
              <div className="card-header">
                {/* Tag — editable when editing */}
                {isEditing ? (
                  <select
                    className="tag-select"
                    value={editValues.tags}
                    onChange={e => setEditValues(prev => ({ ...prev, tags: e.target.value }))}
                  >
                    {TAG_OPTIONS.map(t => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`card-tag ${tagClass(acc.tags)}`}>{normalizeTag(acc.tags)}</span>
                )}

                <div className="card-header-right">
                  {/* Credit — editable when editing */}
                  {isEditing ? (
                    <input
                      type="number"
                      className="credit-input"
                      value={editValues.Credit}
                      onChange={e => setEditValues(prev => ({ ...prev, Credit: e.target.value }))}
                      min={0}
                    />
                  ) : (
                    <span className="credit-badge">{acc.Credit ?? 0}</span>
                  )}

                  {/* Action buttons */}
                  {isEditing ? (
                    <div className="edit-actions">
                      <button
                        className="btn-icon-small save-btn"
                        onClick={() => saveEdit(acc)}
                        disabled={saving}
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="btn-icon-small cancel-btn"
                        onClick={cancelEdit}
                        disabled={saving}
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-icon-small edit-btn"
                      onClick={() => startEdit(acc)}
                      title="Edit Credit & Tag"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="card-body">
                {/* EMAIL */}
                <div className="form-group">
                  <label className="form-label">EMAIL</label>
                  <div className="field-row-box">
                    <input
                      type="text"
                      value={acc.username || ''}
                      readOnly
                      className="form-input read-only"
                    />
                    <button
                      className="btn-icon-small"
                      onClick={() => handleCopy(acc.username)}
                      title="Copy email"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="form-group">
                  <label className="form-label">PASSWORD</label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword[acc.username] ? 'text' : 'password'}
                      value={acc.password || ''}
                      readOnly
                      className="form-input read-only"
                    />
                    <div className="password-actions">
                      <button
                        className="btn-icon-small"
                        onClick={() => togglePassword(acc.username)}
                        title="Toggle visibility"
                      >
                        {showPassword[acc.username] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        className="btn-icon-small"
                        onClick={() => handleCopy(acc.password)}
                        title="Copy password"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAccounts.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <p>No accounts found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
