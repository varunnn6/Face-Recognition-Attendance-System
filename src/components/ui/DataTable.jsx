import { useState } from 'react';

export default function DataTable({ columns, data, onRowClick, emptyMessage = 'No records found' }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const perPage = 15;

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    const aVal = a[sortCol] || '';
    const bVal = b[sortCol] || '';
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice(page * perPage, (page + 1) * perPage);

  return (
    <div>
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default', width: col.width }}
                >
                  {col.label}
                  {sortCol === col.key && (
                    <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, sorted.length)} of {sorted.length}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = page < 3 ? i : page - 2 + i;
              if (p >= totalPages) return null;
              return (
                <button
                  key={p}
                  className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </button>
              );
            })}
            <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
