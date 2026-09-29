"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import type { Decision } from "@/lib/case-types";
import { euro, humanize } from "@/lib/format";

type Filter = "all" | "operational" | "material" | "high" | "medium" | "low" | "overrides" | "disagreements" | "uncertainty";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "operational", label: "Operational" },
  { key: "material", label: "Material" },
  { key: "high", label: "High confidence" },
  { key: "medium", label: "Medium confidence" },
  { key: "low", label: "Low confidence" },
  { key: "overrides", label: "Overrides" },
  { key: "disagreements", label: "Disagreements" },
  { key: "uncertainty", label: "Uncertainty" },
];

function matchesFilter(decision: Decision, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "operational") return decision.reviewTier === "operational";
  if (filter === "material") return decision.reviewTier === "material_judgment";
  if (["high", "medium", "low"].includes(filter)) return decision.confidence === filter;
  if (filter === "overrides") return Boolean(decision.changedFromAI);
  if (filter === "disagreements") return Boolean(decision.disagreement);
  return Boolean(decision.uncertainty);
}

function EffectGrid({ decision }: { decision: Decision }) {
  if (!decision.statementEffect) return null;
  return (
    <div className="effect-grid" aria-label="Statement effect relative to the treatment considered">
      {Object.entries(decision.statementEffect).map(([label, value]) => (
        <div key={label}>
          <span>{humanize(label)}</span>
          <strong className={value && value < 0 ? "negative" : value && value > 0 ? "positive" : "neutral"}>
            {value === null ? "n.a." : euro.format(value)}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function DecisionExplorer({ decisions }: { decisions: Decision[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return decisions.filter((decision) => {
      const haystack = [decision.id, decision.question, decision.answer, ...decision.evidence].join(" ").toLowerCase();
      return matchesFilter(decision, filter) && (!normalized || haystack.includes(normalized));
    });
  }, [decisions, filter, query]);

  return (
    <div>
      <div className="decision-tools">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search decisions</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID, issue, answer or evidence…" />
        </label>
        <div className="result-count"><SlidersHorizontal size={15} /> {visible.length} of {decisions.length}</div>
      </div>
      <div className="filter-row" role="group" aria-label="Decision filters">
        {filters.map((item) => (
          <button type="button" key={item.key} className={filter === item.key ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item.key)} aria-pressed={filter === item.key}>{item.label}</button>
        ))}
      </div>

      <div className="decision-list">
        {visible.map((decision) => (
          <details className="decision-card" key={decision.id}>
            <summary>
              <div className="decision-id-block"><span>{decision.id}</span><small>{decision.reviewTier === "material_judgment" ? "Judgment" : "Fact review"}</small></div>
              <div className="decision-summary-copy"><h3>{decision.question}</h3><p>{decision.answer}</p></div>
              <div className="decision-flags">
                {decision.changedFromAI && <span className="tag tag-override">Override</span>}
                {decision.disagreement && <span className="tag tag-disagreement">Disagreement</span>}
                {decision.uncertainty && <span className="tag tag-uncertainty">Uncertainty</span>}
                <span className={`confidence confidence-${decision.confidence}`}>{humanize(decision.confidence)}</span>
                <ChevronDown className="decision-chevron" size={18} aria-hidden="true" />
              </div>
            </summary>
            <div className="decision-detail">
              {decision.reviewTier === "material_judgment" && (
                <div className="review-trail-grid">
                  <article><p className="detail-label">Agent 1 proposal</p><p>{decision.aiProposal}</p></article>
                  <article><p className="detail-label">Independent challenge</p><p>{decision.independentChallenge}</p></article>
                  <article className="student-decision"><p className="detail-label">Final student certification</p><p>{decision.answer}</p></article>
                  <article><p className="detail-label">Reasoning</p><p>{decision.studentReasoning}</p></article>
                </div>
              )}
              <EffectGrid decision={decision} />
              {decision.uncertainty && <div className="uncertainty-note"><strong>Uncertainty</strong><p>{decision.uncertainty}</p></div>}
              <div className="evidence-list"><p className="detail-label">Evidence</p><ul>{decision.evidence.map((source) => <li key={source}>{source}</li>)}</ul></div>
            </div>
          </details>
        ))}
        {visible.length === 0 && <div className="empty-state"><Search size={22} /><strong>No decisions match</strong><p>Try another search term or filter.</p></div>}
      </div>
    </div>
  );
}
