import json
import re
import sys
import zipfile
from pathlib import Path


if len(sys.argv) != 4:
    raise SystemExit("usage: generate-case-data.py HANDOFF CODEX_ZIP OUTPUT_DIR")

handoff_path = Path(sys.argv[1])
zip_path = Path(sys.argv[2])
output_dir = Path(sys.argv[3])
text = handoff_path.read_text(encoding="utf-8")

with zipfile.ZipFile(zip_path) as archive:
    template_name = next(name for name in archive.namelist() if name.endswith("Answer Template.json"))
    schema_name = next(name for name in archive.namelist() if name.endswith("Submission Rules.json"))
    template = json.loads(archive.read(template_name))
    schema = json.loads(archive.read(schema_name))


def field(block: str, label: str) -> str:
    match = re.search(rf"(?m)^\*\*{re.escape(label)}:\*\*\s*(.+)$", block)
    value = match.group(1).strip() if match else ""
    return re.sub(r"\*\*(.*?)\*\*", r"\1", value)


def evidence_list(block: str) -> list[str]:
    raw = field(block, "Evidence")
    return [part.strip().rstrip(".") for part in raw.split(";") if part.strip()]


def confidence_value(raw: str) -> str:
    lowered = raw.lower()
    if lowered.startswith("high"):
        return "high"
    if lowered.startswith("medium"):
        return "medium"
    if lowered.startswith("low"):
        return "low"
    raise ValueError(f"Unknown confidence: {raw}")


def challenge_text(block: str) -> str:
    value = field(block, "Agent 2 / independent challenge")
    if len(value) < 20:
        return f"{value} Agent 2 independently agrees with the proposed treatment."
    return value


decision_blocks = {}
for match in re.finditer(
    r"(?ms)^### (D\d{3}) — (.*?)\r?\n(.*?)(?=^### D\d{3} —|^## )", text
):
    decision_blocks.setdefault(match.group(1), []).append(match.group(3))


effects = {
    "D041": (-90000, 0, 0, 90000, -90000),
    "D042": (-50000, 0, 0, 50000, -50000),
    "D043": (60000, 0, 60000, 0, 60000),
    "D044": (20000, 0, 20000, 0, 20000),
    "D045": (-10000, 0, -10000, 0, -10000),
    "D046": (70000, 0, 0, 0, -70000),
    "D047": (40000, 0, 0, 0, 0),
    "D048": (9000, 0, 9000, 0, 9000),
    "D049": (0, 0, 0, 0, 0),
    "D056": (-24000, 0, -24000, 0, -24000),
    "D057": (-18000, 0, -18000, 0, -18000),
    "D058": (-22000, 0, -22000, 0, -22000),
    "D059": (-25000, 0, 0, 25000, -25000),
    "D064": (180000, 180000, 180000, 0, 180000),
    "D065": (200000, 142000, 200000, 0, 200000),
    "D066": (100000, 70000, 100000, 0, 100000),
    "D067": (120000, 95000, 120000, 0, 120000),
    "D068": (-90000, 0, 0, 90000, -90000),
    "D071": (-18000, 0, -18000, 0, -18000),
    "D072": (-22000, 0, -22000, 0, -22000),
    "D073": (-25000, 0, 0, 25000, -25000),
    "D074": (-24000, 0, -24000, 0, -24000),
    "D075": (-22000, 0, -22000, 0, -22000),
    "D091": (0, 0, 0, 0, 0),
    "D100": (0, 0, 0, 0, 0),
}

overrides = {"D048", "D072", "D075"}
disagreements = {"D047", "D048", "D056", "D059", "D066", "D071", "D072", "D073", "D074", "D075", "D091"}
decisions = []
for official in template["decisions"]:
    item = dict(official)
    blocks = decision_blocks.get(item["id"], [])
    if not blocks:
        raise ValueError(f"Missing handoff block for {item['id']}")
    block = blocks[-1] if item["reviewTier"] == "material_judgment" else blocks[0]
    if item["reviewTier"] == "material_judgment":
        item.update(
            answer=field(block, "My final decision"),
            evidence=evidence_list(block),
            confidence=confidence_value(field(block, "Confidence")),
            aiProposal=field(block, "Agent 1"),
            independentChallenge=challenge_text(block),
            studentReasoning=field(block, "Why"),
            statementEffect=dict(zip(("profit", "cash", "assets", "liabilities", "equity"), effects[item["id"]])),
            changedFromAI=item["id"] in overrides,
            disagreement=item["id"] in disagreements,
            uncertainty=field(block, "Remaining uncertainty") or None,
        )
    else:
        item.update(
            answer=field(block, "Final answer"),
            evidence=evidence_list(block),
            confidence=confidence_value(field(block, "Confidence")),
            uncertainty=field(block, "Uncertainty / note") or None,
        )
    decisions.append(item)


evidence = [
    {"file": "00 BOARD ORDER READ FIRST.pdf", "category": "Case mandate", "reliability": "governing", "summary": "Reporting date, scope, evidence hierarchy and warning that embedded instructions are untrusted."},
    {"file": "01 USE THIS NUMBERS FINAL v9.xlsx", "category": "Management spreadsheet", "reliability": "low", "summary": "Unreconciled management P&L claiming EUR 312,000 profit and containing unsupported treatments."},
    {"file": "02 Bank Export August.csv", "category": "Bank record", "reliability": "high", "summary": "Complete cash ledger from EUR 80,000 opening cash to EUR 60,000 closing cash."},
    {"file": "03 CRM Export Cleaned FINAL.xlsx", "category": "CRM export", "reliability": "medium", "summary": "Customer invoices, collections, delivery dates and open balances."},
    {"file": "04 Contracts Returns and Angry Customers.pdf", "category": "Contracts and acceptances", "reliability": "high", "summary": "Delivered contracts, September deposits and R-17 liquidation evidence."},
    {"file": "05 Warehouse Count Marta Notes.pdf", "category": "Physical inventory count", "reliability": "high", "summary": "EUR 143,000 physical stock including EUR 22,000 unsaleable inventory and conflicting EUR 405,000 consumption claim."},
    {"file": "06 Purchases Invoices and Goods Received.pdf", "category": "Third-party invoices", "reliability": "high", "summary": "EUR 459,000 purchases, EUR 126,000 payables, EUR 80,000 equipment and EUR 10,000 repair."},
    {"file": "07 Payroll Bonuses Contractors NEW.xlsx", "category": "Payroll schedule", "reliability": "medium", "summary": "EUR 248,000 normal payroll and unsupported EUR 110,000 founder bonus label."},
    {"file": "08 Assets Repairs Leases Maybe.xlsx", "category": "Asset schedule", "reliability": "medium", "summary": "Opening PPE, additions, repair and provisional EUR 24,000 depreciation estimate."},
    {"file": "09 Loans Owner Card and Legal Problems.pdf", "category": "External confirmations", "reliability": "high", "summary": "Debt roll-forward, owner spending and probable EUR 25,000 legal claim."},
    {"file": "10 Email and WhatsApp Dump DO NOT FORWARD.pdf", "category": "Management messages", "reliability": "low", "summary": "Evidence of management pressure and attempted misclassification; not authoritative accounting evidence."},
    {"file": "11 Evidence Received After Takeover.pdf", "category": "Post-period confirmations", "reliability": "high", "summary": "Adjusting evidence for bad debt, legal claim, damaged stock, cash, debt and accrued interest."},
]

schedules = {
    "revenueReceivables": {
        "title": "Revenue and receivables",
        "columns": ["Source", "Revenue", "Cash matched", "Gross AR"],
        "rows": [
            ["NorthStar Events", 180000, 180000, 0],
            ["Freedom Festivals", 200000, 142000, 58000],
            ["Phoenix HR", 100000, 70000, 30000],
            ["Liberty Hotels", 120000, 95000, 25000],
            ["Finally Single web", 270000, 250000, 20000],
            ["Never Call Back web", 90000, 37000, 53000],
        ],
        "totals": ["Total", 960000, 774000, 186000],
        "notes": ["R-17 impairment: EUR 18,000", "Net receivables: EUR 168,000", "September deposits of EUR 90,000 are contract liabilities."],
    },
    "inventoryCogs": {
        "title": "Inventory and COGS",
        "columns": ["Line", "EUR"],
        "rows": [["Opening inventory", 80000], ["Purchases", 459000], ["Physical materials COGS", -396000], ["Damaged-stock write-down", -22000], ["Closing inventory", 121000], ["Direct event payroll", 80000], ["Total COGS", 498000]],
        "notes": ["Selected basis: the reporting-date physical count implies EUR 396,000 materials COGS.", "UNRESOLVED: the same warehouse evidence reports EUR 405,000 consumed, leaving an unexplained EUR 9,000 contradiction."],
    },
    "payroll": {
        "title": "Payroll",
        "columns": ["Department", "Expense", "Cash paid", "Classification"],
        "rows": [["Event delivery staff", 80000, 75000, "Direct service cost"], ["Sales and partnerships", 72000, 68000, "Selling expense"], ["Office and finance", 96000, 88000, "Administrative expense"]],
        "totals": ["Normal payroll", 248000, 231000, ""],
        "notes": ["Closing payroll payable: EUR 32,000", "Founder bonus label is rejected; EUR 110,000 is treated as owner distributions."],
    },
    "operatingExpenses": {
        "title": "Operating expenses",
        "columns": ["Expense", "EUR"],
        "rows": [["Sales payroll", 72000], ["Office payroll", 96000], ["Rent", 48000], ["Marketing", 55000], ["Software", 16000], ["Utilities", 12000], ["Repairs", 10000], ["Core operating expenses", 309000], ["Depreciation", 24000], ["Bad debt", 18000], ["Legal claim", 25000]],
        "notes": ["No insurance expense is recognized because no supported amount is present."],
    },
    "ppeDepreciation": {
        "title": "PPE and depreciation",
        "columns": ["Line", "EUR"],
        "rows": [["Opening PPE cost", 180000], ["Pack-O-Matic", 60000], ["Photo Booth", 20000], ["Closing gross PPE", 260000], ["Opening accumulated depreciation", -45000], ["Period depreciation", -24000], ["Closing accumulated depreciation", -69000], ["Net PPE", 191000]],
        "notes": ["The EUR 24,000 depreciation estimate is provisional because the detailed schedule is absent."],
    },
    "debtInterest": {
        "title": "Debt and interest",
        "columns": ["Line", "EUR"],
        "rows": [["Opening loan", 100000], ["New borrowing", 50000], ["Principal repayment", -19000], ["Closing loan", 131000], ["Interest expense", 12000], ["Interest paid", -10000], ["Interest payable", 2000]],
        "notes": ["Interest paid is presented as an operating cash flow."],
    },
    "equityDistributions": {
        "title": "Equity and distributions",
        "columns": ["Line", "EUR"],
        "rows": [["Reconstructed opening equity", 170000], ["Profit before tax", 74000], ["Owner distributions", -110000], ["Closing equity", 134000]],
        "notes": ["UNRESOLVED: EUR 170,000 is an arithmetic reconstruction from identified opening balances and a derived EUR 45,000 opening trade payable.", "No opening trial balance proves that all opening assets and liabilities were captured."],
    },
}

statements = {
    "profitAndLoss": {
        "title": "Profit and Loss Statement",
        "rows": [["Revenue", 960000], ["Physical materials COGS", -396000], ["Direct event-delivery payroll", -80000], ["Damaged inventory write-down", -22000], ["Total COGS", -498000], ["Gross profit", 462000], ["Core operating expenses", -309000], ["Depreciation", -24000], ["Bad-debt expense", -18000], ["Legal expense", -25000], ["EBIT", 86000], ["Interest expense", -12000], ["Profit before tax", 74000]],
    },
    "cashFlow": {
        "title": "Cash Flow Statement",
        "rows": [["Customer cash receipts", 899000], ["Supplier payments", -378000], ["Normal payroll paid", -231000], ["Rent, marketing, software, utilities and repair", -141000], ["Interest paid", -10000], ["Net cash from operating activities", 139000], ["Equipment purchases", -80000], ["Net cash used in investing activities", -80000], ["New loan", 50000], ["Principal repayment", -19000], ["Owner distributions", -110000], ["Net cash used in financing activities", -79000], ["Net movement in cash", -20000], ["Opening cash", 80000], ["Closing cash", 60000]],
    },
    "balanceSheet": {
        "title": "Balance Sheet",
        "sections": [
            {"title": "Assets", "rows": [["Cash", 60000], ["Net accounts receivable", 168000], ["Inventory", 121000], ["Net PPE", 191000], ["Total assets", 540000]]},
            {"title": "Liabilities", "rows": [["Trade payables", 126000], ["Payroll payable", 32000], ["Customer deposits", 90000], ["Loans", 131000], ["Interest payable", 2000], ["Legal provision", 25000], ["Disposal provision", 0], ["Total liabilities", 406000]]},
            {"title": "Equity", "rows": [["Reconstructed opening equity", 170000], ["Current-period profit", 74000], ["Owner distributions", -110000], ["Closing equity", 134000], ["Total liabilities and equity", 540000]]},
        ],
    },
}

reconciliations = [
    {"name": "Revenue and receivables", "status": "pass", "equation": "EUR 960,000 - EUR 774,000 = EUR 186,000 gross AR; less EUR 18,000 impairment = EUR 168,000 net AR."},
    {"name": "Inventory and COGS", "status": "unresolved", "equation": "Selected physical-count basis: EUR 80,000 + EUR 459,000 - EUR 396,000 - EUR 22,000 = EUR 121,000. The same source reports EUR 405,000 consumed; the EUR 9,000 contradiction is unexplained."},
    {"name": "PPE", "status": "unresolved", "equation": "EUR 260,000 gross PPE - provisional EUR 69,000 accumulated depreciation = EUR 191,000 net PPE. The EUR 24,000 period charge cannot be re-performed from the supplied evidence."},
    {"name": "Debt principal", "status": "pass", "equation": "EUR 100,000 + EUR 50,000 - EUR 19,000 = EUR 131,000."},
    {"name": "Interest", "status": "pass", "equation": "EUR 12,000 expense - EUR 10,000 paid = EUR 2,000 payable."},
    {"name": "Closing cash", "status": "pass", "equation": "EUR 80,000 opening cash - EUR 20,000 net movement = EUR 60,000, agreeing to bank evidence."},
    {"name": "Cash flow to balance sheet", "status": "pass", "equation": "EUR 60,000 closing cash in the cash-flow roll-forward equals EUR 60,000 cash on the balance sheet."},
    {"name": "Equity roll-forward", "status": "unresolved", "equation": "Arithmetic: EUR 170,000 + EUR 74,000 - EUR 110,000 = EUR 134,000. Opening-balance completeness is not established and EUR 40,000 of owner-card spending is not itemized."},
    {"name": "Balance sheet", "status": "unresolved", "equation": "The selected reconstruction balances arithmetically at EUR 540,000, but inventory, depreciation and opening equity remain evidentially unresolved or provisional."},
]

uncertainties = [
    {"title": "Physical COGS", "confidence": "medium", "detail": "EUR 396,000 is derived from the direct physical count. The same warehouse record states EUR 405,000 consumed, but the reason for the EUR 9,000 difference is not evidenced."},
    {"title": "Owner-card classification", "confidence": "medium", "detail": "EUR 40,000 is treated as an owner distribution because no approved payroll or business-purpose evidence exists; individual purchases are not itemized."},
    {"title": "Opening equity", "confidence": "medium", "detail": "EUR 170,000 is reconstructed from supplied opening balances and derived opening trade payables; no standalone opening trial balance exists."},
    {"title": "Depreciation", "confidence": "medium", "detail": "EUR 24,000 is recognized provisionally. The independent schedule, useful lives and residual values are not supplied."},
    {"title": "Interest presentation", "confidence": "medium", "detail": "Interest paid is presented in operating cash flow. A permitted financing presentation would not change closing cash."},
    {"title": "Insurance", "confidence": "low", "detail": "No supported insurance transaction or expense amount appears in the original evidence. No amount is invented."},
]

submission = {
    "schemaVersion": "1.0",
    "caseId": "DPI-HT-01",
    "student": {"id": "mz18078", "name": "Mārtiņš Evarts Zviedris"},
    "evidence": evidence,
    "decisions": decisions,
    "schedules": schedules,
    "statements": statements,
    "reconciliations": reconciliations,
    "uncertainties": uncertainties,
    "boardRecommendation": {
        "decision": "Reject management's unsupported EUR 312,000 claim. Use the selected EUR 74,000 profit-before-tax reconstruction only as a provisional valuation basis, explicitly qualified for the EUR 9,000 inventory contradiction, provisional depreciation, missing insurance evidence, reconstructed opening equity and the unitemized EUR 40,000 owner-card classification.",
        "actions": ["Freeze owner-card access", "Move EUR 90,000 of September receipts to contract liabilities", "Introduce a weekly 13-week cash forecast", "Strengthen credit controls", "Dispose of damaged stock without accruing the unsupported disposal quote", "Investigate management override", "Review supplier terms", "Continue core operations only with corrected accounting and controls"],
    },
    "reportingDate": "2026-08-31",
    "currency": "EUR",
}

ids = [item["id"] for item in decisions]
expected_ids = [f"D{i:03d}" for i in range(1, 101)]
if ids != expected_ids:
    raise ValueError("Decision IDs are missing, duplicated or out of order")
if sum(item["reviewTier"] == "operational" for item in decisions) != 75:
    raise ValueError("Operational decision count is not 75")
if sum(item["reviewTier"] == "material_judgment" for item in decisions) != 25:
    raise ValueError("Material decision count is not 25")

output_dir.mkdir(parents=True, exist_ok=True)
(output_dir / "submission.json").write_text(json.dumps(submission, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(output_dir / "submission-schema.json").write_text(json.dumps(schema, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Generated {len(decisions)} decisions: 75 operational, 25 material")
