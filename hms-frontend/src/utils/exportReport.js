// Real export logic for the Reports & Analytics module.
// Generates and downloads an actual PDF, Excel (.xlsx), or CSV file from
// whatever columns/rows are currently on screen — no backend required.
//
// Libraries: jspdf + jspdf-autotable (PDF), xlsx / SheetJS (Excel), file-saver (CSV blob download).

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/** Formats a single cell for display/export according to the column definition. */
function formatCell(row, column) {
  const raw = row[column.key];
  if (column.formatCurrency && typeof raw === 'number') return INR.format(raw);
  return raw ?? '';
}

/** Builds a plain array-of-arrays table (header row + data rows) from columns/rows. */
function toTableRows(columns, rows) {
  const header = columns.map((c) => c.header);
  const body = rows.map((row) => columns.map((col) => formatCell(row, col)));
  return { header, body };
}

function timestampedFilename(title, ext) {
  const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${slug}-${stamp}.${ext}`;
}

/**
 * Exports rows as a formatted PDF with a title, generated-on date, and an auto-sized table.
 */
export function exportToPDF(title, columns, rows) {
  const { header, body } = toTableRows(columns, rows);
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.setTextColor('#0B5566');
  doc.text(title, 14, 18);

  doc.setFontSize(10);
  doc.setTextColor('#5B6B76');
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 14, 25);

  autoTable(doc, {
    head: [header],
    body,
    startY: 31,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [11, 85, 102], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [244, 247, 248] },
  });

  doc.save(timestampedFilename(title, 'pdf'));
}

/**
 * Exports rows as an .xlsx workbook with a single sheet named after the report.
 */
export function exportToExcel(title, columns, rows) {
  const { header, body } = toTableRows(columns, rows);
  const sheetData = [header, ...body];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = columns.map((c) => ({ wch: Math.max(c.header.length + 2, 14) }));

  const workbook = XLSX.utils.book_new();
  const sheetName = title.replace(/[\\/*?:[\]]/g, '').slice(0, 31) || 'Report';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), timestampedFilename(title, 'xlsx'));
}

/**
 * Exports rows as a CSV file (comma-separated, quoted where needed).
 */
export function exportToCSV(title, columns, rows) {
  const { header, body } = toTableRows(columns, rows);
  const escape = (val) => {
    const str = String(val ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [header, ...body].map((line) => line.map(escape).join(','));
  const csvContent = lines.join('\n');

  saveAs(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), timestampedFilename(title, 'csv'));
}

/** Single entry point used by the Export modal — dispatches to the right format. */
export function exportReport(format, title, columns, rows) {
  if (format === 'pdf') return exportToPDF(title, columns, rows);
  if (format === 'excel') return exportToExcel(title, columns, rows);
  if (format === 'csv') return exportToCSV(title, columns, rows);
  throw new Error(`Unsupported export format: ${format}`);
}
