import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export interface ExcelTemplate {
  id: string;
  title: string;
  description: string;
  generate: () => Promise<void>;
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, size: 11, name: "Calibri" };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1A1A1A" },
  };
  row.font = { bold: true, size: 11, name: "Calibri", color: { argb: "FFFFFFFF" } };
  row.alignment = { horizontal: "center", vertical: "middle" };
  row.height = 24;
}

function styleSectionHeader(row: ExcelJS.Row) {
  row.font = { bold: true, size: 11, name: "Calibri" };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF0F0F0" },
  };
  row.height = 22;
}

function addBorders(sheet: ExcelJS.Worksheet, startRow: number, endRow: number, cols: number) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = 1; c <= cols; c++) {
      const cell = sheet.getCell(r, c);
      cell.border = {
        top: { style: "thin", color: { argb: "FFE0E0E0" } },
        bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
        left: { style: "thin", color: { argb: "FFE0E0E0" } },
        right: { style: "thin", color: { argb: "FFE0E0E0" } },
      };
    }
  }
}

async function saveWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename);
}

async function generatePnL() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Profit & Loss");

  ws.columns = [
    { header: "", width: 35 },
    { header: "Jan", width: 14 },
    { header: "Feb", width: 14 },
    { header: "Mar", width: 14 },
    { header: "Apr", width: 14 },
    { header: "May", width: 14 },
    { header: "Jun", width: 14 },
    { header: "Jul", width: 14 },
    { header: "Aug", width: 14 },
    { header: "Sep", width: 14 },
    { header: "Oct", width: 14 },
    { header: "Nov", width: 14 },
    { header: "Dec", width: 14 },
    { header: "Total", width: 16 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.values = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Total"];
  styleHeader(headerRow);

  let r = 2;
  const sections = [
    { label: "REVENUE", items: ["Product Revenue", "Service Revenue", "Other Revenue"], total: "Total Revenue" },
    { label: "COST OF GOODS SOLD", items: ["Hosting / Infrastructure", "Payment Processing Fees", "Direct Labor"], total: "Total COGS" },
    { label: "GROSS PROFIT", items: [], total: null },
    { label: "OPERATING EXPENSES", items: ["Salaries & Wages", "Contractor / Freelancer", "Software & Tools", "Marketing & Ads", "Legal & Accounting", "Insurance", "Rent / Office", "Travel & Meals", "Miscellaneous"], total: "Total Operating Expenses" },
    { label: "OPERATING INCOME", items: [], total: null },
    { label: "OTHER INCOME / EXPENSES", items: ["Interest Income", "Interest Expense", "Tax Provision"], total: "Net Other" },
    { label: "NET INCOME", items: [], total: null },
  ];

  for (const section of sections) {
    const sectionRow = ws.getRow(r);
    sectionRow.getCell(1).value = section.label;
    styleSectionHeader(sectionRow);
    r++;

    for (const item of section.items) {
      ws.getRow(r).getCell(1).value = `  ${item}`;
      // Format currency columns
      for (let c = 2; c <= 14; c++) {
        ws.getRow(r).getCell(c).numFmt = '$#,##0.00';
      }
      r++;
    }

    if (section.total) {
      const totalRow = ws.getRow(r);
      totalRow.getCell(1).value = section.total;
      totalRow.font = { bold: true, name: "Calibri", size: 11 };
      for (let c = 2; c <= 14; c++) {
        totalRow.getCell(c).numFmt = '$#,##0.00';
      }
      r++;
    }

    r++; // blank row between sections
  }

  addBorders(ws, 1, r - 1, 14);
  await saveWorkbook(wb, "profit-and-loss.xlsx");
}

async function generateBalanceSheet() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Balance Sheet");

  ws.columns = [
    { header: "", width: 35 },
    { header: "Current Period", width: 18 },
    { header: "Prior Period", width: 18 },
    { header: "Change", width: 16 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.values = ["", "Current Period", "Prior Period", "Change"];
  styleHeader(headerRow);

  let r = 2;
  const sections = [
    { label: "ASSETS", items: [] },
    { label: "Current Assets", items: ["Cash & Cash Equivalents", "Accounts Receivable", "Prepaid Expenses", "Inventory", "Other Current Assets"], total: "Total Current Assets" },
    { label: "Non-Current Assets", items: ["Property & Equipment", "Accumulated Depreciation", "Intangible Assets", "Other Non-Current Assets"], total: "Total Non-Current Assets" },
    { label: "", items: [], total: "TOTAL ASSETS" },
    { label: "LIABILITIES", items: [] },
    { label: "Current Liabilities", items: ["Accounts Payable", "Accrued Expenses", "Credit Card Payable", "Sales Tax Payable", "Short-Term Debt", "Deferred Revenue"], total: "Total Current Liabilities" },
    { label: "Non-Current Liabilities", items: ["Long-Term Debt", "Notes Payable", "Other Non-Current Liabilities"], total: "Total Non-Current Liabilities" },
    { label: "", items: [], total: "TOTAL LIABILITIES" },
    { label: "EQUITY", items: ["Common Stock", "Additional Paid-in Capital", "Retained Earnings", "Owner's Draws"], total: "TOTAL EQUITY" },
    { label: "", items: [], total: "TOTAL LIABILITIES & EQUITY" },
  ];

  for (const section of sections) {
    if (section.label) {
      const sectionRow = ws.getRow(r);
      sectionRow.getCell(1).value = section.label;
      styleSectionHeader(sectionRow);
      r++;
    }
    for (const item of section.items) {
      ws.getRow(r).getCell(1).value = `  ${item}`;
      for (let c = 2; c <= 4; c++) ws.getRow(r).getCell(c).numFmt = '$#,##0.00';
      r++;
    }
    if (section.total) {
      const totalRow = ws.getRow(r);
      totalRow.getCell(1).value = section.total;
      totalRow.font = { bold: true, name: "Calibri", size: 11 };
      for (let c = 2; c <= 4; c++) totalRow.getCell(c).numFmt = '$#,##0.00';
      r++;
    }
    r++;
  }

  addBorders(ws, 1, r - 1, 4);
  await saveWorkbook(wb, "balance-sheet.xlsx");
}

async function generateCashFlow() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Cash Flow");

  ws.columns = [
    { header: "", width: 40 },
    { header: "Current Period", width: 18 },
    { header: "Prior Period", width: 18 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.values = ["", "Current Period", "Prior Period"];
  styleHeader(headerRow);

  let r = 2;
  const sections = [
    { label: "OPERATING ACTIVITIES", items: ["Net Income", "Depreciation & Amortization", "Change in Accounts Receivable", "Change in Inventory", "Change in Prepaid Expenses", "Change in Accounts Payable", "Change in Accrued Expenses", "Change in Deferred Revenue", "Other Operating Adjustments"], total: "Net Cash from Operations" },
    { label: "INVESTING ACTIVITIES", items: ["Purchase of Equipment", "Sale of Equipment", "Purchase of Investments", "Sale of Investments", "Other Investing Activities"], total: "Net Cash from Investing" },
    { label: "FINANCING ACTIVITIES", items: ["Proceeds from Equity (SAFE, Priced Round)", "Repayment of Debt", "Proceeds from Debt", "Owner's Draws / Distributions", "Other Financing Activities"], total: "Net Cash from Financing" },
    { label: "SUMMARY", items: ["Net Change in Cash", "Beginning Cash Balance"], total: "Ending Cash Balance" },
  ];

  for (const section of sections) {
    const sectionRow = ws.getRow(r);
    sectionRow.getCell(1).value = section.label;
    styleSectionHeader(sectionRow);
    r++;
    for (const item of section.items) {
      ws.getRow(r).getCell(1).value = `  ${item}`;
      for (let c = 2; c <= 3; c++) ws.getRow(r).getCell(c).numFmt = '$#,##0.00';
      r++;
    }
    if (section.total) {
      const totalRow = ws.getRow(r);
      totalRow.getCell(1).value = section.total;
      totalRow.font = { bold: true, name: "Calibri", size: 11 };
      for (let c = 2; c <= 3; c++) totalRow.getCell(c).numFmt = '$#,##0.00';
      r++;
    }
    r++;
  }

  addBorders(ws, 1, r - 1, 3);
  await saveWorkbook(wb, "cash-flow-statement.xlsx");
}

async function generateChartOfAccounts() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Chart of Accounts");

  ws.columns = [
    { header: "Account #", width: 14 },
    { header: "Account Name", width: 35 },
    { header: "Type", width: 18 },
    { header: "Sub-Type", width: 22 },
    { header: "Description", width: 45 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.values = ["Account #", "Account Name", "Type", "Sub-Type", "Description"];
  styleHeader(headerRow);

  const accounts = [
    ["1000", "Cash — Checking", "Asset", "Current", "Primary business checking account"],
    ["1010", "Cash — Savings", "Asset", "Current", "Business savings / reserve account"],
    ["1100", "Accounts Receivable", "Asset", "Current", "Amounts owed by customers"],
    ["1200", "Prepaid Expenses", "Asset", "Current", "Annual subscriptions, insurance paid in advance"],
    ["1500", "Equipment", "Asset", "Fixed", "Computers, hardware, office equipment"],
    ["1510", "Accumulated Depreciation", "Asset", "Fixed", "Contra-asset for equipment depreciation"],
    ["2000", "Accounts Payable", "Liability", "Current", "Bills owed to vendors"],
    ["2100", "Credit Card Payable", "Liability", "Current", "Outstanding credit card balance"],
    ["2200", "Accrued Expenses", "Liability", "Current", "Expenses incurred but not yet paid"],
    ["2300", "Sales Tax Payable", "Liability", "Current", "Collected sales tax not yet remitted"],
    ["2400", "Deferred Revenue", "Liability", "Current", "Prepaid subscriptions / payments received in advance"],
    ["2500", "Payroll Liabilities", "Liability", "Current", "Withheld payroll taxes and benefits"],
    ["2700", "Notes Payable", "Liability", "Long-Term", "Loans, convertible notes"],
    ["3000", "Common Stock", "Equity", "Equity", "Par value of issued shares"],
    ["3100", "Additional Paid-in Capital", "Equity", "Equity", "Amount received above par value (SAFE conversions, etc.)"],
    ["3200", "Retained Earnings", "Equity", "Equity", "Cumulative net income less distributions"],
    ["3300", "Owner's Draws", "Equity", "Equity", "Distributions to owners"],
    ["4000", "Product Revenue", "Revenue", "Revenue", "SaaS subscriptions, product sales"],
    ["4100", "Service Revenue", "Revenue", "Revenue", "Consulting, freelance, contract work"],
    ["4200", "Other Revenue", "Revenue", "Revenue", "Interest, affiliate income, etc."],
    ["5000", "Hosting & Infrastructure", "Expense", "COGS", "AWS, Vercel, Supabase, cloud hosting"],
    ["5100", "Payment Processing", "Expense", "COGS", "Stripe fees, PayPal fees"],
    ["6000", "Salaries & Wages", "Expense", "Operating", "Employee compensation"],
    ["6100", "Contractor Payments", "Expense", "Operating", "Freelancers, agencies, consultants"],
    ["6200", "Software & Tools", "Expense", "Operating", "GitHub, Figma, Notion, Slack, etc."],
    ["6300", "Marketing & Advertising", "Expense", "Operating", "Google Ads, social, content marketing"],
    ["6400", "Legal & Professional", "Expense", "Operating", "Lawyer, accountant, registered agent"],
    ["6500", "Insurance", "Expense", "Operating", "General liability, E&O, D&O"],
    ["6600", "Rent & Office", "Expense", "Operating", "Coworking, office lease"],
    ["6700", "Travel & Meals", "Expense", "Operating", "Business travel, client meals"],
    ["6800", "Depreciation", "Expense", "Operating", "Equipment depreciation expense"],
    ["6900", "Miscellaneous", "Expense", "Operating", "Other business expenses"],
    ["7000", "Interest Income", "Other", "Other Income", "Bank account interest"],
    ["7100", "Interest Expense", "Other", "Other Expense", "Loan interest"],
    ["8000", "Income Tax Provision", "Other", "Tax", "Federal and state income tax estimate"],
  ];

  let r = 2;
  for (const row of accounts) {
    const wsRow = ws.getRow(r);
    wsRow.values = row;
    wsRow.font = { name: "Calibri", size: 11 };
    r++;
  }

  addBorders(ws, 1, r - 1, 5);
  await saveWorkbook(wb, "chart-of-accounts.xlsx");
}

async function generateExpenseTracker() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Expenses");

  ws.columns = [
    { header: "Date", width: 14 },
    { header: "Vendor / Payee", width: 25 },
    { header: "Description", width: 35 },
    { header: "Category", width: 20 },
    { header: "Payment Method", width: 18 },
    { header: "Amount", width: 14 },
    { header: "Tax Deductible", width: 16 },
    { header: "Receipt", width: 12 },
    { header: "Notes", width: 30 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.values = ["Date", "Vendor / Payee", "Description", "Category", "Payment Method", "Amount", "Tax Deductible", "Receipt", "Notes"];
  styleHeader(headerRow);

  // Example row
  const exRow = ws.getRow(2);
  exRow.values = ["2026-01-15", "Vercel", "Pro plan — monthly", "Hosting", "Credit Card", 20, "Yes", "Y", ""];
  exRow.font = { name: "Calibri", size: 11, color: { argb: "FF999999" } };
  exRow.getCell(6).numFmt = '$#,##0.00';

  // Data validation for category
  for (let r = 3; r <= 500; r++) {
    ws.getRow(r).getCell(6).numFmt = '$#,##0.00';
  }

  addBorders(ws, 1, 2, 9);
  await saveWorkbook(wb, "expense-tracker.xlsx");
}

async function generateInvoiceLog() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Invoices");

  ws.columns = [
    { header: "Invoice #", width: 12 },
    { header: "Date Issued", width: 14 },
    { header: "Due Date", width: 14 },
    { header: "Client", width: 25 },
    { header: "Description", width: 35 },
    { header: "Amount", width: 14 },
    { header: "Status", width: 14 },
    { header: "Date Paid", width: 14 },
    { header: "Notes", width: 30 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.values = ["Invoice #", "Date Issued", "Due Date", "Client", "Description", "Amount", "Status", "Date Paid", "Notes"];
  styleHeader(headerRow);

  for (let r = 2; r <= 500; r++) {
    ws.getRow(r).getCell(6).numFmt = '$#,##0.00';
  }

  addBorders(ws, 1, 1, 9);
  await saveWorkbook(wb, "invoice-log.xlsx");
}

async function generateBudget() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Annual Budget");

  ws.columns = [
    { header: "", width: 30 },
    { header: "Budget", width: 14 },
    { header: "Actual", width: 14 },
    { header: "Variance", width: 14 },
    { header: "% Variance", width: 14 },
    { header: "Notes", width: 30 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.values = ["Category", "Budget", "Actual", "Variance", "% Variance", "Notes"];
  styleHeader(headerRow);

  let r = 2;
  const categories = [
    { label: "REVENUE", items: ["Product Revenue", "Service Revenue", "Other Revenue"], total: "Total Revenue" },
    { label: "EXPENSES", items: ["Salaries & Wages", "Contractors", "Hosting & Infrastructure", "Software & Tools", "Marketing & Ads", "Legal & Accounting", "Insurance", "Rent / Office", "Travel & Meals", "Miscellaneous"], total: "Total Expenses" },
    { label: "", items: [], total: "NET INCOME" },
  ];

  for (const section of categories) {
    if (section.label) {
      const sectionRow = ws.getRow(r);
      sectionRow.getCell(1).value = section.label;
      styleSectionHeader(sectionRow);
      r++;
    }
    for (const item of section.items) {
      ws.getRow(r).getCell(1).value = `  ${item}`;
      for (let c = 2; c <= 4; c++) ws.getRow(r).getCell(c).numFmt = '$#,##0.00';
      ws.getRow(r).getCell(5).numFmt = '0.0%';
      r++;
    }
    if (section.total) {
      const totalRow = ws.getRow(r);
      totalRow.getCell(1).value = section.total;
      totalRow.font = { bold: true, name: "Calibri", size: 11 };
      for (let c = 2; c <= 4; c++) totalRow.getCell(c).numFmt = '$#,##0.00';
      totalRow.getCell(5).numFmt = '0.0%';
      r++;
    }
    r++;
  }

  addBorders(ws, 1, r - 1, 6);
  await saveWorkbook(wb, "annual-budget.xlsx");
}

async function generateAuditChecklist() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Audit Checklist");

  ws.columns = [
    { header: "Category", width: 22 },
    { header: "Item", width: 45 },
    { header: "Status", width: 14 },
    { header: "Last Reviewed", width: 16 },
    { header: "Reviewed By", width: 18 },
    { header: "Notes", width: 35 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.values = ["Category", "Item", "Status", "Last Reviewed", "Reviewed By", "Notes"];
  styleHeader(headerRow);

  const items = [
    ["Financial Controls", "Separate business and personal bank accounts"],
    ["Financial Controls", "Two-person approval for payments over $1,000"],
    ["Financial Controls", "Monthly bank reconciliation completed"],
    ["Financial Controls", "Credit card statements reviewed monthly"],
    ["Financial Controls", "Petty cash reconciled"],
    ["Revenue", "All invoices recorded and matched to payments"],
    ["Revenue", "Revenue recognition policy documented"],
    ["Revenue", "Deferred revenue properly accounted for"],
    ["Revenue", "Accounts receivable aging reviewed"],
    ["Expenses", "All receipts collected and filed"],
    ["Expenses", "Expense categories consistent and accurate"],
    ["Expenses", "No personal expenses in business accounts"],
    ["Expenses", "Contractor 1099s prepared (by Jan 31)"],
    ["Payroll", "Payroll taxes filed on time"],
    ["Payroll", "W-2s / 1099s issued on time"],
    ["Payroll", "Employee benefits properly recorded"],
    ["Tax Compliance", "Quarterly estimated taxes paid"],
    ["Tax Compliance", "Sales tax collected and remitted"],
    ["Tax Compliance", "Delaware franchise tax paid (by Mar 1)"],
    ["Tax Compliance", "State tax registrations current"],
    ["Tax Compliance", "Annual report filed"],
    ["Records", "Chart of accounts up to date"],
    ["Records", "Financial statements prepared monthly"],
    ["Records", "Board minutes / consents filed"],
    ["Records", "Insurance policies current"],
    ["Records", "All contracts and agreements filed"],
  ];

  let r = 2;
  for (const [category, item] of items) {
    const wsRow = ws.getRow(r);
    wsRow.values = [category, item, "", "", "", ""];
    wsRow.font = { name: "Calibri", size: 11 };
    r++;
  }

  addBorders(ws, 1, r - 1, 6);
  await saveWorkbook(wb, "audit-checklist.xlsx");
}

export const EXCEL_TEMPLATES: ExcelTemplate[] = [
  {
    id: "pnl",
    title: "Profit & Loss Statement",
    description: "Monthly P&L with revenue, COGS, operating expenses, and net income. 12-month view.",
    generate: generatePnL,
  },
  {
    id: "balance-sheet",
    title: "Balance Sheet",
    description: "Assets, liabilities, and equity with current vs. prior period comparison.",
    generate: generateBalanceSheet,
  },
  {
    id: "cash-flow",
    title: "Cash Flow Statement",
    description: "Operating, investing, and financing activities. Track where your cash goes.",
    generate: generateCashFlow,
  },
  {
    id: "chart-of-accounts",
    title: "Chart of Accounts",
    description: "Standard account structure for a startup — assets, liabilities, equity, revenue, expenses.",
    generate: generateChartOfAccounts,
  },
  {
    id: "expense-tracker",
    title: "Expense Tracker",
    description: "Log every expense with category, payment method, tax deductibility, and receipt status.",
    generate: generateExpenseTracker,
  },
  {
    id: "invoice-log",
    title: "Invoice Log",
    description: "Track invoices issued, due dates, payment status, and amounts outstanding.",
    generate: generateInvoiceLog,
  },
  {
    id: "budget",
    title: "Annual Budget",
    description: "Budget vs. actual comparison with variance tracking for revenue and expenses.",
    generate: generateBudget,
  },
  {
    id: "audit-checklist",
    title: "Audit Checklist",
    description: "Financial controls, tax compliance, payroll, and record-keeping audit checklist.",
    generate: generateAuditChecklist,
  },
];
