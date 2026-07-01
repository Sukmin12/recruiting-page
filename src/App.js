import React, { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════════════
//  💛 우리 가계부 — 부부 재정 관리
//  SHEET_URL에 Apps Script 배포 URL을 붙여넣으세요
// ════════════════════════════════════════════════════════════════════
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxg4px9rnJnwXORz-Hcv_TZhZzC_jrMH8oRyyW1WrCeEoUcqM661R7bfXc7sawiDQHL/exec";

const won = (n) => `₩${Number(n || 0).toLocaleString("ko-KR")}`;
const pct = (v, t) => t > 0 ? Math.min(999, Math.round((v / t) * 100)) : 0;
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const ymKey = (y, m) => `${y}-${String(m).padStart(2, "0")}`;
const useWidth = () => { const [w, setW] = useState(window.innerWidth); useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []); return w; };
const isMob = (w) => w < 768;
const isTab = (w) => w >= 768 && w < 1024;
const lsave = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const lload = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };

// ─── 테마 ─────────────────────────────────────────────────────────
const C = {
  gold: "#C9A84C", goldDark: "#7A5C1E", goldDeep: "#3D2B00",
  goldLight: "#FDF6E3", goldMid: "#EDD98A", goldBorder: "#E8D5A3",
  bg: "#FAF8F4", surface: "#FFFFFF", ink: "#1C1917", muted: "#92867A", border: "#EDE8E0",
  green: "#15803D", greenLight: "#DCFCE7",
  red: "#C0392B", redLight: "#FDECEA",
  blue: "#1D4ED8", blueLight: "#DBEAFE",
  purple: "#7C3AED", purpleLight: "#EDE9FE",
  teal: "#0D9488", tealLight: "#CCFBF1",
  gradient: "linear-gradient(135deg, #C9A84C 0%, #EDD98A 50%, #A07828 100%)",
  gradientDark: "linear-gradient(135deg, #1C1917 0%, #3D2B00 100%)",
};
const S = {
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: 16, border: `1px solid ${C.border}` },
  input: { width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", outline: "none", backgroundColor: C.surface, color: C.ink, boxSizing: "border-box" },
  select: { width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "inherit", outline: "none", backgroundColor: C.surface, color: C.ink },
  label: { fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: "0.06em", display: "block", marginBottom: 5, textTransform: "uppercase" },
  btn: (bg = C.gold) => ({ border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", backgroundColor: bg, color: bg === C.gold ? C.goldDeep : "#fff", boxShadow: bg === C.gold ? "0 3px 10px rgba(201,168,76,0.35)" : "none" }),
  btnOutline: { border: `1.5px solid ${C.goldBorder}`, borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", backgroundColor: "transparent", color: C.gold },
  btnGhost: { border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", backgroundColor: C.bg, color: C.muted },
  tag: (color, bg) => ({ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 700, color, backgroundColor: bg }),
};

// ─── 카테고리 ─────────────────────────────────────────────────────
const INCOME_CATS  = ["급여","부업/프리랜서","이자/배당","임대수입","용돈/지원","기타수입"];
const EXPENSE_CATS = ["식비","외식/카페","교통/주유","주거/관리비","통신비","의료/건강","교육","문화/여가","의류/미용","경조사","쇼핑","보험","기타지출"];
const SAVINGS_CATS = ["비상금","여행적금","주택청약","펀드/ETF","정기예금","목돈마련","기타저축"];
const ASSET_CATS   = ["부동산","예금/적금","주식/펀드","연금/보험","현금","기타자산"];
const LIAB_CATS    = ["주택담보대출","전세자금대출","자동차대출","학자금대출","신용대출","기타부채"];
const EMO = { "식비":"🍚","외식/카페":"☕","교통/주유":"🚗","주거/관리비":"🏠","통신비":"📱","의료/건강":"💊","교육":"📚","문화/여가":"🎬","의류/미용":"👗","경조사":"🎁","쇼핑":"🛒","보험":"🛡️","기타지출":"📦","급여":"💼","부업/프리랜서":"💻","이자/배당":"📈","임대수입":"🏘️","용돈/지원":"🤝","기타수입":"💰","비상금":"🆘","여행적금":"✈️","주택청약":"🏗️","펀드/ETF":"📊","정기예금":"🏦","목돈마련":"💎","기타저축":"💰","부동산":"🏠","예금/적금":"🏦","주식/펀드":"📈","연금/보험":"🛡️","현금":"💵","기타자산":"💼","주택담보대출":"🏠","전세자금대출":"🔑","자동차대출":"🚗","학자금대출":"📚","신용대출":"💳","기타부채":"📋" };

// ─── 공통 컴포넌트 ────────────────────────────────────────────────
const Field = ({ label, children }) => <div style={{ marginBottom: 12 }}>{label && <label style={S.label}>{label}</label>}{children}</div>;
const Grid = ({ cols = 2, children, w }) => <div style={{ display: "grid", gridTemplateColumns: `repeat(${isMob(w) ? 1 : cols}, 1fr)`, gap: 12, marginBottom: 4 }}>{children}</div>;
const Badge = ({ text, color, bg }) => <span style={S.tag(color, bg)}>{text}</span>;
const ProgressBar = ({ value, max, color = C.gold, height = 8 }) => {
  const p = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return <div style={{ height, backgroundColor: C.border, borderRadius: 99, overflow: "hidden" }}><div style={{ height: "100%", width: `${p}%`, backgroundColor: p >= 100 ? C.red : color, borderRadius: 99, transition: "width 0.4s" }} /></div>;
};
const SyncBadge = ({ status }) => {
  const m = { loading: ["⏳", C.muted, "동기화 중"], ok: ["✓", C.green, "동기화됨"], error: ["!", C.red, "오프라인"], local: ["●", C.gold, "로컬"] };
  const [icon, color, label] = m[status] || m.local;
  return <span style={{ fontSize: 11, fontWeight: 700, color }}>{icon} {label}</span>;
};
const AmountInput = ({ value, onChange, placeholder = "0" }) => <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...S.input, textAlign: "right" }} />;
const useEscapeClose = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
};

// ─── SVG 바 차트 ─────────────────────────────────────────────────
const BarChart = ({ data, h = 100, color = C.gold, color2 = null }) => {
  if (!data || data.length === 0) return null;
  const vals = data.map(d => d.value || 0);
  const maxV = Math.max(...vals, 1);
  const bW = 28, gap = 6;
  const totalW = data.length * (bW + gap);
  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${h + 24}`} preserveAspectRatio="none" style={{ display: "block" }}>
      {data.map((d, i) => {
        const bH = Math.max(2, (d.value / maxV) * h);
        const b2H = d.value2 ? Math.max(2, (d.value2 / maxV) * h) : 0;
        const x = i * (bW + gap);
        return (
          <g key={i}>
            {color2 && <rect x={x + bW / 2} y={h - b2H} width={bW / 2 - 1} height={b2H} fill={color2} rx={3} opacity={0.7} />}
            <rect x={x} y={h - bH} width={color2 ? bW / 2 - 1 : bW} height={bH} fill={color} rx={3} opacity={0.85} />
            <text x={x + bW / 2} y={h + 16} textAnchor="middle" fontSize="9" fill={C.muted}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── 무지출 달력 ─────────────────────────────────────────────────
const ZeroSpendCalendar = ({ expense, year, month }) => {
  const ym = ymKey(year, month);
  const mExpense = expense.filter(e => e.yearMonth === ym);
  const spendDays = new Set(mExpense.map(e => e.date ? e.date.slice(8, 10) : null).filter(Boolean));
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = isCurrentMonth ? today.getDate() : null;
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const zeroSpendDays = [...Array(daysInMonth)].map((_, i) => i + 1).filter(d => !spendDays.has(String(d).padStart(2, "0")) && (!isCurrentMonth || d <= (todayDate || daysInMonth)));
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>🗓 무지출 달력</div>
        <Badge text={`무지출 ${zeroSpendDays.length}일`} color={C.green} bg={C.greenLight} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, textAlign: "center" }}>
        {dayLabels.map(d => <div key={d} style={{ fontSize: 10, fontWeight: 700, color: C.muted, padding: "4px 0" }}>{d}</div>)}
        {weeks.map((w, wi) => w.map((d, di) => {
          if (!d) return <div key={`e${wi}-${di}`} />;
          const dStr = String(d).padStart(2, "0");
          const hasSpend = spendDays.has(dStr);
          const isFuture = isCurrentMonth && d > (todayDate || 0);
          const isToday = d === todayDate;
          return (
            <div key={d} style={{
              width: "100%", aspectRatio: "1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: isToday ? 900 : 500,
              backgroundColor: isToday ? C.gold : hasSpend ? C.redLight : isFuture ? "transparent" : C.greenLight,
              color: isToday ? "#fff" : hasSpend ? C.red : isFuture ? C.border : C.green,
            }}>{d}</div>
          );
        }))}
      </div>
    </div>
  );
};

// ─── 구글 시트 동기화 ─────────────────────────────────────────────
let _timers = {};
const syncSheet = (sheet, rows) => {
  lsave(`budget-${sheet}`, rows);
  if (!SHEET_URL) return;
  clearTimeout(_timers[sheet]);
  _timers[sheet] = setTimeout(() => {
    fetch(SHEET_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheet, rows }) }).catch(() => {});
  }, 600);
};

// ─── 월 네비 ──────────────────────────────────────────────────────
const MonthNav = ({ year, month, onChange }) => {
  const prev = () => month === 1 ? onChange(year - 1, 12) : onChange(year, month - 1);
  const next = () => month === 12 ? onChange(year + 1, 1) : onChange(year, month + 1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={prev} style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: C.gold, padding: "2px 8px", lineHeight: 1 }}>‹</button>
      <div style={{ fontWeight: 900, fontSize: 16, minWidth: 100, textAlign: "center" }}>{year}년 {month}월</div>
      <button onClick={next} style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", color: C.gold, padding: "2px 8px", lineHeight: 1 }}>›</button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
//  대시보드
// ════════════════════════════════════════════════════════════════════
function Dashboard({ income, expense, savings, budget, fixedCosts, assets, year, month, w }) {
  const mob = isMob(w);
  const ym = ymKey(year, month);
  const mIncome  = income.filter(i => i.yearMonth === ym);
  const mExpense = expense.filter(e => e.yearMonth === ym);
  const mSavings = savings.filter(s => s.yearMonth === ym);
  const totalIn  = mIncome.reduce((s, i) => s + Number(i.amount), 0);
  const totalEx  = mExpense.reduce((s, e) => s + Number(e.amount), 0);
  const totalSv  = mSavings.reduce((s, sv) => s + Number(sv.amount), 0);
  const net      = totalIn - totalEx - totalSv;
  const savingsRate = totalIn > 0 ? Math.round((totalSv / totalIn) * 100) : 0;
  const expByCat = {};
  mExpense.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + Number(e.amount); });
  const mBudget = budget.filter(b => b.yearMonth === ym);
  const activeFixed = fixedCosts.filter(f => f.active);
  const topCats = Object.entries(expByCat).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // 연간 추이 (현재 연도 12개월)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const k = ymKey(year, i + 1);
    const inc = income.filter(x => x.yearMonth === k).reduce((s, x) => s + Number(x.amount), 0);
    const exp = expense.filter(x => x.yearMonth === k).reduce((s, x) => s + Number(x.amount), 0);
    return { label: `${i + 1}월`, value: inc, value2: exp };
  });

  // 순자산 (가장 최근 입력된 달 기준)
  const latestYm = assets.length > 0 ? [...new Set(assets.map(a => a.yearMonth))].sort().reverse()[0] : null;
  const latestAssets = latestYm ? assets.filter(a => a.yearMonth === latestYm) : [];
  const totalAssets = latestAssets.filter(a => a.atype === "자산").reduce((s, a) => s + Number(a.amount), 0);
  const totalLiab   = latestAssets.filter(a => a.atype === "부채").reduce((s, a) => s + Number(a.amount), 0);
  const netWorth    = totalAssets - totalLiab;

  return (
    <div>
      {/* Hero */}
      <div style={{ background: C.gradientDark, borderRadius: 18, padding: mob ? "22px 20px" : "28px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(201,168,76,0.15)" }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em", marginBottom: 6 }}>NET BALANCE · {year}년 {month}월</div>
        <div style={{ fontSize: mob ? 30 : 38, fontWeight: 900, color: net >= 0 ? "#EDD98A" : C.red, marginBottom: 6 }}>{won(net)}</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>수입 {won(totalIn)}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>지출 {won(totalEx)}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>저축 {won(totalSv)}</span>
          <span style={{ fontSize: 12, color: "#EDD98A", fontWeight: 700 }}>저축률 {savingsRate}%</span>
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "총 수입", amount: totalIn, color: C.green, bg: C.greenLight, icon: "💰" },
          { label: "총 지출", amount: totalEx, color: C.red, bg: C.redLight, icon: "💸" },
          { label: `저축 (${savingsRate}%)`, amount: totalSv, color: C.blue, bg: C.blueLight, icon: "🏦" },
          { label: "순자산", amount: netWorth, color: C.gold, bg: C.goldLight, icon: "🏛" },
        ].map(c => (
          <div key={c.label} style={{ backgroundColor: c.bg, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: mob ? 14 : 16, fontWeight: 900, color: c.color }}>{won(c.amount)}</div>
          </div>
        ))}
      </div>

      {/* 연간 수입/지출 추이 */}
      <div style={S.card}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📈 {year}년 월별 추이</div>
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.gold }}><span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.gold, display: "inline-block" }} />수입</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.red }}><span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: C.red, display: "inline-block" }} />지출</span>
        </div>
        <BarChart data={monthlyData} h={90} color={C.gold} color2={C.red} />
      </div>

      {/* 예산 현황 */}
      {mBudget.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📋 예산 현황</div>
          {mBudget.map(b => {
            const spent = expByCat[b.category] || 0;
            return (
              <div key={b.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{EMO[b.category] || ""} {b.category}</span>
                  <span style={{ fontSize: 12, color: spent > Number(b.budgetAmount) ? C.red : C.muted, fontWeight: 600 }}>{won(spent)} / {won(b.budgetAmount)}</span>
                </div>
                <ProgressBar value={spent} max={Number(b.budgetAmount)} color={C.gold} />
              </div>
            );
          })}
        </div>
      )}

      {/* 지출 TOP */}
      {topCats.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>💸 지출 상위 항목</div>
          {topCats.map(([cat, amt], i) => (
            <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < topCats.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{EMO[cat] || "📦"} {cat}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>{won(amt)}</div>
            </div>
          ))}
        </div>
      )}

      {/* 무지출 달력 */}
      <ZeroSpendCalendar expense={expense} year={year} month={month} />

      {/* 고정비 */}
      {activeFixed.length > 0 && (
        <div style={{ ...S.card, border: `1.5px solid ${C.goldBorder}`, backgroundColor: C.goldLight }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>📌 월 고정비</div>
            <div style={{ fontWeight: 900, color: C.goldDark }}>{won(activeFixed.reduce((s, f) => s + Number(f.amount), 0))}</div>
          </div>
          {activeFixed.map((f, i) => (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < activeFixed.length - 1 ? `1px solid ${C.goldBorder}` : "none" }}>
              <span style={{ fontSize: 13 }}>{f.name}</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: C.goldDark }}>{won(f.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  수입 / 지출 / 저축 — 공통 CRUD 팩토리
// ════════════════════════════════════════════════════════════════════
function TransactionManager({ data, setData, sheetName, year, month, w, config }) {
  const ym = ymKey(year, month);
  const mob = isMob(w);
  const monthData = data.filter(d => d.yearMonth === ym).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const total = monthData.reduce((s, d) => s + Number(d.amount), 0);
  const [filter, setFilter] = config.filters ? useState("전체") : [null, null]; // eslint-disable-line react-hooks/rules-of-hooks
  const [form, setForm] = useState({ ...config.blank });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  useEscapeClose(showForm, () => { setShowForm(false); setEditId(null); setForm({ ...config.blank }); });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.amount || !form.description) return;
    const u = editId ? data.map(d => d.id === editId ? { ...form, id: editId, yearMonth: ym } : d) : [...data, { ...form, id: Date.now(), yearMonth: ym }];
    setData(u); syncSheet(sheetName, u);
    setForm({ ...config.blank }); setEditId(null); setShowForm(false);
  };
  const handleDelete = (id) => { if (!window.confirm("삭제할까요?")) return; const u = data.filter(d => d.id !== id); setData(u); syncSheet(sheetName, u); };
  const startEdit = (item) => { const f = {}; Object.keys(config.blank).forEach(k => { f[k] = item[k] !== undefined ? item[k] : config.blank[k]; }); setForm(f); setEditId(item.id); setShowForm(true); };
  const filtered = filter ? monthData.filter(d => filter === "전체" || (config.filterFn && config.filterFn(d, filter))) : monthData;

  return (
    <div>
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => { setShowForm(false); setEditId(null); setForm({ ...config.blank }); }}>
          <div style={{ backgroundColor: C.surface, borderRadius: 16, padding: 26, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{editId ? `${config.title} 수정` : `${config.title} 추가`}</div>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm({ ...config.blank }); }} style={{ border: "none", background: C.bg, color: C.muted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <Grid cols={2} w={w}>
              <Field label="카테고리"><select style={S.select} value={form.category} onChange={e => setF("category", e.target.value)}>{config.cats.map(c => <option key={c}>{c}</option>)}</select></Field>
              <Field label="날짜"><input type="date" style={S.input} value={form.date} onChange={e => setF("date", e.target.value)} /></Field>
            </Grid>
            <Field label="항목명"><input style={S.input} placeholder={config.placeholder || "항목명"} value={form.description} onChange={e => setF("description", e.target.value)} autoFocus /></Field>
            <Field label="금액"><AmountInput value={form.amount} onChange={v => setF("amount", v)} /></Field>
            {config.extraFields && config.extraFields(form, setF, w)}
            <div style={{ display: "flex", gap: 8 }}><button style={{ ...S.btn(C.gold), flex: 1 }} onClick={handleSave}>{editId ? "수정 저장" : "추가"}</button><button style={S.btnGhost} onClick={() => { setShowForm(false); setEditId(null); setForm({ ...config.blank }); }}>취소</button></div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>이번 달 {config.title}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: config.totalColor }}>{won(total)}</div>
          {config.subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{config.subtitle(monthData)}</div>}
        </div>
        <button style={S.btn()} onClick={() => { setForm({ ...config.blank }); setEditId(null); setShowForm(true); }}>+ {config.title} 추가</button>
      </div>
      {filter !== null && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {(config.filters || []).map(f => <button key={f} onClick={() => setFilter(f)} style={{ border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", backgroundColor: filter === f ? C.gold : C.bg, color: filter === f ? C.goldDeep : C.muted, fontFamily: "inherit" }}>{f}</button>)}
        </div>
      )}
      {config.extra && config.extra(monthData)}
      {filtered.length === 0
        ? <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 40 }}>내역이 없어요</div>
        : <div style={{ ...S.card, padding: 0 }}>
          {filtered.map((item, i) => (
            <div key={item.id} onDoubleClick={() => startEdit(item)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{item.description}{item.isFixed && <span style={{ ...S.tag(C.purple, C.purpleLight), marginLeft: 6 }}>고정</span>}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3, display: "flex", gap: 6, alignItems: "center" }}>
                  <Badge text={`${EMO[item.category] || ""} ${item.category}`} color={config.badgeColor} bg={config.badgeBg} />
                  <span>{item.date}</span>
                </div>
                {item.memo && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{item.memo}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: config.amountColor }}>{config.prefix || ""}{won(item.amount)}</div>
                <button onClick={() => handleDelete(item.id)} style={{ border: "none", background: "none", color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ─── 수입 ────────────────────────────────────────────────────────
function IncomeManager({ income, setIncome, year, month, w }) {
  return <TransactionManager data={income} setData={setIncome} sheetName="income" year={year} month={month} w={w} config={{ title: "수입", cats: INCOME_CATS, blank: { category: "급여", description: "", amount: "", date: todayStr() }, placeholder: "예: 12월 월급", totalColor: C.green, badgeColor: C.green, badgeBg: C.greenLight, amountColor: C.green, prefix: "+" }} />;
}

// ─── 지출 ────────────────────────────────────────────────────────
function ExpenseManager({ expense, setExpense, year, month, w }) {
  return (
    <TransactionManager data={expense} setData={setExpense} sheetName="expense" year={year} month={month} w={w}
      config={{
        title: "지출", cats: EXPENSE_CATS,
        blank: { category: "식비", description: "", amount: "", date: todayStr(), isFixed: false, memo: "" },
        placeholder: "예: 마트 장보기", totalColor: C.red, badgeColor: C.gold, badgeBg: C.goldLight, amountColor: C.red, prefix: "-",
        filters: ["전체", "고정", "변동"],
        filterFn: (d, f) => f === "고정" ? d.isFixed : !d.isFixed,
        subtitle: (data) => {
          const fix = data.filter(d => d.isFixed).reduce((s, d) => s + Number(d.amount), 0);
          const vr = data.filter(d => !d.isFixed).reduce((s, d) => s + Number(d.amount), 0);
          return `고정 ${won(fix)} · 변동 ${won(vr)}`;
        },
        extraFields: (form, setF) => (
          <>
            <Field label="메모 (선택)"><input style={S.input} placeholder="메모" value={form.memo} onChange={e => setF("memo", e.target.value)} /></Field>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}>
              <input type="checkbox" checked={form.isFixed} onChange={e => setF("isFixed", e.target.checked)} style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>고정비로 분류</span>
            </label>
          </>
        ),
      }}
    />
  );
}

// ─── 저축 ────────────────────────────────────────────────────────
function SavingsManager({ savings, setSavings, year, month, w }) {
  const allByCat = {};
  savings.forEach(s => { allByCat[s.category] = (allByCat[s.category] || 0) + Number(s.amount); });
  const totalAll = Object.values(allByCat).reduce((s, v) => s + v, 0);
  return (
    <TransactionManager data={savings} setData={setSavings} sheetName="savings" year={year} month={month} w={w}
      config={{
        title: "저축", cats: SAVINGS_CATS,
        blank: { category: "비상금", description: "", amount: "", date: todayStr(), goal: "" },
        placeholder: "예: 비상금 이체", totalColor: C.blue, badgeColor: C.blue, badgeBg: C.blueLight, amountColor: C.blue,
        extra: () => Object.keys(allByCat).length > 0 && (
          <div style={{ ...S.card, background: C.goldLight, border: `1.5px solid ${C.goldBorder}`, marginBottom: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>🏦 누적 저축 현황</div>
            {Object.entries(allByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{EMO[cat] || ""} {cat}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.blue }}>{won(amt)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${C.goldBorder}`, paddingTop: 10, marginTop: 6, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 800 }}>총 누적</span>
              <span style={{ fontWeight: 900, fontSize: 18, color: C.gold }}>{won(totalAll)}</span>
            </div>
          </div>
        ),
        extraFields: (form, setF, ww) => (
          <Field label="목표액 (선택)"><AmountInput value={form.goal} onChange={v => setF("goal", v)} /></Field>
        ),
      }}
    />
  );
}

// ════════════════════════════════════════════════════════════════════
//  자산 관리
// ════════════════════════════════════════════════════════════════════
function AssetsManager({ assets, setAssets, year, month, w }) {
  const mob = isMob(w);
  const ym = ymKey(year, month);
  const mAssets = assets.filter(a => a.yearMonth === ym);
  const totalA = mAssets.filter(a => a.atype === "자산").reduce((s, a) => s + Number(a.amount), 0);
  const totalL = mAssets.filter(a => a.atype === "부채").reduce((s, a) => s + Number(a.amount), 0);
  const netWorth = totalA - totalL;
  const [goal, setGoal] = useState(() => lload("bgt-assetgoal", ""));
  const goalN = Number(goal) || 0;
  const goalPct = goalN > 0 ? Math.min(100, Math.round((netWorth / goalN) * 100)) : 0;
  const [tab, setTab] = useState("자산"); // 자산|부채
  const [form, setForm] = useState({ atype: "자산", category: "부동산", amount: "", memo: "" });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  useEscapeClose(showForm, () => { setShowForm(false); setEditId(null); });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const cats = tab === "자산" ? ASSET_CATS : LIAB_CATS;
  const displayed = mAssets.filter(a => a.atype === tab);

  const handleSave = () => {
    if (!form.amount) return;
    const u = editId ? assets.map(a => a.id === editId ? { ...form, id: editId, yearMonth: ym } : a) : [...assets, { ...form, id: Date.now(), yearMonth: ym }];
    setAssets(u); syncSheet("assets", u);
    setForm({ atype: tab, category: cats[0], amount: "", memo: "" }); setEditId(null); setShowForm(false);
  };
  const handleDelete = (id) => { if (!window.confirm("삭제할까요?")) return; const u = assets.filter(a => a.id !== id); setAssets(u); syncSheet("assets", u); };
  const startEdit = (item) => { setForm({ atype: item.atype, category: item.category, amount: item.amount, memo: item.memo || "" }); setEditId(item.id); setShowForm(true); setTab(item.atype); };

  // 도넛 차트 (SVG)
  const DonutChart = ({ value, total, color, label }) => {
    if (total <= 0) return null;
    const r = 38, cx = 50, cy = 50, c = 2 * Math.PI * r;
    const p = Math.min(100, (value / total) * 100);
    const dash = (p / 100) * c;
    return (
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth="12" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="12" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={c / 4} strokeLinecap="round" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fontWeight="800" fill={color}>{Math.round(p)}%</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fill={C.muted}>{label}</text>
      </svg>
    );
  };

  return (
    <div>
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => { setShowForm(false); setEditId(null); }}>
          <div style={{ backgroundColor: C.surface, borderRadius: 16, padding: 26, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{editId ? "수정" : (tab === "자산" ? "자산 추가" : "부채 추가")}</div>
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ border: "none", background: C.bg, color: C.muted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <Grid cols={2} w={w}>
              <Field label="카테고리"><select style={S.select} value={form.category} onChange={e => setF("category", e.target.value)}>{cats.map(c => <option key={c}>{c}</option>)}</select></Field>
              <Field label="금액(원)"><AmountInput value={form.amount} onChange={v => setF("amount", v)} /></Field>
            </Grid>
            <Field label="메모 (선택)"><input style={S.input} placeholder="메모" value={form.memo} onChange={e => setF("memo", e.target.value)} /></Field>
            <div style={{ display: "flex", gap: 8 }}><button style={{ ...S.btn(C.gold), flex: 1 }} onClick={handleSave}>{editId ? "수정 저장" : "추가"}</button><button style={S.btnGhost} onClick={() => { setShowForm(false); setEditId(null); }}>취소</button></div>
          </div>
        </div>
      )}

      {/* 순자산 Hero */}
      <div style={{ ...S.card, background: C.gradient, border: "none" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.5)", letterSpacing: "0.1em", marginBottom: 4 }}>순 자산 · {year}년 {month}월</div>
        <div style={{ fontSize: mob ? 28 : 36, fontWeight: 900, color: C.goldDeep, marginBottom: 6 }}>{won(netWorth)}</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>자산 {won(totalA)}</span>
          <span style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>부채 {won(totalL)}</span>
        </div>
      </div>

      {/* 목표 달성률 */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>🎯 자산 목표 달성률</div>
          <Badge text={`${goalPct}%`} color={goalPct >= 100 ? C.green : C.gold} bg={goalPct >= 100 ? C.greenLight : C.goldLight} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <DonutChart value={netWorth} total={goalN} color={goalPct >= 100 ? C.green : C.gold} label="달성률" />
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8 }}>
              <label style={S.label}>목표 순자산</label>
              <AmountInput value={goal} onChange={v => { setGoal(v); lsave("bgt-assetgoal", v); }} placeholder="목표금액 입력" />
            </div>
            {goalN > 0 && <div style={{ fontSize: 12, color: C.muted }}>잔여 {won(Math.max(0, goalN - netWorth))}</div>}
          </div>
        </div>
        {goalN > 0 && <div style={{ marginTop: 12 }}><ProgressBar value={netWorth} max={goalN} color={goalPct >= 100 ? C.green : C.gold} height={10} /></div>}
      </div>

      {/* 자산/부채 탭 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["자산", "부채"].map(t => <button key={t} onClick={() => setTab(t)} style={{ border: "none", borderRadius: 20, padding: "6px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", backgroundColor: tab === t ? C.gold : C.bg, color: tab === t ? C.goldDeep : C.muted, fontFamily: "inherit" }}>{t}</button>)}
        </div>
        <button style={S.btn()} onClick={() => { setForm({ atype: tab, category: cats[0], amount: "", memo: "" }); setEditId(null); setShowForm(true); }}>+ 추가</button>
      </div>
      <div style={{ ...S.card, marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontWeight: 800, color: tab === "자산" ? C.gold : C.red }}>{tab} 합계</span>
          <span style={{ fontWeight: 900, fontSize: 18, color: tab === "자산" ? C.gold : C.red }}>{won(tab === "자산" ? totalA : totalL)}</span>
        </div>
      </div>
      {displayed.length === 0
        ? <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 40 }}>{tab} 내역이 없어요. + 추가를 눌러보세요</div>
        : <div style={{ ...S.card, padding: 0 }}>
          {displayed.map((item, i) => (
            <div key={item.id} onDoubleClick={() => startEdit(item)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: i < displayed.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{EMO[item.category] || ""} {item.category}</div>
                {item.memo && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.memo}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: tab === "자산" ? C.gold : C.red }}>{won(item.amount)}</div>
                <button onClick={() => handleDelete(item.id)} style={{ border: "none", background: "none", color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  고정비 관리
// ════════════════════════════════════════════════════════════════════
function FixedCostManager({ fixedCosts, setFixedCosts, w }) {
  const total = fixedCosts.filter(f => f.active).reduce((s, f) => s + Number(f.amount), 0);
  const blank = { name: "", category: "주거/관리비", amount: "", memo: "", active: true };
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  useEscapeClose(showForm, () => { setShowForm(false); setEditId(null); setForm(blank); });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.name || !form.amount) return;
    const u = editId ? fixedCosts.map(f => f.id === editId ? { ...form, id: editId } : f) : [...fixedCosts, { ...form, id: Date.now() }];
    setFixedCosts(u); syncSheet("fixedcost", u);
    setForm(blank); setEditId(null); setShowForm(false);
  };
  const handleDelete = (id) => { if (!window.confirm("삭제할까요?")) return; const u = fixedCosts.filter(f => f.id !== id); setFixedCosts(u); syncSheet("fixedcost", u); };
  const toggleActive = (id) => { const u = fixedCosts.map(f => f.id === id ? { ...f, active: !f.active } : f); setFixedCosts(u); syncSheet("fixedcost", u); };
  const startEdit = (item) => { setForm({ name: item.name, category: item.category, amount: item.amount, memo: item.memo || "", active: item.active }); setEditId(item.id); setShowForm(true); };

  return (
    <div>
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => { setShowForm(false); setEditId(null); setForm(blank); }}>
          <div style={{ backgroundColor: C.surface, borderRadius: 16, padding: 26, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{editId ? "고정비 수정" : "고정비 추가"}</div>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(blank); }} style={{ border: "none", background: C.bg, color: C.muted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <Grid cols={2} w={w}>
              <Field label="항목명"><input style={S.input} placeholder="예: 월세, 보험" value={form.name} onChange={e => setF("name", e.target.value)} autoFocus /></Field>
              <Field label="카테고리"><select style={S.select} value={form.category} onChange={e => setF("category", e.target.value)}>{EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}</select></Field>
            </Grid>
            <Field label="월 금액"><AmountInput value={form.amount} onChange={v => setF("amount", v)} /></Field>
            <Field label="메모"><input style={S.input} placeholder="메모" value={form.memo} onChange={e => setF("memo", e.target.value)} /></Field>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}>
              <input type="checkbox" checked={form.active} onChange={e => setF("active", e.target.checked)} style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>현재 활성</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}><button style={{ ...S.btn(C.gold), flex: 1 }} onClick={handleSave}>{editId ? "수정 저장" : "추가"}</button><button style={S.btnGhost} onClick={() => { setShowForm(false); setEditId(null); setForm(blank); }}>취소</button></div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div><div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>월 고정비 합계</div><div style={{ fontSize: 26, fontWeight: 900, color: C.purple }}>{won(total)}</div></div>
        <button style={S.btn()} onClick={() => { setForm(blank); setEditId(null); setShowForm(true); }}>+ 고정비 추가</button>
      </div>
      {fixedCosts.length === 0
        ? <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 40 }}>등록된 고정비가 없어요</div>
        : <div style={{ ...S.card, padding: 0 }}>
          {fixedCosts.map((item, i) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: i < fixedCosts.length - 1 ? `1px solid ${C.border}` : "none", opacity: item.active ? 1 : 0.45 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }} onDoubleClick={() => startEdit(item)}>
                <input type="checkbox" checked={item.active} onChange={() => toggleActive(item.id)} style={{ width: 17, height: 17, cursor: "pointer" }} onClick={e => e.stopPropagation()} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}><Badge text={`${EMO[item.category] || ""} ${item.category}`} color={C.purple} bg={C.purpleLight} />{item.memo && <span style={{ marginLeft: 6 }}>{item.memo}</span>}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.purple }}>{won(item.amount)}</div>
                <button onClick={() => handleDelete(item.id)} style={{ border: "none", background: "none", color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  예산 관리
// ════════════════════════════════════════════════════════════════════
function BudgetManager({ budget, setBudget, expense, year, month, w }) {
  const ym = ymKey(year, month);
  const mBudget = budget.filter(b => b.yearMonth === ym);
  const mExpense = expense.filter(e => e.yearMonth === ym);
  const expByCat = {};
  mExpense.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + Number(e.amount); });
  const [form, setForm] = useState({ category: EXPENSE_CATS[0], budgetAmount: "" });
  const [editId, setEditId] = useState(null);
  const handleSave = () => {
    if (!form.budgetAmount) return;
    const existing = mBudget.find(b => b.category === form.category && b.id !== editId);
    let u;
    if (existing && !editId) u = budget.map(b => b.id === existing.id ? { ...b, budgetAmount: form.budgetAmount } : b);
    else if (editId) u = budget.map(b => b.id === editId ? { ...form, id: editId, yearMonth: ym } : b);
    else u = [...budget, { ...form, id: Date.now(), yearMonth: ym }];
    setBudget(u); syncSheet("budget", u);
    setForm({ category: EXPENSE_CATS[0], budgetAmount: "" }); setEditId(null);
  };
  const handleDelete = (id) => { const u = budget.filter(b => b.id !== id); setBudget(u); syncSheet("budget", u); };
  const copyFromPrev = () => {
    const prevYm = month === 1 ? `${year - 1}-12` : ymKey(year, month - 1);
    const prev = budget.filter(b => b.yearMonth === prevYm);
    if (!prev.length) { alert("이전 달 예산 데이터가 없어요"); return; }
    const u = [...budget.filter(b => b.yearMonth !== ym), ...prev.map(b => ({ ...b, id: Date.now() + Math.random(), yearMonth: ym }))];
    setBudget(u); syncSheet("budget", u);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{year}년 {month}월 예산</div>
        <button style={S.btnOutline} onClick={copyFromPrev}>전월 복사</button>
      </div>
      <div style={{ ...S.card, backgroundColor: C.goldLight, border: `1.5px solid ${C.goldBorder}`, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>카테고리별 예산 설정</div>
        <Grid cols={2} w={w}>
          <Field label="카테고리"><select style={S.select} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>{EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}</select></Field>
          <Field label="예산 금액"><AmountInput value={form.budgetAmount} onChange={v => setForm(p => ({ ...p, budgetAmount: v }))} /></Field>
        </Grid>
        <button style={S.btn()} onClick={handleSave}>{editId ? "수정" : "예산 설정"}</button>
      </div>
      {mBudget.length === 0
        ? <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 40 }}>예산을 설정해보세요</div>
        : <div style={{ ...S.card, padding: 0 }}>
          {mBudget.map((b, i) => {
            const spent = expByCat[b.category] || 0;
            const over = spent > Number(b.budgetAmount);
            return (
              <div key={b.id} style={{ padding: "14px 16px", borderBottom: i < mBudget.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{EMO[b.category] || ""} {b.category}</span>
                    {over && <Badge text="초과" color={C.red} bg={C.redLight} />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: over ? C.red : C.muted, fontWeight: 700 }}>{pct(spent, Number(b.budgetAmount))}%</span>
                    <span style={{ fontSize: 13 }}>{won(spent)} <span style={{ color: C.muted }}>/ {won(b.budgetAmount)}</span></span>
                    <button onClick={() => handleDelete(b.id)} style={{ border: "none", background: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}>×</button>
                  </div>
                </div>
                <ProgressBar value={spent} max={Number(b.budgetAmount)} color={over ? C.red : C.gold} />
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  연간 리포트
// ════════════════════════════════════════════════════════════════════
function AnnualReport({ income, expense, savings, year, w }) {
  const mob = isMob(w);
  const months = Array.from({ length: 12 }, (_, i) => {
    const k = ymKey(year, i + 1);
    const inc = income.filter(x => x.yearMonth === k).reduce((s, x) => s + Number(x.amount), 0);
    const exp = expense.filter(x => x.yearMonth === k).reduce((s, x) => s + Number(x.amount), 0);
    const sav = savings.filter(x => x.yearMonth === k).reduce((s, x) => s + Number(x.amount), 0);
    const rate = inc > 0 ? Math.round((sav / inc) * 100) : 0;
    return { month: i + 1, label: `${i + 1}월`, inc, exp, sav, rate, net: inc - exp - sav };
  });
  const totalInc  = months.reduce((s, m) => s + m.inc, 0);
  const totalExp  = months.reduce((s, m) => s + m.exp, 0);
  const totalSav  = months.reduce((s, m) => s + m.sav, 0);
  const avgRate   = totalInc > 0 ? Math.round((totalSav / totalInc) * 100) : 0;
  const bestSavMonth = [...months].sort((a, b) => b.rate - a.rate)[0];
  const worstExpMonth = [...months].sort((a, b) => b.exp - a.exp)[0];

  return (
    <div>
      {/* 연간 요약 */}
      <div style={{ background: C.gradientDark, borderRadius: 18, padding: mob ? "22px 20px" : "28px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em", marginBottom: 6 }}>{year}년 연간 결산</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "연간 수입", amount: totalInc, color: "#EDD98A" },
            { label: "연간 지출", amount: totalExp, color: C.red },
            { label: "연간 저축", amount: totalSav, color: "#93C5FD" },
            { label: `저축률 ${avgRate}%`, amount: totalInc - totalExp - totalSav, color: "#86EFAC" },
          ].map(c => (
            <div key={c.label}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginBottom: 3 }}>{c.label}</div>
              <div style={{ fontSize: mob ? 14 : 17, fontWeight: 900, color: c.color }}>{won(c.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 인사이트 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ backgroundColor: C.greenLight, borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 4 }}>💚 저축률 최고 월</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: C.green }}>{bestSavMonth.label}</div>
          <div style={{ fontSize: 12, color: C.green }}>저축률 {bestSavMonth.rate}% · {won(bestSavMonth.sav)}</div>
        </div>
        <div style={{ backgroundColor: C.redLight, borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 4 }}>❗ 지출 최고 월</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: C.red }}>{worstExpMonth.label}</div>
          <div style={{ fontSize: 12, color: C.red }}>지출 {won(worstExpMonth.exp)}</div>
        </div>
      </div>

      {/* 월별 수입 차트 */}
      <div style={S.card}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>💰 월별 수입</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>연 총 {won(totalInc)}</div>
        <BarChart data={months.map(m => ({ label: m.label, value: m.inc }))} h={100} color={C.gold} />
      </div>

      {/* 월별 지출 차트 */}
      <div style={S.card}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>💸 월별 지출</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>연 총 {won(totalExp)}</div>
        <BarChart data={months.map(m => ({ label: m.label, value: m.exp }))} h={100} color={C.red} />
      </div>

      {/* 월별 저축률 차트 */}
      <div style={S.card}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🏦 월별 저축률</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>연 평균 저축률 {avgRate}%</div>
        <BarChart data={months.map(m => ({ label: m.label, value: m.rate }))} h={100} color={C.blue} />
      </div>

      {/* 월별 상세 테이블 */}
      <div style={{ ...S.card, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 480 }}>
          <thead>
            <tr style={{ backgroundColor: C.bg }}>
              {["월", "수입", "지출", "저축", "저축률", "순잔액"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: h === "월" ? "center" : "right", fontWeight: 800, color: C.muted, fontSize: 11, borderBottom: `2px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={m.month} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: i % 2 === 1 ? "rgba(201,168,76,0.03)" : "transparent" }}>
                <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700 }}>{m.label}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.green }}>{m.inc > 0 ? won(m.inc) : "-"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.red }}>{m.exp > 0 ? won(m.exp) : "-"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: C.blue }}>{m.sav > 0 ? won(m.sav) : "-"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: C.gold }}>{m.rate > 0 ? `${m.rate}%` : "-"}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: m.net >= 0 ? C.gold : C.red }}>{won(m.net)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: C.goldLight, fontWeight: 900 }}>
              <td style={{ padding: "10px 12px", textAlign: "center" }}>합계</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: C.green }}>{won(totalInc)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: C.red }}>{won(totalExp)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: C.blue }}>{won(totalSav)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: C.gold }}>{avgRate}%</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: C.gold }}>{won(totalInc - totalExp - totalSav)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  앱 루트
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const w = useWidth();
  const mob = isMob(w);
  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth() + 1;
  const [year, setYear]   = useState(() => lload("bgt-year", thisYear));
  const [month, setMonth] = useState(() => lload("bgt-month", thisMonth));
  const [page, setPage]   = useState(() => lload("bgt-page", "dashboard"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState("local");
  const [income,     setIncome]     = useState(() => lload("budget-income",    []));
  const [expense,    setExpense]    = useState(() => lload("budget-expense",   []));
  const [savings,    setSavings]    = useState(() => lload("budget-savings",   []));
  const [budget,     setBudget]     = useState(() => lload("budget-budget",    []));
  const [fixedCosts, setFixedCosts] = useState(() => lload("budget-fixedcost", []));
  const [assets,     setAssets]     = useState(() => lload("budget-assets",    []));

  useEffect(() => { lsave("bgt-year", year); lsave("bgt-month", month); }, [year, month]);
  useEffect(() => { lsave("bgt-page", page); }, [page]);

  useEffect(() => {
    if (!SHEET_URL) return;
    setSyncStatus("loading");
    fetch(SHEET_URL + "?t=" + Date.now())
      .then(r => r.json())
      .then(data => {
        if (data.result === "success" && data.data) {
          const d = data.data;
          if (d.income)    { setIncome(d.income);        lsave("budget-income",    d.income); }
          if (d.expense)   { setExpense(d.expense);      lsave("budget-expense",   d.expense); }
          if (d.savings)   { setSavings(d.savings);      lsave("budget-savings",   d.savings); }
          if (d.budget)    { setBudget(d.budget);        lsave("budget-budget",    d.budget); }
          if (d.fixedcost) { setFixedCosts(d.fixedcost); lsave("budget-fixedcost", d.fixedcost); }
          if (d.assets)    { setAssets(d.assets);        lsave("budget-assets",    d.assets); }
        }
        setSyncStatus("ok");
      })
      .catch(() => setSyncStatus("error"));
  }, []);

  // 당겨서 새로고침
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 80;
  const handleTouchStart = (e) => { if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e) => {
    if (!touchStartY.current) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && window.scrollY === 0) { setIsPulling(true); setPullY(Math.min(dy * 0.4, PULL_THRESHOLD + 20)); }
  };
  const handleTouchEnd = () => { if (pullY >= PULL_THRESHOLD) window.location.reload(); setIsPulling(false); setPullY(0); touchStartY.current = 0; };
  useEscapeClose(menuOpen, () => setMenuOpen(false));

  const nav = [
    { id: "dashboard",  label: "대시보드", icon: "📊" },
    { id: "income",     label: "수입",     icon: "💰" },
    { id: "expense",    label: "지출",     icon: "💸" },
    { id: "savings",    label: "저축",     icon: "🏦" },
    { id: "assets",     label: "자산",     icon: "🏛" },
    { id: "fixedcost",  label: "고정비",   icon: "📌" },
    { id: "budget",     label: "예산",     icon: "📋" },
    { id: "annual",     label: "연간리포트", icon: "📈" },
  ];
  const goTo = (id) => { setPage(id); setMenuOpen(false); };
  const changeMonth = (y, m) => { setYear(y); setMonth(m); };

  const props = { year, month, w };
  const renderPage = () => {
    switch (page) {
      case "dashboard":  return <Dashboard income={income} expense={expense} savings={savings} budget={budget} fixedCosts={fixedCosts} assets={assets} {...props} />;
      case "income":     return <IncomeManager income={income} setIncome={setIncome} {...props} />;
      case "expense":    return <ExpenseManager expense={expense} setExpense={setExpense} {...props} />;
      case "savings":    return <SavingsManager savings={savings} setSavings={setSavings} {...props} />;
      case "assets":     return <AssetsManager assets={assets} setAssets={setAssets} {...props} />;
      case "fixedcost":  return <FixedCostManager fixedCosts={fixedCosts} setFixedCosts={setFixedCosts} {...props} />;
      case "budget":     return <BudgetManager budget={budget} setBudget={setBudget} expense={expense} {...props} />;
      case "annual":     return <AnnualReport income={income} expense={expense} savings={savings} year={year} w={w} />;
      default: return null;
    }
  };

  const GoldTitle = ({ style }) => (
    <div style={{ fontWeight: 900, background: C.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", ...style }}>💛 우리 가계부</div>
  );


  // ─── 모바일 ─────────────────────────────────────────────────────
  if (mob) return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      {isPulling && (
        <div style={{ position: "fixed", top: `calc(env(safe-area-inset-top,0px) + 54px)`, left: 0, right: 0, zIndex: 500, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ marginTop: 8, width: 36, height: 36, borderRadius: "50%", backgroundColor: C.surface, border: `2px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16 }}>{pullY >= PULL_THRESHOLD ? "✅" : "↓"}</span>
          </div>
        </div>
      )}
      <div style={{ transform: isPulling ? `translateY(${pullY}px)` : "none", transition: isPulling ? "none" : "transform 0.25s ease" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 200, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, paddingTop: "env(safe-area-inset-top,0px)", paddingLeft: 16, paddingRight: 16, minHeight: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <GoldTitle style={{ fontSize: 17 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SyncBadge status={syncStatus} />
            <button onClick={() => setMenuOpen(true)} style={{ border: "none", backgroundColor: "transparent", fontSize: 22, cursor: "pointer", color: C.gold }}>☰</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", backgroundColor: C.goldLight, borderBottom: `1px solid ${C.goldBorder}` }}>
          <MonthNav year={year} month={month} onChange={changeMonth} />
          <SyncBadge status={syncStatus} />
        </div>
        {menuOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setMenuOpen(false)}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 270, height: "100%", backgroundColor: C.surface, padding: "20px 12px", paddingTop: "max(20px,calc(env(safe-area-inset-top,0px) + 16px))", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <GoldTitle style={{ fontSize: 18, marginBottom: 20, padding: "0 8px" }} />
              {nav.map(n => (
                <button key={n.id} onClick={() => goTo(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "12px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 15, fontWeight: page === n.id ? 700 : 400, backgroundColor: page === n.id ? C.goldLight : "transparent", color: page === n.id ? C.goldDark : C.ink, marginBottom: 2, fontFamily: "inherit" }}>
                  <span style={{ fontSize: 18 }}>{n.icon}</span><span>{n.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding: "16px 14px", paddingBottom: `calc(80px + env(safe-area-inset-bottom,0px))`, paddingLeft: `max(14px,env(safe-area-inset-left,0px))`, paddingRight: `max(14px,env(safe-area-inset-right,0px))` }}>
          {renderPage()}
        </div>
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTop: `1px solid ${C.border}`, zIndex: 100, paddingBottom: "env(safe-area-inset-bottom,0px)", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "flex", minWidth: "max-content" }}>
            {nav.map(n => (
              <button key={n.id} onClick={() => goTo(n.id)} style={{ minWidth: 64, border: "none", backgroundColor: "transparent", padding: "8px 10px 6px", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <span style={{ fontSize: 9, fontWeight: page === n.id ? 700 : 400, color: page === n.id ? C.gold : C.muted, whiteSpace: "nowrap" }}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: C.bg }}>
      <div style={{ width: isTab(w) ? 190 : 230, minHeight: "100vh", backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, flexShrink: 0, position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "28px 20px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <GoldTitle style={{ fontSize: isTab(w) ? 17 : 20, marginBottom: 8, lineHeight: 1.3 }} />
          <SyncBadge status={syncStatus} />
        </div>
        <div style={{ padding: 12, flex: 1 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: isTab(w) ? 13 : 14, fontWeight: page === n.id ? 700 : 400, backgroundColor: page === n.id ? C.goldLight : "transparent", color: page === n.id ? C.goldDark : C.ink, marginBottom: 2, fontFamily: "inherit" }}>
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <MonthNav year={year} month={month} onChange={changeMonth} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>{nav.find(n => n.id === page)?.label}</span>
        </div>
        <div style={{ padding: "24px 28px", maxWidth: 860 }}>{renderPage()}</div>
      </div>
    </div>
  );
}
