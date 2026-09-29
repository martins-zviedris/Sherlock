import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const submission = JSON.parse(fs.readFileSync("public/submission.json", "utf8"));
const schema = JSON.parse(fs.readFileSync("public/submission-schema.json", "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

if (!validate(submission)) {
  console.error(validate.errors);
  process.exit(1);
}

const ids = submission.decisions.map((decision) => decision.id);
const expected = Array.from({ length: 100 }, (_, index) => `D${String(index + 1).padStart(3, "0")}`);
const checks = [
  ["100 decisions", ids.length === 100],
  ["100 unique IDs", new Set(ids).size === 100],
  ["D001-D100 complete and ordered", JSON.stringify(ids) === JSON.stringify(expected)],
  ["75 operational", submission.decisions.filter((decision) => decision.reviewTier === "operational").length === 75],
  ["25 material", submission.decisions.filter((decision) => decision.reviewTier === "material_judgment").length === 25],
  ["all evidence populated", submission.decisions.every((decision) => decision.evidence.length > 0)],
  ["all answers populated", submission.decisions.every((decision) => String(decision.answer).trim().length > 0)],
  ["material review trails complete", submission.decisions.filter((decision) => decision.reviewTier === "material_judgment").every((decision) => decision.aiProposal && decision.independentChallenge && decision.studentReasoning && decision.statementEffect && typeof decision.changedFromAI === "boolean")],
  ["balance sheet balances", submission.statements.balanceSheet.sections[0].rows.at(-1)[1] === submission.statements.balanceSheet.sections[2].rows.at(-1)[1]],
  ["cash closes at EUR 60,000", submission.statements.cashFlow.rows.at(-1)[1] === 60000],
  ["profit before tax is EUR 74,000", submission.statements.profitAndLoss.rows.at(-1)[1] === 74000],
];

const failures = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) console.log(`${pass ? "PASS" : "FAIL"}  ${name}`);
if (failures.length) process.exit(1);
console.log("PASS  official JSON schema");
