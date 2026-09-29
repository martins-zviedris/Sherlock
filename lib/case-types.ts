export type Confidence = "low" | "medium" | "high";
export type ReviewTier = "operational" | "material_judgment";

export type StatementEffect = {
  profit: number | null;
  cash: number | null;
  assets: number | null;
  liabilities: number | null;
  equity: number | null;
};

export type Decision = {
  id: string;
  category: string;
  reviewTier: ReviewTier;
  question: string;
  answer: string;
  evidence: string[];
  confidence: Confidence;
  uncertainty?: string | null;
  aiProposal?: string;
  independentChallenge?: string;
  studentReasoning?: string;
  statementEffect?: StatementEffect;
  changedFromAI?: boolean;
  disagreement?: boolean;
};

export type Schedule = {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  totals?: (string | number)[];
  notes: string[];
};

export type Reconciliation = {
  name: string;
  status: "pass" | "caution" | "unresolved";
  equation: string;
};

export type Uncertainty = {
  title: string;
  confidence: Confidence;
  detail: string;
};
