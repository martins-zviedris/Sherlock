import { ArrowRight, CheckCircle2, CircleAlert, FileJson2, Files, Scale, ShieldAlert } from "lucide-react";
import Link from "next/link";
import submission from "@/public/submission.json";
import { DecisionExplorer } from "@/components/decision-explorer";
import { FinancialStatements } from "@/components/financial-statements";
import type { Decision, Reconciliation, Schedule, Uncertainty } from "@/lib/case-types";
import { euro, formatCell } from "@/lib/format";

const decisions = submission.decisions as unknown as Decision[];
const reconciliations = submission.reconciliations as Reconciliation[];
const uncertainties = submission.uncertainties as Uncertainty[];
const schedules = Object.values(submission.schedules) as unknown as Schedule[];

const metrics = [
  ["Revenue", 960000, "Earned through 31 August"],
  ["Profit before tax", 74000, "Selected reconstruction; materially qualified"],
  ["Closing cash", 60000, "Agrees to bank confirmation"],
  ["Net receivables", 168000, "After €18,000 impairment"],
  ["Inventory", 121000, "Physical-count basis; €9k conflict disclosed"],
  ["Net PPE", 191000, "After provisional depreciation"],
  ["Total liabilities", 406000, "Including customer deposits"],
  ["Closing equity", 134000, "Arithmetically derived; opening equity unresolved"],
] as const;

const hierarchy = ["Bank records & signed contracts", "Third-party invoices", "Warehouse & delivery records", "Internal operations", "Management spreadsheets", "Emails & unsupported claims"];

export default function Home() {
  const counts = {
    high: decisions.filter((item) => item.confidence === "high").length,
    medium: decisions.filter((item) => item.confidence === "medium").length,
    low: decisions.filter((item) => item.confidence === "low").length,
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="site-header">
        <div className="site-header-inner">
          <a className="brand" href="#top" aria-label="Financial Crime Scene home"><span className="brand-mark">FC</span><span><strong>Financial Crime Scene</strong><small>DPI-HT-01 · 31 August 2026</small></span></a>
          <nav aria-label="Primary navigation"><a href="#evidence">Evidence</a><a href="#decisions">Decisions</a><a href="#schedules">Schedules</a><a href="#statements">Statements</a><a href="#reconciliations">Checks</a><Link className="review-link" href="/review">Assessor review</Link></nav>
        </div>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-grid">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2"><span className="status-pill status-caution"><CircleAlert size={14} /> Arithmetically balanced; evidence qualifications remain</span><span className="status-pill status-caution"><ShieldAlert size={14} /> 6 qualifications disclosed</span></div>
            <p className="eyebrow">Takeover accounting reconstruction</p>
            <h1>The selected evidence-based reconstruction is <span>€74,000</span> profit—not management’s €312,000 claim.</h1>
            <p className="hero-copy">A traceable reconstruction of revenue, cash, inventory, liabilities and equity for Divorce Party International Ltd. The €74,000 result remains qualified for the disclosed inventory contradiction, provisional depreciation, missing insurance evidence and owner-card classification.</p>
            <div className="hero-actions"><a className="primary-action" href="#decisions">Review 100 decisions <ArrowRight size={16} /></a><a className="secondary-action" href="/submission.json"><FileJson2 size={16} /> Open submission.json</a></div>
          </div>
          <aside className="integrity-card">
            <p className="eyebrow">Decision integrity</p>
            <div className="count-grid"><div className="count-block"><strong>{counts.high}</strong><span>High</span></div><div className="count-block count-medium"><strong>{counts.medium}</strong><span>Medium</span></div><div className="count-block count-low"><strong>{counts.low}</strong><span>Low</span></div></div>
            <dl className="integrity-list"><div><dt>Operational decisions</dt><dd>75</dd></div><div><dt>Material judgments</dt><dd>25</dd></div><div><dt>Balance sheet check</dt><dd>UNRESOLVED</dd></div><div><dt>Schema target</dt><dd>1.0</dd></div></dl>
          </aside>
        </div>
      </section>

      <section className="content-section compact-section" aria-labelledby="key-figures">
        <div className="section-heading-row"><div><p className="eyebrow">Final reconstruction</p><h2 id="key-figures" className="section-title">Key figures</h2></div><p className="section-intro">All values are EUR. VAT and corporate income tax are outside the case scope.</p></div>
        <div className="metric-grid">{metrics.map(([label, value, note]) => <article key={label}><p>{label}</p><strong>{euro.format(value)}</strong><small>{note}</small></article>)}</div>
      </section>

      <section id="evidence" className="content-section section-divider" aria-labelledby="evidence-title">
        <div className="section-heading-row"><div><p className="eyebrow">Source control</p><h2 id="evidence-title" className="section-title">Evidence overview</h2></div><p className="section-intro">Company files are evidence, not truth. Stronger external records take priority over unsupported management claims.</p></div>
        <div className="evidence-layout">
          <aside className="hierarchy-card"><div className="icon-title"><Scale size={19} /><h3>Reliability hierarchy</h3></div><ol>{hierarchy.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></aside>
          <div className="evidence-grid">{submission.evidence.map((item) => <article key={item.file}><div><span className={`reliability reliability-${item.reliability}`}>{item.reliability}</span><span className="evidence-category">{item.category}</span></div><h3>{item.file}</h3><p>{item.summary}</p></article>)}</div>
        </div>
      </section>

      <section id="decisions" className="content-section section-divider" aria-labelledby="decision-title">
        <div className="section-heading-row"><div><p className="eyebrow">Certified decision register</p><h2 id="decision-title" className="section-title">100 evidence-backed decisions</h2></div><p className="section-intro">Search, filter and expand each item. Material judgments include both AI positions, the certified decision and statement effects.</p></div>
        <DecisionExplorer decisions={decisions} />
      </section>

      <section id="schedules" className="content-section section-divider" aria-labelledby="schedules-title">
        <div className="section-heading-row"><div><p className="eyebrow">Supporting analysis</p><h2 id="schedules-title" className="section-title">Seven supporting schedules</h2></div><p className="section-intro">The schedules connect transaction-level evidence to the three financial statements.</p></div>
        <div className="schedule-grid">{schedules.map((schedule) => <article className="schedule-card" key={schedule.title}><header><Files size={18} /><h3>{schedule.title}</h3></header><div className="table-scroll"><table><thead><tr>{schedule.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{schedule.rows.map((row, rowIndex) => <tr key={`${schedule.title}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={cellIndex} className={typeof cell === "number" ? "numeric" : ""}>{formatCell(cell)}</td>)}</tr>)}{schedule.totals && <tr className="table-total">{schedule.totals.map((cell, cellIndex) => <td key={cellIndex} className={typeof cell === "number" ? "numeric" : ""}>{formatCell(cell)}</td>)}</tr>}</tbody></table></div><ul className="schedule-notes">{schedule.notes.map((note) => <li key={note}>{note}</li>)}</ul></article>)}</div>
      </section>

      <section id="statements" className="content-section section-divider" aria-labelledby="statements-title">
        <div className="section-heading-row"><div><p className="eyebrow">Selected reconstruction</p><h2 id="statements-title" className="section-title">Financial statements</h2></div><p className="section-intro">All three statements are shown in full. The selected reconstruction uses the physical inventory count and verified cash flows, while preserving unresolved evidence conflicts.</p></div>
        <FinancialStatements statements={submission.statements as never} />
      </section>

      <section id="reconciliations" className="content-section section-divider" aria-labelledby="reconciliation-title">
        <div className="section-heading-row"><div><p className="eyebrow">Control checks</p><h2 id="reconciliation-title" className="section-title">Reconciliations</h2></div><p className="section-intro">Arithmetic ties are separated from evidential resolution. Inventory, PPE, equity and the overall balance sheet remain unresolved or provisional where the source evidence is insufficient or contradictory.</p></div>
        <div className="reconciliation-grid">{reconciliations.map((item) => <article className={`reconciliation-card recon-${item.status}`} key={item.name}>{item.status === "pass" ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}<div><div className="recon-heading"><h3>{item.name}</h3><span>{item.status}</span></div><p>{item.equation}</p></div></article>)}</div>
      </section>

      <section id="uncertainty" className="content-section section-divider" aria-labelledby="uncertainty-title">
        <div className="section-heading-row"><div><p className="eyebrow">Visible limitations</p><h2 id="uncertainty-title" className="section-title">Qualifications and uncertainty</h2></div><p className="section-intro">These limitations materially qualify profit, inventory, PPE and equity even where the selected arithmetic balances.</p></div>
        <div className="uncertainty-grid">{uncertainties.map((item, index) => <article key={item.title}><div className="uncertainty-number">{String(index + 1).padStart(2, "0")}</div><div><div className="uncertainty-heading"><h3>{item.title}</h3><span className={`confidence confidence-${item.confidence}`}>{item.confidence}</span></div><p>{item.detail}</p></div></article>)}</div>
      </section>

      <section className="board-section" aria-labelledby="board-title"><div className="board-inner"><div><p className="eyebrow">Board position</p><h2 id="board-title">Use the selected reconstruction only with explicit qualifications.</h2><p>{submission.boardRecommendation.decision}</p></div><ol>{submission.boardRecommendation.actions.map((action, index) => <li key={action}><span>{index + 1}</span>{action}</li>)}</ol></div></section>

      <footer><div><strong>Financial Crime Scene · DPI-HT-01</strong><span>Evidence-led reconstruction at 31 August 2026</span></div><div><Link href="/review">Assessor review</Link><a href="/submission.json">submission.json</a></div></footer>
    </main>
  );
}
