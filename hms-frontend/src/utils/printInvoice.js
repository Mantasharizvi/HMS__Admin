// Opens a print-ready invoice in a new window and triggers the browser print dialog.
// Shared by OPD Billing and IPD Billing so both "Generate Bill" buttons behave identically.

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/**
 * @param {Object} invoice
 * @param {string} invoice.title - e.g. "OPD Invoice"
 * @param {string} invoice.invoiceNo
 * @param {string} invoice.patientName
 * @param {Array<{ label: string, amount: number }>} invoice.lineItems
 * @param {number} invoice.total
 */
export function printInvoice({ title, invoiceNo, patientName, lineItems, total }) {
  const printWindow = window.open('', '_blank', 'width=720,height=900');
  if (!printWindow) {
    // Popup blocked — fall back to printing the current page.
    window.print();
    return;
  }

  const rowsHtml = lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;color:#334155;">${item.label}</td>
          <td style="padding:8px 0;text-align:right;color:#334155;">${INR.format(item.amount)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${invoiceNo}</title>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 40px; color: #0F172A; }
          h1 { font-size: 20px; color: #0B5566; margin: 0 0 4px; }
          .meta { color: #5B6B76; font-size: 13px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          tr { border-bottom: 1px solid #E2E8F0; }
          .total-row td { font-weight: 700; font-size: 16px; padding-top: 16px; border-top: 2px solid #0B5566; border-bottom: none; }
          .footer { margin-top: 40px; font-size: 12px; color: #94A3B8; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          Invoice No: ${invoiceNo}<br />
          Patient: ${patientName}<br />
          Date: ${new Date().toLocaleString('en-IN')}
        </div>
        <table>
          ${rowsHtml}
          <tr class="total-row">
            <td>Total</td>
            <td style="text-align:right;">${INR.format(total)}</td>
          </tr>
        </table>
        <div class="footer">Thank you for choosing MediCore Hospital.</div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
  // Some browsers don't reliably fire onload for document.write — trigger a fallback too.
  setTimeout(() => {
    try {
      printWindow.print();
    } catch {
      /* window may already be closed */
    }
  }, 400);
}
