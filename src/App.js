import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, CreditCard, PiggyBank,
  Landmark, Settings, Plus, Trash2, ChevronLeft, ChevronRight, Wallet,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";

/* ============================================================
   우리집 가계부 — pay-cycle aware household finance app.
   Design signature: a "pay-cycle timeline" that visualizes the
   gap between payday and next month's bills — bright airy bento
   layout on soft lavender-white, violet/mint/coral accents,
   tabular numerals throughout.
   ============================================================ */

const BG = "#F5F4FB";
const SURFACE = "#FFFFFF";
const SURFACE_2 = "#F1EFFB";
const BORDER = "rgba(27,36,48,0.09)";
const TEXT = "#1C2130";
const TEXT_DIM = "#6B7280";
const TEXT_FAINT = "#9BA1B0";
const VIOLET = "#6E5FE0";
const VIOLET_SOFT = "rgba(110,95,224,0.12)";
const MINT = "#1FA971";
const CORAL = "#E0555D";
const GOLD = "#C2871F";
const ON_ACCENT = "#FFFFFF";

const displayFont = "'Pretendard','Inter',-apple-system,sans-serif";
const numFont = "'IBM Plex Mono',ui-monospace,monospace";

const won = (n) => (Math.round(n || 0)).toLocaleString("ko-KR");
const uid = () => Math.random().toString(36).slice(2, 10);
const pad2 = (n) => String(n).padStart(2, "0");
const ymOf = (dateStr) => (dateStr || "").slice(0, 7);
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const DEFAULT_CATEGORIES = [
  { main: "수입", type: "income", subs: ["남편급여", "아내급여", "부수입", "기타소득"] },
  { main: "저축_투자", type: "saving", subs: ["예적금", "주식계좌", "펀드/ETF"] },
  { main: "연금_노후", type: "saving", subs: ["개인연금", "퇴직연금"] },
  { main: "주거", type: "expense", subs: ["관리비", "도시가스", "대출이자"] },
  { main: "식비", type: "expense", subs: ["식자재", "외식", "카페류"] },
  { main: "생활용품", type: "expense", subs: ["생활소모품", "가전/가구"] },
  { main: "건강", type: "expense", subs: ["병원/약국", "건강보조"] },
  { main: "자기계발", type: "expense", subs: ["스터디/수강", "운동", "도서"] },
  { main: "자동차", type: "expense", subs: ["주유", "주차/통행료", "보험/세금"] },
  { main: "자녀", type: "expense", subs: ["육아용품", "교육/도서"] },
  { main: "여행/문화", type: "expense", subs: ["국내여행", "공연/OTT"] },
  { main: "경조사", type: "expense", subs: ["가족/친척", "지인/동료"] },
  { main: "용돈", type: "expense", subs: ["남편용돈", "아내용돈"] },
  { main: "보험", type: "expense", subs: ["종합보험", "실비보험"] },
  { main: "통신비", type: "expense", subs: ["휴대폰", "인터넷/TV"] },
  { main: "기타", type: "expense", subs: ["세금", "회비", "서비스"] },
];

const DEFAULT_ACCOUNTS = [
  { id: uid(), name: "생활비통장", bank: "국민은행" },
  { id: uid(), name: "급여통장", bank: "카카오뱅크" },
];
const DEFAULT_CARDS = [
  { id: uid(), name: "생활비카드1", cardType: "credit", billingDay: 14, accountId: null },
  { id: uid(), name: "체크카드", cardType: "debit", billingDay: null, accountId: null },
];
const DEFAULT_OTHER_PAYMENTS = ["현금", "상품권"];

const DEFAULT_PROFILES = [
  { id: uid(), name: "남편", payday: 10, amount: 0 },
  { id: uid(), name: "아내", payday: 20, amount: 0 },
];

const NAV = [
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { key: "income", label: "수입", icon: ArrowDownCircle },
  { key: "expense", label: "지출", icon: ArrowUpCircle },
  { key: "card", label: "카드관리", icon: CreditCard },
  { key: "saving", label: "저축", icon: PiggyBank },
  { key: "asset", label: "자산", icon: Landmark },
  { key: "settings", label: "설정", icon: Settings },
];

/* ---------- card billing-cycle helper ---------- */
function cardCycle(card, transactions, ref = new Date()) {
  const day = Math.min(card.billingDay || 1, 28);
  let last = new Date(ref.getFullYear(), ref.getMonth(), day);
  if (last > ref) last = new Date(ref.getFullYear(), ref.getMonth() - 1, day);
  const next = new Date(last.getFullYear(), last.getMonth() + 1, day);
  const spend = transactions
    .filter((t) => t.cardId === card.id && t.type === "expense")
    .filter((t) => {
      const d = new Date(t.date);
      return d > last && d <= ref;
    })
    .reduce((a, t) => a + Number(t.amount), 0);
  return { lastBilling: last, nextBilling: next, spend };
}
function debitMonthSpend(card, transactions, ref = new Date()) {
  const key = `${ref.getFullYear()}-${pad2(ref.getMonth() + 1)}`;
  return transactions
    .filter((t) => t.cardId === card.id && t.type === "expense" && ymOf(t.date) === key)
    .reduce((a, t) => a + Number(t.amount), 0);
}
function paymentLabel(t, cards, accounts) {
  if (t.cardId) {
    const c = cards.find((x) => x.id === t.cardId);
    if (c) {
      const acc = accounts.find((a) => a.id === c.accountId);
      return `${c.name}${acc ? " · " + acc.name : ""}`;
    }
  }
  if (t.accountId) {
    const a = accounts.find((x) => x.id === t.accountId);
    if (a) return a.name;
  }
  return t.paymentNote || "현금";
}

export default function HouseholdLedger() {
  const [page, setPage] = useState("dashboard");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [otherPayments, setOtherPayments] = useState(DEFAULT_OTHER_PAYMENTS);
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [goals, setGoals] = useState([]);
  const [assets, setAssets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ym, setYm] = useState(ymOf(todayStr()));

  const mainType = (main) => categories.find((c) => c.main === main)?.type || "expense";

  const addTx = (entry) => setTransactions((t) => [...t, { id: uid(), isFixed: false, ...entry }]);
  const removeTx = (id) => setTransactions((t) => t.filter((x) => x.id !== id));

  const shiftMonth = (delta) => {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setYm(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
  };

  const shared = { categories, setCategories, accounts, setAccounts, cards, setCards, otherPayments, setOtherPayments, mainType, transactions, addTx, removeTx, ym, setYm, shiftMonth, profiles, setProfiles, goals, setGoals, assets, setAssets };

  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: displayFont }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&display=swap');
        *{box-sizing:border-box;}
        input,select,button{font-family:${displayFont};}
        table{border-collapse:collapse;width:100%;}
        .tnum{font-family:${numFont};font-variant-numeric:tabular-nums;}
        ::-webkit-scrollbar{width:8px;height:8px;}
        ::-webkit-scrollbar-thumb{background:${SURFACE_2};border-radius:8px;}
        .shell{display:flex;min-height:100vh;}
        .sidebar{display:none;}
        .bottomnav{position:fixed;left:0;right:0;bottom:0;display:flex;background:${SURFACE};border-top:1px solid ${BORDER};z-index:40;padding:6px 4px calc(env(safe-area-inset-bottom,0px) + 4px);}
        .main{flex:1;min-width:0;padding:18px 16px 96px;}
        .container{max-width:1360px;margin:0 auto;width:100%;}
        .bento{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;}
        .twocol{display:grid;grid-template-columns:1fr;gap:20px;}
        @media (min-width:1024px){
          .sidebar{display:flex;position:fixed;top:0;bottom:0;left:0;width:244px;flex-direction:column;padding:26px 16px;border-right:1px solid ${BORDER};background:${SURFACE};z-index:30;}
          .bottomnav{display:none;}
          .main{margin-left:244px;padding:36px 44px 44px;}
          .twocol{grid-template-columns:1.4fr 1fr;}
        }
      `}</style>

      <div className="shell">
        <aside className="sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 30, padding: "0 6px" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${VIOLET}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={17} color={ON_ACCENT} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>우리집 가계부</span>
          </div>
          {NAV.map((n) => (
            <NavItem key={n.key} item={n} active={page === n.key} onClick={() => setPage(n.key)} />
          ))}
        </aside>

        <main className="main">
          <div className="container">
            {page === "dashboard" && <Dashboard {...shared} />}
            {page === "income" && <IncomePage {...shared} />}
            {page === "expense" && <ExpensePage {...shared} />}
            {page === "card" && <CardPage {...shared} />}
            {page === "saving" && <SavingPage {...shared} />}
            {page === "asset" && <AssetPage {...shared} />}
            {page === "settings" && <SettingsPage {...shared} />}
          </div>
        </main>
      </div>

      <nav className="bottomnav">
        {NAV.map((n) => (
          <NavItem key={n.key} item={n} active={page === n.key} onClick={() => setPage(n.key)} bottom />
        ))}
      </nav>
    </div>
  );
}

function NavItem({ item, active, onClick, bottom }) {
  const Icon = item.icon;
  if (bottom) {
    return (
      <button onClick={onClick} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 2px", color: active ? VIOLET : TEXT_FAINT, cursor: "pointer" }}>
        <Icon size={19} />
        <span style={{ fontSize: 10.5, fontWeight: 600 }}>{item.label}</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 2,
        borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
        background: active ? VIOLET_SOFT : "transparent",
        color: active ? VIOLET : TEXT_DIM, fontSize: 14, fontWeight: active ? 700 : 500,
      }}
    >
      <item.icon size={17} />
      {item.label}
    </button>
  );
}

/* ---------------- shared UI atoms ---------------- */
function PageTitle({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{children}</h1>
      {right}
    </div>
  );
}
function Card({ children, style }) {
  return <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18, boxShadow: "0 1px 2px rgba(27,36,48,0.04), 0 8px 24px rgba(27,36,48,0.05)", ...style }}>{children}</div>;
}
function Stat({ label, value, suffix, tone, big }) {
  const color = tone === "mint" ? MINT : tone === "coral" ? CORAL : tone === "gold" ? GOLD : TEXT;
  return (
    <Card>
      <div style={{ fontSize: 12.5, color: TEXT_DIM, marginBottom: 8 }}>{label}</div>
      <div className="tnum" style={{ fontSize: big ? 26 : 20, fontWeight: 700, color }}>
        {value}<span style={{ fontSize: 12, color: TEXT_FAINT, marginLeft: 3, fontFamily: displayFont }}>{suffix}</span>
      </div>
    </Card>
  );
}
function SectionLabel({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_DIM, marginBottom: 10, marginTop: 26, textTransform: "uppercase", letterSpacing: 0.6 }}>{children}</div>;
}
function MonthNav({ ym, shiftMonth }) {
  const [y, m] = ym.split("-").map(Number);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "6px 10px" }}>
      <button onClick={() => shiftMonth(-1)} style={iconBtn}><ChevronLeft size={16} /></button>
      <span className="tnum" style={{ fontSize: 14, fontWeight: 700, minWidth: 84, textAlign: "center" }}>{y}년 {m}월</span>
      <button onClick={() => shiftMonth(1)} style={iconBtn}><ChevronRight size={16} /></button>
    </div>
  );
}
const iconBtn = { background: "none", border: "none", color: TEXT_DIM, cursor: "pointer", display: "flex" };
const inputStyle = { border: `1px solid ${BORDER}`, background: SURFACE_2, color: TEXT, borderRadius: 8, padding: "8px 10px", fontSize: 13.5, width: "100%" };
const primaryBtn = { display: "flex", alignItems: "center", gap: 5, background: `linear-gradient(135deg, ${VIOLET}, #8B7CF6)`, color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };

/* ================= 대시보드 ================= */
function Dashboard({ profiles, cards, transactions }) {
  const currentYM = ymOf(todayStr());
  const today = new Date();
  const day = today.getDate();

  const fixedThisMonth = transactions
    .filter((t) => t.type === "expense" && t.isFixed && ymOf(t.date) === currentYM)
    .reduce((a, t) => a + Number(t.amount), 0);

  const creditCards = cards.filter((c) => c.cardType !== "debit");
  const cardUpcoming = creditCards.map((c) => ({ ...c, ...cardCycle(c, transactions, today) }));
  const cardTotal = cardUpcoming.reduce((a, c) => a + c.spend, 0);
  const expectedIncome = profiles.reduce((a, p) => a + Number(p.amount || 0), 0);
  const available = expectedIncome - fixedThisMonth - cardTotal;

  const last6 = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
      const inc = transactions.filter((t) => t.type === "income" && ymOf(t.date) === key).reduce((a, t) => a + Number(t.amount), 0);
      const exp = transactions.filter((t) => t.type === "expense" && ymOf(t.date) === key).reduce((a, t) => a + Number(t.amount), 0);
      arr.push({ name: `${d.getMonth() + 1}월`, 수입: inc, 지출: exp });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  return (
    <div>
      <PageTitle right={<span className="tnum" style={{ fontSize: 13, color: TEXT_DIM }}>{todayStr()} 기준</span>}>대시보드</PageTitle>

      <Card style={{ marginBottom: 20, background: `linear-gradient(135deg, ${SURFACE} 60%, ${VIOLET_SOFT})` }}>
        <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 14 }}>페이 사이클 — 이번 급여로 다음달까지 버텨요</div>
        <PayCycleTimeline profiles={profiles} day={day} />
      </Card>

      <div className="bento" style={{ marginBottom: 6 }}>
        <Stat label="이번달 예상 수입" value={won(expectedIncome)} suffix="원" big />
        <Stat label="다음달 고정비" value={won(fixedThisMonth)} suffix="원" tone="coral" big />
        <Stat label="다음달 카드값 예상" value={won(cardTotal)} suffix="원" tone="coral" big />
        <Stat label="가용 여유자금" value={won(available)} suffix="원" tone={available >= 0 ? "mint" : "coral"} big />
      </div>

      <SectionLabel>신용카드 청구 예정</SectionLabel>
      <div className="bento">
        {cardUpcoming.length === 0 && <Card><span style={{ color: TEXT_DIM, fontSize: 13 }}>등록된 신용카드가 없어요. 카드관리에서 추가해보세요.</span></Card>}
        {cardUpcoming.map((c) => (
          <Card key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
              <span style={{ fontSize: 11, color: TEXT_FAINT }}>{c.nextBilling.getMonth() + 1}/{c.nextBilling.getDate()} 청구</span>
            </div>
            <div className="tnum" style={{ fontSize: 19, fontWeight: 700, color: CORAL }}>{won(c.spend)}원</div>
          </Card>
        ))}
      </div>

      <SectionLabel>최근 6개월 수입 · 지출</SectionLabel>
      <Card>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={last6}>
            <CartesianGrid stroke={BORDER} strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: TEXT_DIM }} axisLine={{ stroke: BORDER }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: TEXT_DIM }} tickFormatter={(v) => v / 10000 + "만"} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => won(v) + "원"} contentStyle={{ background: SURFACE_2, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
            <Line type="monotone" dataKey="수입" stroke={MINT} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="지출" stroke={CORAL} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function PayCycleTimeline({ profiles, day }) {
  const width = 100;
  return (
    <div style={{ position: "relative", height: 54 }}>
      <div style={{ position: "absolute", top: 24, left: 0, right: 0, height: 4, background: SURFACE_2, borderRadius: 4 }} />
      <div style={{ position: "absolute", top: 24, left: 0, width: `${Math.min(day / 30, 1) * width}%`, height: 4, background: `linear-gradient(90deg, ${MINT}, ${VIOLET})`, borderRadius: 4 }} />
      {profiles.map((p) => {
        const left = Math.min(p.payday / 30, 1) * width;
        return (
          <div key={p.id} style={{ position: "absolute", top: 0, left: `${left}%`, transform: "translateX(-50%)", textAlign: "center" }}>
            <div style={{ fontSize: 10.5, color: TEXT_DIM, marginBottom: 2, whiteSpace: "nowrap" }}>{p.name} {p.payday}일</div>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: GOLD, margin: "0 auto" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 18, left: `${Math.min(day / 30, 1) * width}%`, transform: "translateX(-50%)", textAlign: "center" }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: TEXT, border: `3px solid ${SURFACE}`, margin: "0 auto" }} />
        <div style={{ fontSize: 10.5, color: TEXT, marginTop: 4, fontWeight: 700 }}>오늘 {day}일</div>
      </div>
    </div>
  );
}

/* ================= 수입 ================= */
function IncomePage({ categories, transactions, addTx, removeTx, ym, shiftMonth, profiles, setProfiles }) {
  const [form, setForm] = useState({ date: todayStr(), sub: "", desc: "", amount: "" });
  const incomeMain = categories.find((c) => c.type === "income");
  const list = transactions.filter((t) => t.type === "income" && ymOf(t.date) === ym);
  const total = list.reduce((a, t) => a + Number(t.amount), 0);

  const submit = () => {
    if (!form.date || !form.amount || !form.sub) return;
    addTx({ ...form, main: incomeMain.main, type: "income", amount: Number(form.amount), payment: "-" });
    setForm({ date: todayStr(), sub: "", desc: "", amount: "" });
  };
  const updateProfile = (id, key, val) => setProfiles((ps) => ps.map((p) => (p.id === id ? { ...p, [key]: val } : p)));

  return (
    <div>
      <PageTitle right={<MonthNav ym={ym} shiftMonth={shiftMonth} />}>수입</PageTitle>

      <SectionLabel>급여 프로필 (예상 금액 · 페이데이)</SectionLabel>
      <div className="bento" style={{ marginBottom: 6 }}>
        {profiles.map((p) => (
          <Card key={p.id}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{p.name}</div>
            <label style={{ fontSize: 11.5, color: TEXT_DIM }}>매월 급여일</label>
            <input type="number" value={p.payday} onChange={(e) => updateProfile(p.id, "payday", Number(e.target.value))} className="tnum" style={{ ...inputStyle, marginBottom: 8, marginTop: 4 }} />
            <label style={{ fontSize: 11.5, color: TEXT_DIM }}>예상 급여액</label>
            <input type="number" value={p.amount} onChange={(e) => updateProfile(p.id, "amount", Number(e.target.value))} className="tnum" style={{ ...inputStyle, marginTop: 4 }} />
          </Card>
        ))}
      </div>

      <SectionLabel>이번 달 실제 수입 입력</SectionLabel>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr 1fr auto", gap: 8, marginBottom: 14 }}>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
          <select value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value })} style={inputStyle}>
            <option value="">항목 선택</option>
            {incomeMain.subs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="메모" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} style={inputStyle} />
          <input placeholder="금액" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
          <button onClick={submit} style={primaryBtn}><Plus size={14} /> 추가</button>
        </div>
        <table>
          <thead>
            <tr style={{ fontSize: 11.5, color: TEXT_DIM }}>
              <th style={{ textAlign: "left", padding: "6px 4px" }}>일자</th>
              <th style={{ textAlign: "left" }}>항목</th>
              <th style={{ textAlign: "left" }}>메모</th>
              <th style={{ textAlign: "right" }}>금액</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: TEXT_FAINT, fontSize: 13 }}>이번 달 수입 내역이 없어요.</td></tr>}
            {list.map((t) => (
              <tr key={t.id} style={{ borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
                <td className="tnum" style={{ padding: "8px 4px" }}>{t.date}</td>
                <td>{t.sub}</td>
                <td style={{ color: TEXT_DIM }}>{t.desc}</td>
                <td className="tnum" style={{ textAlign: "right", color: MINT }}>{won(t.amount)}</td>
                <td style={{ textAlign: "center" }}><button onClick={() => removeTx(t.id)} style={iconBtn}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
          {list.length > 0 && (
            <tfoot><tr style={{ borderTop: `2px solid ${BORDER}`, fontSize: 13, fontWeight: 700 }}>
              <td colSpan={3} style={{ padding: "8px 4px" }}>합계</td>
              <td className="tnum" style={{ textAlign: "right", color: MINT }}>{won(total)}</td><td /></tr></tfoot>
          )}
        </table>
      </Card>
    </div>
  );
}

/* ================= 지출 ================= */
function ExpensePage({ categories, cards, accounts, otherPayments, transactions, addTx, removeTx, ym, shiftMonth }) {
  const expenseCats = categories.filter((c) => c.type !== "income");
  const defaultPayType = cards.length ? "card" : accounts.length ? "account" : "cash";
  const [form, setForm] = useState({
    date: todayStr(), main: expenseCats[0].main, sub: expenseCats[0].subs[0] || "", desc: "", amount: "",
    isFixed: false, payType: defaultPayType, cardId: cards[0]?.id || "", accountId: accounts[0]?.id || "", paymentNote: otherPayments[0] || "현금",
  });
  const [filter, setFilter] = useState("all");

  const list = transactions.filter((t) => t.type !== "income" && ymOf(t.date) === ym)
    .filter((t) => filter === "all" || (filter === "fixed" ? t.isFixed : !t.isFixed));

  const subsFor = (main) => categories.find((c) => c.main === main)?.subs || [];
  const submit = () => {
    if (!form.date || !form.amount) return;
    const type = categories.find((c) => c.main === form.main)?.type || "expense";
    const entry = { date: form.date, main: form.main, sub: form.sub, desc: form.desc, isFixed: form.isFixed, type, amount: Number(form.amount) };
    if (form.payType === "card") {
      const card = cards.find((c) => c.id === form.cardId);
      entry.cardId = form.cardId;
      entry.accountId = card?.accountId || null;
    } else if (form.payType === "account") {
      entry.accountId = form.accountId;
    } else {
      entry.paymentNote = form.paymentNote;
    }
    addTx(entry);
    setForm((f) => ({ ...f, desc: "", amount: "" }));
  };

  const byMain = {};
  list.forEach((t) => { byMain[t.main] = (byMain[t.main] || 0) + Number(t.amount); });
  const topCats = Object.entries(byMain).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, amt]) => ({ name, amt }));
  const totalExpense = list.filter((t) => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);

  return (
    <div>
      <PageTitle right={<MonthNav ym={ym} shiftMonth={shiftMonth} />}>지출</PageTitle>

      <div className="twocol">
        <div>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
              <select value={form.main} onChange={(e) => setForm({ ...form, main: e.target.value, sub: subsFor(e.target.value)[0] || "" })} style={inputStyle}>
                {expenseCats.map((c) => <option key={c.main} value={c.main}>{c.main}</option>)}
              </select>
              <select value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value })} style={inputStyle}>
                {subsFor(form.main).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 8, marginBottom: 8 }}>
              <input placeholder="사용내역" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} style={inputStyle} />
              <input placeholder="금액" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {[["card", "카드"], ["account", "계좌이체"], ["cash", "현금/기타"]].map(([k, l]) => (
                <button key={k} onClick={() => setForm({ ...form, payType: k })} style={{ ...inputStyle, width: "auto", cursor: "pointer", background: form.payType === k ? VIOLET_SOFT : SURFACE_2, color: form.payType === k ? VIOLET : TEXT_DIM, fontWeight: 600, border: `1px solid ${form.payType === k ? VIOLET : BORDER}` }}>{l}</button>
              ))}
            </div>
            <div style={{ marginBottom: 10 }}>
              {form.payType === "card" && (
                cards.length ? (
                  <select value={form.cardId} onChange={(e) => setForm({ ...form, cardId: e.target.value })} style={inputStyle}>
                    {cards.map((c) => {
                      const acc = accounts.find((a) => a.id === c.accountId);
                      return <option key={c.id} value={c.id}>{c.name} ({c.cardType === "credit" ? "신용" : "체크"}{acc ? " · " + acc.name : ""})</option>;
                    })}
                  </select>
                ) : <div style={{ fontSize: 12.5, color: TEXT_FAINT }}>등록된 카드가 없어요. 카드관리에서 추가해주세요.</div>
              )}
              {form.payType === "account" && (
                accounts.length ? (
                  <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} style={inputStyle}>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>)}
                  </select>
                ) : <div style={{ fontSize: 12.5, color: TEXT_FAINT }}>등록된 계좌가 없어요. 카드관리에서 추가해주세요.</div>
              )}
              {form.payType === "cash" && (
                <select value={form.paymentNote} onChange={(e) => setForm({ ...form, paymentNote: e.target.value })} style={inputStyle}>
                  {otherPayments.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: TEXT_DIM, cursor: "pointer" }}>
                <input type="checkbox" checked={form.isFixed} onChange={(e) => setForm({ ...form, isFixed: e.target.checked })} />
                고정비 (매달 반복)
              </label>
              <button onClick={submit} style={primaryBtn}><Plus size={14} /> 추가</button>
            </div>
          </Card>

          <div style={{ display: "flex", gap: 6, margin: "16px 0 10px" }}>
            {[["all", "전체"], ["fixed", "고정비"], ["variable", "변동비"]].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{ ...inputStyle, width: "auto", cursor: "pointer", background: filter === k ? VIOLET_SOFT : SURFACE_2, color: filter === k ? VIOLET : TEXT_DIM, fontWeight: 600, border: `1px solid ${filter === k ? VIOLET : BORDER}` }}>{l}</button>
            ))}
          </div>

          <Card>
            <table>
              <thead>
                <tr style={{ fontSize: 11.5, color: TEXT_DIM }}>
                  <th style={{ textAlign: "left", padding: "6px 4px" }}>일자</th>
                  <th style={{ textAlign: "left" }}>분류</th>
                  <th style={{ textAlign: "left" }}>내역</th>
                  <th style={{ textAlign: "right" }}>금액</th>
                  <th style={{ textAlign: "left" }}>결제</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: TEXT_FAINT, fontSize: 13 }}>내역이 없어요.</td></tr>}
                {[...list].sort((a, b) => (a.date < b.date ? 1 : -1)).map((t) => (
                  <tr key={t.id} style={{ borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
                    <td className="tnum" style={{ padding: "8px 4px" }}>{t.date}</td>
                    <td>{t.main} {t.isFixed && <span style={{ fontSize: 10, color: GOLD, marginLeft: 3 }}>●고정</span>}</td>
                    <td style={{ color: TEXT_DIM }}>{t.desc || t.sub}</td>
                    <td className="tnum" style={{ textAlign: "right", color: t.type === "saving" ? GOLD : CORAL }}>{won(t.amount)}</td>
                    <td style={{ color: TEXT_DIM, fontSize: 12 }}>{paymentLabel(t, cards, accounts)}</td>
                    <td style={{ textAlign: "center" }}><button onClick={() => removeTx(t.id)} style={iconBtn}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div>
          <Stat label="이번 달 총지출" value={won(totalExpense)} suffix="원" tone="coral" big />
          <SectionLabel>카테고리 TOP 6</SectionLabel>
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCats} layout="vertical" margin={{ left: 6 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={78} tick={{ fontSize: 11, fill: TEXT_DIM }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => won(v) + "원"} contentStyle={{ background: SURFACE_2, border: `1px solid ${BORDER}`, borderRadius: 8 }} />
                <Bar dataKey="amt" fill={VIOLET} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= 카드관리 ================= */
function CardPage({ cards, setCards, accounts, setAccounts, transactions }) {
  const [cardForm, setCardForm] = useState({ name: "", cardType: "credit", billingDay: 15, accountId: accounts[0]?.id || "" });
  const [accForm, setAccForm] = useState({ name: "", bank: "" });

  const addCard = () => {
    if (!cardForm.name.trim()) return;
    setCards((c) => [...c, {
      id: uid(), name: cardForm.name.trim(), cardType: cardForm.cardType,
      billingDay: cardForm.cardType === "credit" ? Number(cardForm.billingDay) : null,
      accountId: cardForm.accountId || null,
    }]);
    setCardForm({ name: "", cardType: "credit", billingDay: 15, accountId: accounts[0]?.id || "" });
  };
  const removeCard = (id) => setCards((c) => c.filter((x) => x.id !== id));

  const addAccount = () => {
    if (!accForm.name.trim()) return;
    setAccounts((a) => [...a, { id: uid(), name: accForm.name.trim(), bank: accForm.bank.trim() }]);
    setAccForm({ name: "", bank: "" });
  };
  const removeAccount = (id) => setAccounts((a) => a.filter((x) => x.id !== id));

  return (
    <div>
      <PageTitle>카드 · 계좌 관리</PageTitle>

      <SectionLabel>등록된 카드</SectionLabel>
      <div className="bento" style={{ marginBottom: 18 }}>
        {cards.length === 0 && <Card><span style={{ color: TEXT_DIM, fontSize: 13 }}>등록된 카드가 없어요.</span></Card>}
        {cards.map((c) => {
          const isCredit = c.cardType !== "debit";
          const acc = accounts.find((a) => a.id === c.accountId);
          const { nextBilling, lastBilling, spend } = isCredit ? cardCycle(c, transactions) : { spend: debitMonthSpend(c, transactions) };
          const cycleTx = transactions
            .filter((t) => t.cardId === c.id && t.type === "expense" && (!isCredit || new Date(t.date) > lastBilling))
            .sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
          return (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isCredit ? VIOLET : MINT, background: isCredit ? VIOLET_SOFT : "rgba(61,220,151,0.15)", borderRadius: 6, padding: "1px 6px" }}>{isCredit ? "신용" : "체크"}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: TEXT_DIM, marginTop: 2 }}>
                    {isCredit ? `매월 ${c.billingDay}일 결제` : "즉시 출금"} · {acc ? acc.name : "연결 계좌 없음"}
                  </div>
                </div>
                <button onClick={() => removeCard(c.id)} style={iconBtn}><Trash2 size={14} /></button>
              </div>
              <div className="tnum" style={{ fontSize: 22, fontWeight: 700, color: CORAL, marginBottom: 4 }}>{won(spend)}원</div>
              <div style={{ fontSize: 11.5, color: TEXT_FAINT, marginBottom: 10 }}>
                {isCredit ? `${nextBilling.getMonth() + 1}월 ${nextBilling.getDate()}일 청구 예정` : "이번 달 사용액"}
              </div>
              {cycleTx.length > 0 && (
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
                  {cycleTx.map((t) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: TEXT_DIM }}>
                      <span>{t.date.slice(5)} {t.desc || t.sub}</span>
                      <span className="tnum">{won(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <SectionLabel>카드 추가</SectionLabel>
      <Card style={{ marginBottom: 26 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1.3fr auto", gap: 8, alignItems: "center" }}>
          <input placeholder="카드 이름" value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} style={inputStyle} />
          <select value={cardForm.cardType} onChange={(e) => setCardForm({ ...cardForm, cardType: e.target.value })} style={inputStyle}>
            <option value="credit">신용카드</option>
            <option value="debit">체크카드</option>
          </select>
          {cardForm.cardType === "credit" ? (
            <input type="number" min={1} max={28} placeholder="결제일" value={cardForm.billingDay} onChange={(e) => setCardForm({ ...cardForm, billingDay: e.target.value })} style={inputStyle} />
          ) : <div />}
          <select value={cardForm.accountId} onChange={(e) => setCardForm({ ...cardForm, accountId: e.target.value })} style={inputStyle}>
            <option value="">연결 계좌 선택</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>)}
          </select>
          <button onClick={addCard} style={primaryBtn}><Plus size={14} /> 추가</button>
        </div>
      </Card>

      <SectionLabel>등록된 계좌</SectionLabel>
      <div className="bento" style={{ marginBottom: 18 }}>
        {accounts.length === 0 && <Card><span style={{ color: TEXT_DIM, fontSize: 13 }}>등록된 계좌가 없어요.</span></Card>}
        {accounts.map((a) => (
          <Card key={a.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                <div style={{ fontSize: 11.5, color: TEXT_DIM }}>{a.bank}</div>
              </div>
              <button onClick={() => removeAccount(a.id)} style={iconBtn}><Trash2 size={14} /></button>
            </div>
          </Card>
        ))}
      </div>

      <SectionLabel>계좌 추가</SectionLabel>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <input placeholder="계좌 이름 (예: 생활비통장)" value={accForm.name} onChange={(e) => setAccForm({ ...accForm, name: e.target.value })} style={inputStyle} />
          <input placeholder="은행" value={accForm.bank} onChange={(e) => setAccForm({ ...accForm, bank: e.target.value })} style={inputStyle} />
          <button onClick={addAccount} style={primaryBtn}><Plus size={14} /> 추가</button>
        </div>
      </Card>
    </div>
  );
}

/* ================= 저축 ================= */
function SavingPage({ categories, transactions, addTx, goals, setGoals }) {
  const savingCats = categories.filter((c) => c.type === "saving");
  const allSavingTx = transactions.filter((t) => t.type === "saving");
  const totalSaving = allSavingTx.reduce((a, t) => a + Number(t.amount), 0);

  const [goalForm, setGoalForm] = useState({ name: "", target: "" });
  const [txForm, setTxForm] = useState({ date: todayStr(), main: savingCats[0]?.main || "", sub: savingCats[0]?.subs[0] || "", amount: "" });

  const addGoal = () => {
    if (!goalForm.name.trim()) return;
    setGoals((g) => [...g, { id: uid(), name: goalForm.name.trim(), target: Number(goalForm.target || 0) }]);
    setGoalForm({ name: "", target: "" });
  };
  const removeGoal = (id) => setGoals((g) => g.filter((x) => x.id !== id));
  const submitTx = () => {
    if (!txForm.amount) return;
    addTx({ ...txForm, type: "saving", desc: "", payment: "-", amount: Number(txForm.amount) });
    setTxForm((f) => ({ ...f, amount: "" }));
  };

  return (
    <div>
      <PageTitle>저축</PageTitle>
      <Stat label="누적 저축 총액" value={won(totalSaving)} suffix="원" tone="gold" big />

      <SectionLabel>저축 목표</SectionLabel>
      <div className="bento" style={{ marginBottom: 6 }}>
        {goals.map((g) => (
          <Card key={g.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>{g.name}</span>
              <button onClick={() => removeGoal(g.id)} style={iconBtn}><Trash2 size={14} /></button>
            </div>
            <div style={{ height: 6, background: SURFACE_2, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${Math.min(100, (totalSaving / (g.target || 1)) * 100)}%`, background: `linear-gradient(90deg, ${MINT}, ${VIOLET})` }} />
            </div>
            <div className="tnum" style={{ fontSize: 12, color: TEXT_DIM }}>목표 {won(g.target)}원</div>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 26 }}>
        <input placeholder="목표 이름" value={goalForm.name} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} style={inputStyle} />
        <input placeholder="목표 금액" type="number" value={goalForm.target} onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })} style={inputStyle} />
        <button onClick={addGoal} style={primaryBtn}><Plus size={14} /> 추가</button>
      </div>

      <SectionLabel>저축 입력</SectionLabel>
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 14 }}>
          <input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} style={inputStyle} />
          <select value={txForm.main} onChange={(e) => setTxForm({ ...txForm, main: e.target.value, sub: categories.find((c) => c.main === e.target.value)?.subs[0] || "" })} style={inputStyle}>
            {savingCats.map((c) => <option key={c.main} value={c.main}>{c.main}</option>)}
          </select>
          <select value={txForm.sub} onChange={(e) => setTxForm({ ...txForm, sub: e.target.value })} style={inputStyle}>
            {(categories.find((c) => c.main === txForm.main)?.subs || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="금액" type="number" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} style={inputStyle} />
          <button onClick={submitTx} style={primaryBtn}><Plus size={14} /> 추가</button>
        </div>
        <table>
          <tbody>
            {[...allSavingTx].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8).map((t) => (
              <tr key={t.id} style={{ borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
                <td className="tnum" style={{ padding: "7px 4px" }}>{t.date}</td>
                <td>{t.main} · {t.sub}</td>
                <td className="tnum" style={{ textAlign: "right", color: GOLD }}>{won(t.amount)}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ================= 자산 ================= */
function AssetPage({ assets, setAssets }) {
  const groups = ["예금/현금", "투자", "부동산", "연금", "부채", "기타"];
  const [form, setForm] = useState({ name: "", group: groups[0], amount: "", isLiability: false });

  const addAsset = () => {
    if (!form.name.trim() || !form.amount) return;
    setAssets((a) => [...a, { id: uid(), ...form, amount: Number(form.amount) }]);
    setForm({ name: "", group: groups[0], amount: "", isLiability: false });
  };
  const removeAsset = (id) => setAssets((a) => a.filter((x) => x.id !== id));

  const netWorth = assets.reduce((a, x) => a + (x.isLiability ? -x.amount : x.amount), 0);

  return (
    <div>
      <PageTitle>자산</PageTitle>
      <Stat label="순자산" value={won(netWorth)} suffix="원" tone={netWorth >= 0 ? "mint" : "coral"} big />

      <SectionLabel>자산/부채 항목</SectionLabel>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr auto auto", gap: 8, alignItems: "center" }}>
          <input placeholder="항목명 (예: 청약통장)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} style={inputStyle}>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input placeholder="금액" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} />
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: TEXT_DIM, whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={form.isLiability} onChange={(e) => setForm({ ...form, isLiability: e.target.checked })} /> 부채
          </label>
          <button onClick={addAsset} style={primaryBtn}><Plus size={14} /> 추가</button>
        </div>
      </Card>

      <div className="bento">
        {groups.map((g) => {
          const items = assets.filter((a) => a.group === g);
          if (items.length === 0) return null;
          const sum = items.reduce((a, x) => a + (x.isLiability ? -x.amount : x.amount), 0);
          return (
            <Card key={g}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{g}</span>
                <span className="tnum" style={{ fontSize: 13.5, color: sum >= 0 ? TEXT : CORAL }}>{won(sum)}원</span>
              </div>
              {items.map((it) => (
                <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: TEXT_DIM, marginBottom: 5 }}>
                  <span>{it.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="tnum" style={{ color: it.isLiability ? CORAL : TEXT }}>{it.isLiability ? "-" : ""}{won(it.amount)}</span>
                    <button onClick={() => removeAsset(it.id)} style={iconBtn}><Trash2 size={12} /></button>
                  </span>
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ================= 설정 ================= */
function SettingsPage({ categories, setCategories, otherPayments, setOtherPayments }) {
  const [newMain, setNewMain] = useState("");
  const [newType, setNewType] = useState("expense");
  const [subInputs, setSubInputs] = useState({});
  const [newPay, setNewPay] = useState("");

  const addMain = () => {
    if (!newMain.trim()) return;
    setCategories((c) => [...c, { main: newMain.trim(), type: newType, subs: [] }]);
    setNewMain("");
  };
  const addSub = (main) => {
    const v = (subInputs[main] || "").trim();
    if (!v) return;
    setCategories((c) => c.map((cat) => (cat.main === main ? { ...cat, subs: [...cat.subs, v] } : cat)));
    setSubInputs((s) => ({ ...s, [main]: "" }));
  };
  const removeSub = (main, sub) => setCategories((c) => c.map((cat) => (cat.main === main ? { ...cat, subs: cat.subs.filter((s) => s !== sub) } : cat)));
  const removeMain = (main) => setCategories((c) => c.filter((cat) => cat.main !== main));

  return (
    <div>
      <PageTitle>설정</PageTitle>

      <SectionLabel>카테고리 관리</SectionLabel>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input placeholder="새 대분류" value={newMain} onChange={(e) => setNewMain(e.target.value)} style={inputStyle} />
        <select value={newType} onChange={(e) => setNewType(e.target.value)} style={inputStyle}>
          <option value="income">수입</option><option value="saving">저축</option><option value="expense">지출</option>
        </select>
        <button onClick={addMain} style={primaryBtn}><Plus size={14} /> 추가</button>
      </div>
      <div className="bento" style={{ marginBottom: 24 }}>
        {categories.map((c) => (
          <Card key={c.main}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{c.main} <span style={{ fontSize: 10.5, color: TEXT_FAINT }}>· {c.type}</span></span>
              <button onClick={() => removeMain(c.main)} style={iconBtn}><Trash2 size={13} /></button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
              {c.subs.map((s) => (
                <span key={s} style={{ background: SURFACE_2, borderRadius: 10, padding: "3px 9px", fontSize: 11.5, display: "flex", alignItems: "center", gap: 4, color: TEXT_DIM }}>
                  {s} <Trash2 size={10} style={{ cursor: "pointer" }} onClick={() => removeSub(c.main, s)} />
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input placeholder="소분류 추가" value={subInputs[c.main] || ""} onChange={(e) => setSubInputs((s) => ({ ...s, [c.main]: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addSub(c.main)} style={{ ...inputStyle, fontSize: 12 }} />
              <button onClick={() => addSub(c.main)} style={{ ...primaryBtn, padding: "6px 10px" }}><Plus size={12} /></button>
            </div>
          </Card>
        ))}
      </div>

      <SectionLabel>기타 결제수단 (카드 외)</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {otherPayments.map((p) => (
          <span key={p} style={{ background: SURFACE_2, borderRadius: 12, padding: "5px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
            {p} <Trash2 size={12} style={{ cursor: "pointer" }} onClick={() => setOtherPayments(otherPayments.filter((x) => x !== p))} />
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="새 결제수단" value={newPay} onChange={(e) => setNewPay(e.target.value)} style={inputStyle} />
        <button onClick={() => { if (newPay.trim()) { setOtherPayments([...otherPayments, newPay.trim()]); setNewPay(""); } }} style={primaryBtn}><Plus size={14} /> 추가</button>
      </div>
      <p style={{ fontSize: 12, color: TEXT_FAINT, marginTop: 20 }}>신용/체크카드는 결제일 관리가 필요해서 <b>카드관리</b> 메뉴에서 따로 추가해요.</p>
    </div>
  );
}
