import { ArrowLeft, CircleAlert, GitCompareArrows, RefreshCcw } from "lucide-react";
import Link from "next/link";
import submission from "@/public/submission.json";
import type { Decision, Uncertainty } from "@/lib/case-types";
import { euro, humanize } from "@/lib/format";

const decisions = submission.decisions as unknown as Decision[];
const material = decisions.filter((item) => item.reviewTier === "material_judgment");
const uncertainties = submission.uncertainties as Uncertainty[];

const counters = [
  ["Total decisions", decisions.length],
  ["High confidence", decisions.filter((item) => item.confidence === "high").length],
  ["Medium confidence", decisions.filter((item) => item.confidence === "medium").length],
  ["Low confidence", decisions.filter((item) => item.confidence === "low").length],
  ["Disagreements", material.filter((item) => item.disagreement).length],
  ["Overrides", material.filter((item) => item.changedFromAI).length],
  ["Qualifications", uncertainties.length],
] as const;

export default function ReviewPage() {
  return (
    <main className="review-page">
      <header className="review-header"><div><Link href="/"><ArrowLeft size={16} /> Main reconstruction</Link><p className="eyebrow">Compact assessor view</p><h1>Material judgment review</h1><p>Twenty-five certified judgments, their independent AI positions, financial effects and visible limitations.</p></div><div className="review-status"><CircleAlert size={20} /><span><strong>Arithmetically balanced; evidentially qualified</strong><small>Inventory, depreciation and opening equity remain unresolved or provisional</small></span></div></header>

      <section className="review-counter-grid" aria-label="Review summary">{counters.map(([label, value]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}</section>

      <section className="review-priority-grid">
        <article><header><GitCompareArrows size={19} /><h2>Agent disagreements</h2><span>{material.filter((item) => item.disagreement).length}</span></header><div>{material.filter((item) => item.disagreement).map((item) => <a href={`#${item.id}`} key={item.id}><strong>{item.id}</strong><span>{item.question}</span></a>)}</div></article>
        <article><header><RefreshCcw size={19} /><h2>Student overrides</h2><span>{material.filter((item) => item.changedFromAI).length}</span></header><div>{material.filter((item) => item.changedFromAI).map((item) => <a href={`#${item.id}`} key={item.id}><strong>{item.id}</strong><span>{item.question}</span></a>)}</div></article>
        <article><header><CircleAlert size={19} /><h2>Qualifications</h2><span>{uncertainties.length}</span></header><div>{uncertainties.map((item) => <a href="#qualifications" key={item.title}><strong>{humanize(item.confidence)}</strong><span>{item.title}</span></a>)}</div></article>
        <article><header><CircleAlert size={19} /><h2>Low-confidence decisions</h2><span>{decisions.filter((item) => item.confidence === "low").length}</span></header><div>{decisions.filter((item) => item.confidence === "low").map((item) => <Link href={`/?decision=${item.id}#decisions`} key={item.id}><strong>{item.id}</strong><span>{item.question}</span></Link>)}</div></article>
      </section>

      <section className="material-review-list" aria-labelledby="material-title"><div className="review-section-heading"><p className="eyebrow">AI review trail</p><h2 id="material-title">25 material judgments</h2><p>Statement effects are decision-level effects against the contrary treatment considered. Overlapping decisions must not be added together.</p></div>{material.map((item) => <article id={item.id} className="material-review-card" key={item.id}><header><div><span className="material-id">{item.id}</span><span className={`confidence confidence-${item.confidence}`}>{item.confidence}</span>{item.disagreement && <span className="tag tag-disagreement">Disagreement</span>}{item.changedFromAI && <span className="tag tag-override">Override</span>}</div><h3>{item.question}</h3></header><div className="material-positions"><section><p>Agent 1</p><span>{item.aiProposal}</span></section><section><p>Independent challenge</p><span>{item.independentChallenge}</span></section></div><div className="certification-block"><p>Final student certification</p><strong>{item.answer}</strong><span>{item.studentReasoning}</span></div>{item.statementEffect && <div className="review-effect-row">{Object.entries(item.statementEffect).map(([label, value]) => <div key={label}><span>{humanize(label)}</span><strong className={value && value < 0 ? "negative" : value && value > 0 ? "positive" : "neutral"}>{value === null ? "n.a." : euro.format(value)}</strong></div>)}</div>}{item.uncertainty && <div className="review-warning"><CircleAlert size={17} /><span><strong>Remaining uncertainty</strong>{item.uncertainty}</span></div>}<footer><strong>Evidence</strong>{item.evidence.map((source) => <span key={source}>{source}</span>)}</footer></article>)}</section>

      <section id="qualifications" className="review-qualifications"><div className="review-section-heading"><p className="eyebrow">Required disclosure</p><h2>Six qualifications</h2></div><div>{uncertainties.map((item, index) => <article key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div></article>)}</div></section>

      <section className="review-conclusion"><p className="eyebrow">Assessor conclusion</p><h2>Use the €74,000 selected reconstruction only with the disclosed qualifications.</h2><p>{submission.boardRecommendation.decision}</p><a href="/submission.json">Inspect machine-readable submission</a></section>
    </main>
  );
}
