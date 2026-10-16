/* ============================================================
   LES — Componente Tabela
   ============================================================
   Uso:
     import { renderTable } from '../components/table.js';
     renderTable(container, {
         columns: [
             { key: 'nome', label: 'Nome' },
             { key: 'cargo', label: 'Cargo', render: (row) => `<span>${row.cargo}</span>` }
         ],
         data: [...],
         emptyMessage: 'Nenhum membro cadastrado.'
     });
   ============================================================ */

function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderTable(container, {
    columns = [],
    data = [],
    emptyTitle = 'Nada por aqui',
    emptyMessage = 'Nenhum registro encontrado.',
    onRowClick = null
} = {}) {
    if (!container) return;

    if (!data.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-title">${esc(emptyTitle)}</div>
                <p class="empty-state-sub">${esc(emptyMessage)}</p>
            </div>
        `;
        return;
    }

    const thead = columns.map(c =>
        `<th>${esc(c.label || c.key)}</th>`
    ).join('');

    const tbody = data.map((row, idx) => {
        const cells = columns.map(c => {
            const value = c.render ? c.render(row, idx) : esc(row[c.key]);
            return `<td>${value}</td>`;
        }).join('');
        return `<tr data-row-index="${idx}">${cells}</tr>`;
    }).join('');

    container.innerHTML = `
        <div class="app-table-wrap">
            <table class="app-table">
                <thead><tr>${thead}</tr></thead>
                <tbody>${tbody}</tbody>
            </table>
        </div>
    `;

    if (onRowClick) {
        container.querySelectorAll('tbody tr').forEach(tr => {
            tr.addEventListener('click', () => {
                const idx = Number(tr.dataset.rowIndex);
                onRowClick(data[idx], idx);
            });
        });
    }
}

export function renderSkeletonTable(container, rows = 5, cols = 4) {
    if (!container) return;
    const cell = `<td><div class="skeleton" style="height:16px;width:100%"></div></td>`;
    const row = `<tr>${cell.repeat(cols)}</tr>`;
    container.innerHTML = `
        <div class="app-table-wrap" style="padding:1rem">
            <table class="app-table"><tbody>${row.repeat(rows)}</tbody></table>
        </div>
    `;
}

export function renderEmptyState(container, title, message, actionHtml = '') {
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-title">${esc(title)}</div>
            <p class="empty-state-sub">${esc(message)}</p>
            ${actionHtml}
        </div>
    `;
}
