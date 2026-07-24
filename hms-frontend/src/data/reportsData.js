// Column definitions reused by both the on-screen Table and the PDF/Excel/CSV
// export, so what the user sees is always exactly what gets exported.
// The actual row data now comes from the backend (/api/reports/*) — see
// ReportTableView.jsx — not from mock data.
export const reportColumns = {
  opd: [
    { key: 'id', header: 'Report ID' },
    { key: 'date', header: 'Date' },
    { key: 'patients', header: 'Patients' },
    { key: 'consultations', header: 'Consultations' },
    { key: 'revenue', header: 'Revenue', formatCurrency: true },
  ],
  ipd: [
    { key: 'id', header: 'Report ID' },
    { key: 'date', header: 'Date' },
    { key: 'admissions', header: 'Admissions' },
    { key: 'discharges', header: 'Discharges' },
    { key: 'occupancy', header: 'Occupancy' },
    { key: 'revenue', header: 'Revenue', formatCurrency: true },
  ],
  pharmacy: [
    { key: 'id', header: 'Report ID' },
    { key: 'date', header: 'Date' },
    { key: 'itemsSold', header: 'Items Sold' },
    { key: 'revenue', header: 'Revenue', formatCurrency: true },
    { key: 'topMedicine', header: 'Top Medicine' },
    { key: 'stock', header: 'Top Medicine — Current Stock' },
  ],
  revenue: [
    { key: 'id', header: 'ID' },
    { key: 'source', header: 'Revenue Source' },
    { key: 'amount', header: 'Amount', formatCurrency: true },
    { key: 'percentage', header: 'Percentage' },
    { key: 'trend', header: 'Trend' },
  ],
};

export const reportTitleByTab = {
  opd: 'OPD Report',
  ipd: 'IPD Report',
  pharmacy: 'Pharmacy Report',
  revenue: 'Revenue Report',
};
