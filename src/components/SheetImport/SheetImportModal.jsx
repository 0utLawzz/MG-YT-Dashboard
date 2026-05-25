import { useState } from 'react';
import { FileSpreadsheet, Download, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { fetchSheetData } from '../../lib/google';
import './SheetImport.css';

export default function SheetImportModal({ onImport, onClose }) {
  const [sheetId, setSheetId] = useState('');
  const [range, setRange] = useState('Sheet1!A:D');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [imported, setImported] = useState(false);

  const handleFetch = async () => {
    if (!sheetId.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const data = await fetchSheetData(sheetId, range);
      if (!data || data.length < 2) {
        throw new Error('Sheet is empty or has no data rows. Expected: Header row + data rows.');
      }
      setPreview(data);
    } catch (err) {
      setError(err.message || 'Failed to read sheet. Check the ID and make sure it\'s publicly accessible.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length < 2) return;

    const headers = preview[0].map(h => h.toLowerCase().trim());
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('name'));
    const catIdx = headers.findIndex(h => h.includes('cat') || h.includes('category') || h.includes('genre'));
    const ageIdx = headers.findIndex(h => h.includes('age'));

    if (titleIdx === -1) {
      setError('Could not find a "Title" column in the header row.');
      return;
    }

    const stories = preview.slice(1)
      .filter(row => row[titleIdx]?.trim())
      .map(row => ({
        title: row[titleIdx]?.trim(),
        category: catIdx >= 0 ? row[catIdx]?.trim() : '',
        ageGroup: ageIdx >= 0 ? row[ageIdx]?.trim() : '2-6',
      }));

    if (stories.length === 0) {
      setError('No valid stories found in the sheet.');
      return;
    }

    try {
      await onImport(stories);
      setImported(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal sheet-import-modal" role="dialog" aria-label="Import from Google Sheet" id="sheet-import-modal">
        <div className="modal-header">
          <h2 className="modal-title"><FileSpreadsheet size={20} /> Import from Sheet</h2>
          <button className="btn btn-sm btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {imported ? (
          <div className="import-success">
            <CheckCircle size={48} style={{ color: 'var(--accent4)' }} />
            <p>Stories imported successfully! 🎉</p>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="sheet-id">Google Sheet ID</label>
              <input
                className="input"
                id="sheet-id"
                value={sheetId}
                onChange={e => setSheetId(e.target.value)}
                placeholder="e.g. 1BxiMVs0XRA5nFMd..."
              />
              <p className="form-hint">
                Find it in the sheet URL: docs.google.com/spreadsheets/d/<strong>[THIS_ID]</strong>/edit
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sheet-range">Range</label>
              <input
                className="input"
                id="sheet-range"
                value={range}
                onChange={e => setRange(e.target.value)}
                placeholder="Sheet1!A:D"
              />
              <p className="form-hint">
                First row must be headers (Title, Category, Age). Data starts from row 2.
              </p>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleFetch}
              disabled={!sheetId.trim() || loading}
            >
              <Download size={13} /> {loading ? 'Fetching…' : 'Preview Sheet'}
            </button>

            {error && (
              <div className="import-error">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {/* Preview Table */}
            {preview && (
              <div className="sheet-preview">
                <h4 className="preview-title">Preview ({preview.length - 1} stories found)</h4>
                <div className="preview-table-wrap">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {preview[0].map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(1, 11).map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{cell || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 11 && (
                    <p className="preview-more mono">…and {preview.length - 11} more rows</p>
                  )}
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                >
                  <FileSpreadsheet size={14} /> Import {preview.length - 1} Stories
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
