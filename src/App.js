import React, { useState, useMemo } from "react";
import { Plus, Trash2, PiggyBank, ListTree, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";

/* ============================================================
   가계부 (Household Ledger) — a single-file React component.
   Design signature: a physical "passbook" — a ledger book with
   a tabbed spine down the left, ruled tables, brass-stamped
   totals, and tabular-figure numerals for every amount.
   ============================================================ */

const INK = "#1B2430";
const INK_SOFT = "#3B4658";
const PAPER = "#EFEDE4";
const PAPER_DARK = "#E4E1D4";
const RULE = "#CFC9B6";
const BRASS = "#B8863B";
const BRASS_SOFT = "#E8D9B8";
const GREEN = "#2F6F4E";
const RED = "#AD4B3C";
const WHITE = "#FFFFFF";

const displayFont = '"Source Serif 4", Georgia, serif';
const bodyFont = '"Inter", system-ui, sans-serif';
const numFont = '"IBM Plex Mono", ui-monospace, monospace';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const DEFAULT_CATEGORIES = [
  { main: "수입", type: "income", subs: ["남편월급", "아내월급", "부수입", "투자소득", "기타소득"] },
  { main: "저축_투자", type: "saving", subs: ["예적금", "주식계좌", "펀드/ETF", "가상화폐"] },
  { main: "연금_노후", type: "saving", subs: ["개인연금", "퇴직연금", "국민연금"] },
  { main: "비상금", type: "saving", subs: ["비상금통장1", "비상금통장2"] },
  { main: "주거", type: "expense", subs: ["관리비", "도시가스", "대출이자", "수리/청소"] },
  { main: "식비", type: "expense", subs: ["식자재", "외식", "카페류"] },
  { main: "생활용품", type: "expense", subs: ["생활소모품", "가전/가구"] },
  { main: "꾸밈비", type: "expense", subs: ["의류/잡화", "미용/헤어"] },
  { main: "건강", type: "expense", subs: ["병원/약국", "건강보조"] },
  { main: "자기계발", type: "expense", subs: ["스터디/수강", "운동", "도서"] },
  { main: "자동차", type: "expense", subs: ["주유", "주차/통행료", "보험/세금"] },
  { main: "자녀", type: "expense", subs: ["육아용품", "교육/도서"] },
  { main: "반려동물", type: "expense", subs: ["반려용품", "동물병원"] },
  { main: "여행", type: "expense", subs: ["국내여행", "해외여행"] },
  { main: "문화생활", type: "expense", subs: ["공연/전시", "OTT"] },
  { main: "경조사", type: "expense", subs: ["가족/친척", "지인/동료"] },
  { main: "용돈", type: "expense", subs: ["남편용돈", "아내용돈"] },
  { main: "보험", type: "expense", subs: ["남편종합", "아내종합"] },
  { main: "통신비", type: "expense", subs: ["휴대폰", "인터넷/TV", "구독"] },
  { main: "기타", type: "expense", subs: ["세금", "회비", "서비스"] },
];

const DEFAULT_PAYMENTS = ["생활비카드1", "생활비카드2", "체크카드", "현금이체", "상품권"];

const won = (n) => (Math.round(n) || 0).toLocaleString("ko-KR");
const pct = (n) => (Number.isFinite(n) ? (n * 100).toFixed(1) : "0.0");
const uid = () => Math.random().toString(36).slice(2, 10);

function emptyMonthState() {
  const tx = {};
  const budget = {};
  MONTHS.forEach((m) => {
    tx[m] = [];
    budget[m] = {};
  });
  return { tx, budget };
}

export default function HouseholdLedger() {
  const [year, setYear] = useState(2026);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [payments, setPayments] = useState(DEFAULT_PAYMENTS);
  const [{ tx, budget }, setState] = useState(emptyMonthState);
  const [activeTab, setActiveTab] = useState(1); // 0 = 연간결산, "cat" = 항목관리, 1-12 = months

  const mainType = (main) => categories.find((c) => c.main === main)?.type || "expense";

  const addTx = (month, entry) =>
    setState((s) => ({ ...s, tx: { ...s.tx, [month]: [...s.tx[month], { id: uid(), ...entry }] } }));

  const removeTx = (month, id) =>
    setState((s) => ({ ...s, tx: { ...s.tx, [month]: s.tx[month].filter((t) => t.id !== id) } }));

  const setBudget = (month, main, value) =>
    setState((s) => ({ ...s, budget: { ...s.budget, [month]: { ...s.budget[month], [main]: value } } }));

  const monthStats = (m) => {
    const list = tx[m];
    const sum = (pred) => list.filter(pred).reduce((a, t) => a + Number(t.amount || 0), 0);
    const income = sum((t) => mainType(t.main) === "income");
    const expense = sum((t) => mainType(t.main) === "expense");
    const saving = sum((t) => mainType(t.main) === "saving");
    const remain = income - expense - saving;
    const rate = income ? saving / income : 0;
    return { income, expense, saving, remain, rate };
  };

  const annual = useMemo(() => {
    const rows = MONTHS.map((m) => ({ month: m, ...monthStats(m) }));
    const total = rows.reduce(
      (a, r) => ({
        income: a.income + r.income,
        expense: a.expense + r.expense,
        saving: a.saving + r.saving,
        remain: a.remain + r.remain,
      }),
      { income: 0, expense: 0, saving: 0, remain: 0 }
    );
    return { rows, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx, categories]);

  return (
    <div style={{ fontFamily: bodyFont, background: PAPER_DARK, minHeight: "100%", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input, select { font-family: ${bodyFont}; }
        table { border-collapse: collapse; width: 100%; }
        .tnum { font-family: ${numFont}; font-variant-numeric: tabular-nums; }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", gap: 0, background: PAPER, boxShadow: "0 18px 40px rgba(27,36,48,0.18)" }}>
        {/* ---------- Passbook spine (tab rail) ---------- */}
        <div style={{ width: 92, background: INK, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", flexShrink: 0 }}>
          <div style={{ color: BRASS, fontFamily: displayFont, fontSize: 13, letterSpacing: 2, writingMode: "vertical-rl", marginBottom: 20 }}>
            {year} 가계부
          </div>
          <SpineTab active={activeTab === 0} onClick={() => setActiveTab(0)} icon={<PiggyBank size={16} />} label="결산" />
          <SpineTab active={activeTab === "cat"} onClick={() => setActiveTab("cat")} icon={<ListTree size={16} />} label="항목" />
          <div style={{ height: 1, width: 40, background: "rgba(255,255,255,0.15)", margin: "8px 0" }} />
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {MONTHS.map((m) => (
              <SpineTab key={m} active={activeTab === m} onClick={() => setActiveTab(m)} label={`${m}월`} compact />
            ))}
          </div>
        </div>

        {/* ---------- Page content ---------- */}
        <div style={{ flex: 1, minWidth: 0, padding: "28px 36px", background: PAPER }}>
          {activeTab === 0 && <AnnualPage year={year} setYear={setYear} annual={annual} categories={categories} tx={tx} mainType={mainType} />}
          {activeTab === "cat" && (
            <CategoryPage categories={categories} setCategories={setCategories} payments={payments} setPayments={setPayments} />
          )}
          {typeof activeTab === "number" && activeTab > 0 && (
            <MonthPage
              year={year}
              month={activeTab}
              categories={categories}
              payments={payments}
              mainType={mainType}
              list={tx[activeTab]}
              budgetMap={budget[activeTab]}
              stats={monthStats(activeTab)}
              onAdd={(entry) => addTx(activeTab, entry)}
              onRemove={(id) => removeTx(activeTab, id)}
              onBudget={(main, v) => setBudget(activeTab, main, v)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Spine tab button ---------------- */
function SpineTab({ active, onClick, icon, label, compact }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: compact ? 60 : 68,
        padding: compact ? "7px 0" : "9px 0",
        margin: "3px 0",
        border: "none",
        borderRadius: 3,
        background: active ? BRASS : "transparent",
        color: active ? INK : "rgba(255,255,255,0.75)",
        fontFamily: displayFont,
        fontSize: compact ? 12.5 : 12,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        transition: "background 0.15s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- Shared bits ---------------- */
function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, borderBottom: `2px solid ${INK}`, paddingBottom: 8 }}>
      <h2 style={{ fontFamily: displayFont, fontSize: 20, fontWeight: 700, color: INK, margin: 0 }}>{children}</h2>
      {right}
    </div>
  );
}

function StatCard({ label, value, accent, suffix }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${RULE}`, borderRadius: 4, padding: "12px 16px", flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11.5, color: INK_SOFT, marginBottom: 6, letterSpacing: 0.3 }}>{label}</div>
      <div className="tnum" style={{ fontSize: 20, fontWeight: 600, color: accent || INK }}>
        {value}
        {suffix ? <span style={{ fontSize: 12, marginLeft: 3, color: INK_SOFT }}>{suffix}</span> : null}
      </div>
    </div>
  );
}

/* ================= 월별 페이지 ================= */
function MonthPage({ year, month, categories, payments, mainType, list, budgetMap, stats, onAdd, onRemove, onBudget }) {
  const [form, setForm] = useState({ date: "", main: categories[0].main, sub: categories[0].subs[0], desc: "", amount: "", payment: payments[0] });

  const subsFor = (main) => categories.find((c) => c.main === main)?.subs || [];

  const submit = () => {
    if (!form.date || !form.amount) return;
    onAdd({ ...form, amount: Number(form.amount) });
    setForm((f) => ({ ...f, desc: "", amount: "" }));
  };

  const byMain = (main) => list.filter((t) => t.main === main).reduce((a, t) => a + Number(t.amount), 0);
  const byPayment = (p) => list.filter((t) => t.payment === p).reduce((a, t) => a + Number(t.amount), 0);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const spendByDay = (d) =>
    list
      .filter((t) => new Date(t.date).getDate() === d && new Date(t.date).getMonth() + 1 === month && mainType(t.main) === "expense")
      .reduce((a, t) => a + Number(t.amount), 0);

  const budgetRows = categories.map((c) => ({ main: c.main, type: c.type, budget: Number(budgetMap[c.main] || 0), actual: byMain(c.main) }));

  return (
    <div>
      <SectionTitle right={<span className="tnum" style={{ fontSize: 13, color: BRASS }}>{year}.{String(month).padStart(2, "0")}</span>}>
        {month}월 가계부
      </SectionTitle>

      <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard label="총수입" value={won(stats.income)} suffix="원" />
        <StatCard label="총지출" value={won(stats.expense)} suffix="원" accent={RED} />
        <StatCard label="저축액" value={won(stats.saving)} suffix="원" accent={GREEN} />
        <StatCard label="잔여현금" value={won(stats.remain)} suffix="원" />
        <StatCard label="저축률" value={pct(stats.rate)} suffix="%" accent={BRASS} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        {/* Left: ledger entry + list */}
        <div>
          <SectionTitle>거래 입력</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.4fr 1fr", gap: 6, marginBottom: 8 }}>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
            <select value={form.main} onChange={(e) => setForm({ ...form, main: e.target.value, sub: subsFor(e.target.value)[0] || "" })} style={inputStyle}>
              {categories.map((c) => (
                <option key={c.main} value={c.main}>{c.main}</option>
              ))}
            </select>
            <select value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value })} style={inputStyle}>
              {subsFor(form.main).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input placeholder="사용내역" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} style={inputStyle} />
            <input placeholder="금액" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <select value={form.payment} onChange={(e) => setForm({ ...form, payment: e.target.value })} style={{ ...inputStyle, maxWidth: 160 }}>
              {payments.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button onClick={submit} style={brassButton}>
              <Plus size={14} /> 추가
            </button>
          </div>

          <table>
            <thead>
              <tr style={{ background: INK, color: WHITE, fontSize: 12 }}>
                {["일자", "대분류", "소분류", "내역", "금액", "결제수단", ""].map((h) => (
                  <th key={h} style={{ padding: "7px 8px", textAlign: h === "금액" ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 16, color: INK_SOFT, textAlign: "center", fontSize: 13 }}>아직 입력된 거래가 없어요.</td></tr>
              )}
              {[...list].sort((a, b) => (a.date < b.date ? -1 : 1)).map((t) => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${RULE}`, fontSize: 13 }}>
                  <td className="tnum" style={tdStyle}>{t.date}</td>
                  <td style={tdStyle}>{t.main}</td>
                  <td style={tdStyle}>{t.sub}</td>
                  <td style={tdStyle}>{t.desc}</td>
                  <td className="tnum" style={{ ...tdStyle, textAlign: "right", color: mainType(t.main) === "expense" ? RED : mainType(t.main) === "income" ? GREEN : INK }}>
                    {won(t.amount)}
                  </td>
                  <td style={tdStyle}>{t.payment}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button onClick={() => onRemove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: INK_SOFT }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: budget, payments, calendar */}
        <div>
          <SectionTitle>예산 대비 지출</SectionTitle>
          <table style={{ marginBottom: 22 }}>
            <thead>
              <tr style={{ fontSize: 11.5, color: INK_SOFT }}>
                <th style={{ textAlign: "left", padding: "4px 0" }}>대분류</th>
                <th style={{ textAlign: "right" }}>예산</th>
                <th style={{ textAlign: "right" }}>지출</th>
              </tr>
            </thead>
            <tbody>
              {budgetRows.filter((r) => r.type === "expense").map((r) => (
                <tr key={r.main} style={{ borderBottom: `1px solid ${RULE}`, fontSize: 12.5 }}>
                  <td style={{ padding: "5px 0" }}>{r.main}</td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      type="number"
                      value={budgetMap[r.main] || ""}
                      placeholder="0"
                      onChange={(e) => onBudget(r.main, e.target.value)}
                      className="tnum"
                      style={{ width: 76, textAlign: "right", border: "none", borderBottom: `1px dotted ${RULE}`, background: "transparent", color: BRASS }}
                    />
                  </td>
                  <td className="tnum" style={{ textAlign: "right", color: r.actual > r.budget && r.budget > 0 ? RED : INK }}>{won(r.actual)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <SectionTitle>결제수단별 지출</SectionTitle>
          <div style={{ marginBottom: 22 }}>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={payments.map((p) => ({ name: p, amt: byPayment(p) }))} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: INK_SOFT }} />
                <Tooltip formatter={(v) => won(v) + "원"} />
                <Bar dataKey="amt" fill={BRASS} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <SectionTitle>무지출 달력</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, fontSize: 11 }}>
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} style={{ textAlign: "center", color: INK_SOFT, fontWeight: 600 }}>{d}</div>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={"e" + i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const spent = spendByDay(d);
              return (
                <div
                  key={d}
                  title={spent ? `${won(spent)}원 지출` : "무지출"}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    background: spent ? RED : "#DCEAE1",
                    color: spent ? WHITE : GREEN,
                    fontWeight: 600,
                  }}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= 연간결산 페이지 ================= */
function AnnualPage({ year, setYear, annual, categories, tx, mainType }) {
  const chartData = annual.rows.map((r) => ({ name: `${r.month}월`, 수입: r.income, 지출: r.expense }));

  const categoryAnnual = categories.map((c) => {
    const total = MONTHS.reduce((a, m) => a + tx[m].filter((t) => t.main === c.main).reduce((x, t) => x + Number(t.amount), 0), 0);
    return { main: c.main, type: c.type, total };
  });

  return (
    <div>
      <SectionTitle
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: INK_SOFT }}>연도</span>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="tnum" style={{ ...inputStyle, width: 80 }} />
          </div>
        }
      >
        연간결산
      </SectionTitle>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="연간 총수입" value={won(annual.total.income)} suffix="원" />
        <StatCard label="연간 총지출" value={won(annual.total.expense)} suffix="원" accent={RED} />
        <StatCard label="연간 저축액" value={won(annual.total.saving)} suffix="원" accent={GREEN} />
        <StatCard label="연간 잔여현금" value={won(annual.total.remain)} suffix="원" />
      </div>

      <SectionTitle>월별 수입 · 지출 추이</SectionTitle>
      <div style={{ marginBottom: 28 }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid stroke={RULE} strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: INK_SOFT }} />
            <YAxis tick={{ fontSize: 11, fill: INK_SOFT }} tickFormatter={(v) => (v / 10000) + "만"} />
            <Tooltip formatter={(v) => won(v) + "원"} />
            <Legend />
            <Line type="monotone" dataKey="수입" stroke={GREEN} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="지출" stroke={RED} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>대분류별 연간 합계</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px 20px" }}>
        {categoryAnnual.map((r) => (
          <div key={r.main} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${RULE}`, padding: "6px 0", fontSize: 13 }}>
            <span>{r.main}</span>
            <span className="tnum" style={{ color: r.type === "income" ? GREEN : r.type === "saving" ? BRASS : INK }}>{won(r.total)}원</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= 항목관리 페이지 ================= */
function CategoryPage({ categories, setCategories, payments, setPayments }) {
  const [newMain, setNewMain] = useState("");
  const [newType, setNewType] = useState("expense");
  const [subInputs, setSubInputs] = useState({});
  const [newPayment, setNewPayment] = useState("");

  const addMain = () => {
    if (!newMain.trim()) return;
    setCategories((c) => [...c, { main: newMain.trim(), type: newType, subs: [] }]);
    setNewMain("");
  };
  const addSub = (main) => {
    const val = (subInputs[main] || "").trim();
    if (!val) return;
    setCategories((c) => c.map((cat) => (cat.main === main ? { ...cat, subs: [...cat.subs, val] } : cat)));
    setSubInputs((s) => ({ ...s, [main]: "" }));
  };
  const removeSub = (main, sub) =>
    setCategories((c) => c.map((cat) => (cat.main === main ? { ...cat, subs: cat.subs.filter((s) => s !== sub) } : cat)));
  const removeMain = (main) => setCategories((c) => c.filter((cat) => cat.main !== main));

  return (
    <div>
      <SectionTitle>항목 관리</SectionTitle>
      <p style={{ fontSize: 13, color: INK_SOFT, marginTop: -6, marginBottom: 20 }}>
        대분류·소분류·결제수단을 자유롭게 추가/삭제하세요. 월별 입력 화면의 드롭다운에 바로 반영됩니다.
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        <input placeholder="새 대분류 이름" value={newMain} onChange={(e) => setNewMain(e.target.value)} style={inputStyle} />
        <select value={newType} onChange={(e) => setNewType(e.target.value)} style={inputStyle}>
          <option value="income">수입</option>
          <option value="saving">저축</option>
          <option value="expense">지출</option>
        </select>
        <button onClick={addMain} style={brassButton}><Plus size={14} /> 대분류 추가</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 28 }}>
        {categories.map((c) => (
          <div key={c.main} style={{ background: WHITE, border: `1px solid ${RULE}`, borderRadius: 4, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {c.main} <span style={{ fontSize: 11, color: c.type === "income" ? GREEN : c.type === "saving" ? BRASS : RED }}>· {c.type === "income" ? "수입" : c.type === "saving" ? "저축" : "지출"}</span>
              </span>
              <button onClick={() => removeMain(c.main)} style={{ background: "none", border: "none", cursor: "pointer", color: INK_SOFT }}><Trash2 size={13} /></button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {c.subs.map((s) => (
                <span key={s} style={{ background: PAPER_DARK, borderRadius: 12, padding: "3px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  {s} <Trash2 size={11} style={{ cursor: "pointer" }} onClick={() => removeSub(c.main, s)} />
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                placeholder="소분류 추가"
                value={subInputs[c.main] || ""}
                onChange={(e) => setSubInputs((s) => ({ ...s, [c.main]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addSub(c.main)}
                style={{ ...inputStyle, fontSize: 12, padding: "5px 8px" }}
              />
              <button onClick={() => addSub(c.main)} style={{ ...brassButton, padding: "5px 10px" }}><ChevronRight size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>결제수단</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {payments.map((p) => (
          <span key={p} style={{ background: BRASS_SOFT, borderRadius: 12, padding: "4px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}>
            {p} <Trash2 size={12} style={{ cursor: "pointer" }} onClick={() => setPayments(payments.filter((x) => x !== p))} />
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input placeholder="새 결제수단" value={newPayment} onChange={(e) => setNewPayment(e.target.value)} style={inputStyle} />
        <button
          onClick={() => { if (newPayment.trim()) { setPayments([...payments, newPayment.trim()]); setNewPayment(""); } }}
          style={brassButton}
        >
          <Plus size={14} /> 추가
        </button>
      </div>
    </div>
  );
}

/* ---------------- inline styles ---------------- */
const inputStyle = {
  border: `1px solid ${RULE}`,
  borderRadius: 3,
  padding: "6px 8px",
  fontSize: 13,
  background: WHITE,
  color: INK,
};

const tdStyle = { padding: "6px 8px" };

const brassButton = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: BRASS,
  color: WHITE,
  border: "none",
  borderRadius: 3,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
