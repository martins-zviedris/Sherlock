import { formatCell } from "@/lib/format";

type Row = [string, number];
type StatementData = {
  profitAndLoss: { title: string; rows: Row[] };
  cashFlow: { title: string; rows: Row[] };
  balanceSheet: { title: string; sections: { title: string; rows: Row[] }[] };
};

const strongRows = new Set([
  "Total COGS", "Gross profit", "EBIT", "Profit before tax", "Net cash from operating activities",
  "Net cash used in investing activities", "Net cash used in financing activities", "Net movement in cash",
  "Closing cash", "Total assets", "Total liabilities", "Closing equity", "Total liabilities and equity",
]);

function StatementRows({ rows }: { rows: Row[] }) {
  return (
    <div className="statement-rows">
      {rows.map(([label, value]) => (
        <div className={strongRows.has(label) ? "statement-row statement-total" : "statement-row"} key={label}>
          <span>{label}</span><strong className={value < 0 ? "negative" : ""}>{formatCell(value)}</strong>
        </div>
      ))}
    </div>
  );
}

export function FinancialStatements({ statements }: { statements: StatementData }) {
  return (
    <div className="statement-tabs">
      <nav className="statement-tablist" aria-label="Financial statement index">
        <a href="#profit-and-loss">Profit &amp; Loss</a>
        <a href="#cash-flow-statement">Cash Flow</a>
        <a href="#balance-sheet">Balance Sheet</a>
      </nav>
      <div className="statement-stack">
        <article id="profit-and-loss" className="statement-sheet"><header><p>Divorce Party International Ltd.</p><h3>Profit and Loss Statement</h3><span>Period ended 31 August 2026 · EUR · Selected reconstruction subject to disclosed qualifications</span></header><StatementRows rows={statements.profitAndLoss.rows} /><p className="statement-footnote">VAT and corporate income tax are outside the case scope. Profit remains qualified for the unresolved inventory contradiction, provisional depreciation, missing insurance evidence and owner-card classification.</p></article>
        <article id="cash-flow-statement" className="statement-sheet"><header><p>Divorce Party International Ltd.</p><h3>Cash Flow Statement</h3><span>Period ended 31 August 2026 · EUR · Direct method</span></header><StatementRows rows={statements.cashFlow.rows} /><p className="statement-footnote">Interest paid is classified as an operating cash flow. Closing cash agrees to the bank evidence.</p></article>
        <article id="balance-sheet" className="statement-sheet"><header><p>Divorce Party International Ltd.</p><h3>Balance Sheet</h3><span>At 31 August 2026 · EUR · Arithmetically balanced, evidentially qualified</span></header>{statements.balanceSheet.sections.map((section) => <section className="balance-section" key={section.title}><h4>{section.title}</h4><StatementRows rows={section.rows} /></section>)}<p className="statement-footnote">The statement balances mathematically. Inventory, depreciation and reconstructed opening equity remain unresolved or provisional as disclosed below.</p></article>
      </div>
    </div>
  );
}
