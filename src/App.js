import { useState, useEffect } from "react";

// ── 색상 ──────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F7FA", surface: "#FFFFFF", ink: "#111827", muted: "#6B7280",
  border: "#E5E7EB", primary: "#2563EB", primaryLight: "#EFF6FF",
  green: "#059669", greenLight: "#ECFDF5", red: "#DC2626", redLight: "#FEF2F2",
  yellow: "#D97706", yellowLight: "#FFFBEB", purple: "#7C3AED", purpleLight: "#F5F3FF",
  orange: "#EA580C", orangeLight: "#FFF7ED",
};

// ── 반응형 ────────────────────────────────────────────────────────────
const useWindowWidth = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
};
const mob = (w) => w < 768;
const tab = (w) => w >= 768 && w < 1024;

// ── 스타일 ────────────────────────────────────────────────────────────
const S = {
  input: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: C.ink, backgroundColor: C.surface, outline: "none", fontFamily: "inherit" },
  select: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: C.ink, backgroundColor: C.surface, outline: "none", fontFamily: "inherit", cursor: "pointer" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 },
  btn: { backgroundColor: C.primary, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnGhost: { backgroundColor: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  btnSm: (color = C.red) => ({ backgroundColor: color, color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }),
  card: { backgroundColor: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px" },
};

// ── 헬퍼 ──────────────────────────────────────────────────────────────
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const todayStr = () => new Date().toISOString().split("T")[0];
const daysLeft = (d) => { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); };
const fmt = (d) => { if (!d) return "-"; const dt = new Date(d); return `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,"0")}.${String(dt.getDate()).padStart(2,"0")}`; };
// 🤖 자동화: 입사일 기준 연차 자동 계산
const calcLeave = (joinDate) => {
  if (!joinDate) return 15;
  const months = Math.floor((new Date() - new Date(joinDate)) / (1000 * 60 * 60 * 24 * 30));
  if (months < 12) return Math.min(months, 11);
  const years = Math.floor(months / 12);
  return Math.min(15 + Math.floor((years - 1) / 2), 25);
};
// 🤖 자동화: 수습 종료일 자동 계산 (입사일 + 3개월)
const calcProbation = (joinDate) => {
  if (!joinDate) return "";
  const d = new Date(joinDate);
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().split("T")[0];
};

const Badge = ({ text, color = C.primary, bg = C.primaryLight }) => (
  <span style={{ backgroundColor: bg, color, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{text}</span>
);

const FormField = ({ label, children }) => (
  <div><label style={S.label}>{label}</label>{children}</div>
);

const Grid = ({ cols, mobCols = 1, w, children, gap = 12 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${mob(w) ? mobCols : cols}, 1fr)`, gap, marginBottom: gap }}>
    {children}
  </div>
);

// ════════════════════════════════════════════════════════════════════
//  대시보드 — 자동화 알림 + 통계 + 이번달 일정
// ════════════════════════════════════════════════════════════════════
function Dashboard({ employees, todos, candidates, attendances, events, w }) {
  const isMob = mob(w);

  // 🤖 자동화: 모든 알림 자동 생성
  const alerts = [];
  employees.forEach(e => {
    const pd = daysLeft(e.probationEnd);
    const cd = daysLeft(e.contractEnd);
    if (pd !== null && pd <= 30 && pd >= 0) alerts.push({ level: pd <= 7 ? "긴급" : "주의", type: "수습종료", name: e.name, days: pd, color: C.yellow, bg: C.yellowLight });
    if (cd !== null && cd <= 30 && cd >= 0) alerts.push({ level: cd <= 7 ? "긴급" : "주의", type: "계약만료", name: e.name, days: cd, color: C.red, bg: C.redLight });
    const lr = (e.leaveTotal || 15) - (e.leaveUsed || 0);
    if (lr <= 3) alerts.push({ level: "주의", type: "연차부족", name: e.name, days: null, color: C.purple, bg: C.purpleLight, extra: `잔여 ${lr}일` });
  });
  // 🤖 자동화: 마감 임박 Todo 자동 알림
  todos.filter(t => !t.done && t.dueDate && daysLeft(t.dueDate) <= 1).forEach(t => {
    alerts.push({ level: "긴급", type: "업무마감", name: t.text, days: daysLeft(t.dueDate), color: C.orange, bg: C.orangeLight });
  });

  alerts.sort((a, b) => (a.level === "긴급" ? -1 : 1));

  // 🤖 자동화: 이번달 입퇴사 자동 집계
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newJoins = employees.filter(e => e.joinDate && e.joinDate.startsWith(thisMonth)).length;
  const hiringActive = candidates.filter(c => c.status !== "불합격" && c.status !== "최종합격").length;

  // 🤖 자동화: 이번달 급여 체크리스트 자동 생성
  const payrollChecks = [
    { text: "급여 명세서 발송", done: false },
    { text: "4대보험 납부 확인", done: false },
    { text: "퇴직금 정산 (해당자)", done: false },
    { text: "연장근무수당 계산", done: false },
  ];

  const stats = [
    { label: "전체 직원", value: employees.length, sub: `이번달 입사 ${newJoins}명`, color: C.primary, bg: C.primaryLight, icon: "👥" },
    { label: "진행 중 채용", value: hiringActive, sub: `전체 ${candidates.length}명`, color: C.green, bg: C.greenLight, icon: "📋" },
    { label: "미완료 Todo", value: todos.filter(t => !t.done).length, sub: `전체 ${todos.length}건`, color: C.yellow, bg: C.yellowLight, icon: "✅" },
    { label: "긴급 알림", value: alerts.filter(a => a.level === "긴급").length, sub: `전체 ${alerts.length}건`, color: C.red, bg: C.redLight, icon: "🚨" },
  ];

  // 이번달 주요 일정
  const thisMonthEvents = events.filter(e => e.date && e.date.startsWith(thisMonth)).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: isMob ? 20 : 24, fontWeight: 800 }}>대시보드</h2>
        <div style={{ fontSize: 13, color: C.muted }}>{fmt(todayStr())} 기준 자동 업데이트</div>
      </div>

      {/* 통계 */}
      <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: 12, padding: isMob ? "14px 12px" : "20px", border: "none" }}>
            <div style={{ fontSize: isMob ? 22 : 26, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: isMob ? 26 : 30, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* 🚨 긴급 알림 */}
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>🚨 알림센터</span>
            <Badge text={`${alerts.length}건`} color={alerts.length > 0 ? C.red : C.green} bg={alerts.length > 0 ? C.redLight : C.greenLight} />
          </div>
          {alerts.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>모든 업무 정상 ✅</div>
          ) : alerts.map((a, i) => (
            <div key={i} style={{ backgroundColor: a.bg, borderRadius: 8, padding: "10px 12px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Badge text={a.level} color={a.level === "긴급" ? C.red : C.yellow} bg="rgba(0,0,0,0.06)" />
                <Badge text={a.type} color={a.color} bg="transparent" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                {a.extra && <span style={{ fontSize: 12, color: a.color }}>{a.extra}</span>}
              </div>
              {a.days !== null && <span style={{ fontSize: 12, fontWeight: 800, color: a.color }}>{a.days <= 0 ? "오늘!" : `D-${a.days}`}</span>}
            </div>
          ))}
        </div>

        {/* 이번달 일정 */}
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>📅 이번달 주요 일정</div>
          {thisMonthEvents.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>등록된 일정이 없습니다</div>
          ) : thisMonthEvents.map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ backgroundColor: C.primaryLight, borderRadius: 6, padding: "4px 8px", textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>{e.date.slice(8)}</div>
                <div style={{ fontSize: 10, color: C.muted }}>일</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                {e.desc && <div style={{ fontSize: 11, color: C.muted }}>{e.desc}</div>}
              </div>
              <Badge text={e.category} color={C.primary} bg={C.primaryLight} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "1fr 1fr", gap: 16 }}>
        {/* 미완료 Todo */}
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>✅ 긴급 업무</div>
          {todos.filter(t => !t.done && t.priority === "높음").length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>긴급 업무 없음 🎉</div>
          ) : todos.filter(t => !t.done && t.priority === "높음").slice(0, 5).map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
              <Badge text={t.category} color={C.primary} bg={C.primaryLight} />
              <span style={{ fontSize: 13, flex: 1, minWidth: 80 }}>{t.text}</span>
              {t.dueDate && <span style={{ fontSize: 11, color: daysLeft(t.dueDate) <= 1 ? C.red : C.muted, fontWeight: 600 }}>{fmt(t.dueDate)}</span>}
            </div>
          ))}
        </div>

        {/* 🤖 자동화: 이번달 급여 체크리스트 */}
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>💰 이번달 급여 업무</div>
          {payrollChecks.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${C.border}`, flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{p.text}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>🤖 매월 자동 생성</div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  직원 관리 — 자동화 강화
// ════════════════════════════════════════════════════════════════════
function EmployeeManager({ employees, setEmployees, w }) {
  const isMob = mob(w);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("전체");
  const initForm = { name: "", dept: "", position: "", joinDate: "", employType: "정규직", probationEnd: "", contractEnd: "", leaveTotal: 15, leaveUsed: 0, phone: "", email: "", birthday: "", note: "" };
  const [form, setForm] = useState(initForm);
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));

  // 🤖 자동화: 입사일 입력 시 수습종료일 + 연차 자동 계산
  const handleJoinDate = (v) => {
    setF("joinDate", v);
    if (v) {
      setF("probationEnd", calcProbation(v));
      setF("leaveTotal", calcLeave(v));
    }
  };

  const depts = ["전체", ...new Set(employees.map(e => e.dept).filter(Boolean))];

  const add = () => {
    if (!form.name) return;
    const lr = form.leaveTotal - form.leaveUsed;
    const u = [...employees, { ...form, id: Date.now(), leaveRemain: lr, history: [{ date: todayStr(), action: "입사 등록" }] }];
    setEmployees(u); save("hr-employees", u);
    setForm(initForm); setAdding(false);
  };

  const remove = (id) => { const u = employees.filter(e => e.id !== id); setEmployees(u); save("hr-employees", u); if (selected === id) setSelected(null); };

  const filtered = employees.filter(e => {
    const matchSearch = (e.name.includes(search) || (e.dept || "").includes(search) || (e.position || "").includes(search));
    const matchDept = (filterDept === "전체" || e.dept === filterDept);
    return matchSearch && matchDept;
  });

  const sel = employees.find(e => e.id === selected);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: isMob ? 20 : 24, fontWeight: 800 }}>직원 관리 <span style={{ fontSize: 14, color: C.muted, fontWeight: 400 }}>총 {employees.length}명</span></h2>
        <button style={S.btn} onClick={() => setAdding(!adding)}>+ 직원 추가</button>
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.primaryLight, border: `1.5px solid ${C.primary}` }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>새 직원 등록</div>
          <Grid cols={3} w={w}>
            <FormField label="이름 *"><input style={S.input} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="홍길동" /></FormField>
            <FormField label="부서"><input style={S.input} value={form.dept} onChange={e => setF("dept", e.target.value)} placeholder="인사팀" /></FormField>
            <FormField label="직급/직책"><input style={S.input} value={form.position} onChange={e => setF("position", e.target.value)} placeholder="대리" /></FormField>
          </Grid>
          <Grid cols={3} w={w}>
            <FormField label="입사일 🤖 (입력 시 수습/연차 자동계산)">
              <input type="date" style={S.input} value={form.joinDate} onChange={e => handleJoinDate(e.target.value)} />
            </FormField>
            <FormField label="고용형태">
              <select style={S.select} value={form.employType} onChange={e => setF("employType", e.target.value)}>
                {["정규직","계약직","인턴","파견직","프리랜서"].map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="수습 종료일 🤖 (자동계산됨)">
              <input type="date" style={S.input} value={form.probationEnd} onChange={e => setF("probationEnd", e.target.value)} />
            </FormField>
          </Grid>
          <Grid cols={3} w={w}>
            <FormField label="계약 만료일">
              <input type="date" style={S.input} value={form.contractEnd} onChange={e => setF("contractEnd", e.target.value)} />
            </FormField>
            <FormField label="연차 총일수 🤖 (자동계산됨)">
              <input type="number" style={S.input} value={form.leaveTotal} onChange={e => setF("leaveTotal", Number(e.target.value))} />
            </FormField>
            <FormField label="사용 연차">
              <input type="number" style={S.input} value={form.leaveUsed} onChange={e => setF("leaveUsed", Number(e.target.value))} />
            </FormField>
          </Grid>
          <Grid cols={3} w={w}>
            <FormField label="연락처"><input style={S.input} value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="010-0000-0000" /></FormField>
            <FormField label="이메일"><input style={S.input} value={form.email} onChange={e => setF("email", e.target.value)} placeholder="이메일" /></FormField>
            <FormField label="생년월일"><input type="date" style={S.input} value={form.birthday} onChange={e => setF("birthday", e.target.value)} /></FormField>
          </Grid>
          <FormField label="특이사항/메모"><input style={S.input} value={form.note} onChange={e => setF("note", e.target.value)} placeholder="메모" /></FormField>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}><button style={S.btn} onClick={add}>저장</button><button style={S.btnGhost} onClick={() => setAdding(false)}>취소</button></div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input style={{ ...S.input, flex: 1, minWidth: 160 }} placeholder="이름/부서/직급 검색" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...S.select, width: "auto" }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : sel ? "1fr 320px" : "1fr", gap: 16 }}>
        {/* 목록 */}
        <div>
          {isMob ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(e => {
                const lr = (e.leaveTotal || 15) - (e.leaveUsed || 0);
                const pd = daysLeft(e.probationEnd);
                const cd = daysLeft(e.contractEnd);
                return (
                  <div key={e.id} style={{ ...S.card, cursor: "pointer", border: `1.5px solid ${selected === e.id ? C.primary : C.border}` }} onClick={() => setSelected(selected === e.id ? null : e.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{e.name}</span>
                        <span style={{ color: C.muted, fontSize: 13, marginLeft: 8 }}>{e.dept} · {e.position}</span>
                      </div>
                      <Badge text={e.employType} color={e.employType === "정규직" ? C.green : C.yellow} bg={e.employType === "정규직" ? C.greenLight : C.yellowLight} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 12 }}>
                      <div><span style={{ color: C.muted }}>입사: </span>{fmt(e.joinDate)}</div>
                      <div><span style={{ color: C.muted }}>연차: </span><span style={{ color: lr <= 3 ? C.red : C.green, fontWeight: 700 }}>{lr}일</span>/{e.leaveTotal}일</div>
                      {e.probationEnd && pd !== null && pd >= 0 && <div style={{ color: C.yellow, fontWeight: 600 }}>수습 D-{pd}</div>}
                      {e.contractEnd && cd !== null && cd >= 0 && cd <= 30 && <div style={{ color: C.red, fontWeight: 600 }}>계약 D-{cd}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ ...S.card, padding: 0, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 680 }}>
                <thead>
                  <tr style={{ backgroundColor: C.bg }}>
                    {["이름","부서","직급","고용형태","입사일","수습 D-day","계약 D-day","잔여연차","연락처",""].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap", fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: C.muted }}>등록된 직원이 없습니다</td></tr>
                  : filtered.map(e => {
                    const lr = (e.leaveTotal || 15) - (e.leaveUsed || 0);
                    const pd = daysLeft(e.probationEnd);
                    const cd = daysLeft(e.contractEnd);
                    return (
                      <tr key={e.id} onClick={() => setSelected(selected === e.id ? null : e.id)} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", backgroundColor: selected === e.id ? C.primaryLight : "transparent" }}>
                        <td style={{ padding: "11px 12px", fontWeight: 600 }}>{e.name}</td>
                        <td style={{ padding: "11px 12px", color: C.muted }}>{e.dept || "-"}</td>
                        <td style={{ padding: "11px 12px", color: C.muted }}>{e.position || "-"}</td>
                        <td style={{ padding: "11px 12px" }}><Badge text={e.employType} color={e.employType === "정규직" ? C.green : C.yellow} bg={e.employType === "정규직" ? C.greenLight : C.yellowLight} /></td>
                        <td style={{ padding: "11px 12px", color: C.muted, whiteSpace: "nowrap" }}>{fmt(e.joinDate)}</td>
                        <td style={{ padding: "11px 12px" }}>{e.probationEnd ? <span style={{ color: pd !== null && pd <= 7 ? C.red : pd !== null && pd <= 30 ? C.yellow : C.muted, fontWeight: 600 }}>{pd !== null && pd >= 0 ? `D-${pd}` : "완료"}</span> : "-"}</td>
                        <td style={{ padding: "11px 12px" }}>{e.contractEnd ? <span style={{ color: cd !== null && cd <= 30 ? C.red : C.muted, fontWeight: cd !== null && cd <= 30 ? 700 : 400 }}>{cd !== null && cd >= 0 ? `D-${cd}` : "만료"}</span> : "-"}</td>
                        <td style={{ padding: "11px 12px" }}><span style={{ color: lr <= 3 ? C.red : C.green, fontWeight: 700 }}>{lr}</span><span style={{ color: C.muted, fontSize: 11 }}>/{e.leaveTotal}</span></td>
                        <td style={{ padding: "11px 12px", color: C.muted }}>{e.phone || "-"}</td>
                        <td style={{ padding: "11px 12px" }}><button style={S.btnSm()} onClick={ev => { ev.stopPropagation(); remove(e.id); }}>삭제</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 직원 상세 패널 */}
        {sel && (
          <div style={S.card}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{sel.name}</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{sel.dept} · {sel.position}</div>
            {[["연락처", sel.phone], ["이메일", sel.email], ["생년월일", fmt(sel.birthday)], ["입사일", fmt(sel.joinDate)], ["고용형태", sel.employType], ["수습종료", `${fmt(sel.probationEnd)} (D-${daysLeft(sel.probationEnd) ?? "-"})`], ["계약만료", sel.contractEnd ? `${fmt(sel.contractEnd)} (D-${daysLeft(sel.contractEnd) ?? "-"})` : "-"], ["연차현황", `잔여 ${(sel.leaveTotal||15)-(sel.leaveUsed||0)}일 / 총 ${sel.leaveTotal}일`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                <span style={{ color: C.muted, width: 70, flexShrink: 0 }}>{l}</span>
                <span style={{ fontWeight: 500 }}>{v || "-"}</span>
              </div>
            ))}
            {sel.note && <div style={{ marginTop: 12, fontSize: 13, color: C.muted, backgroundColor: C.bg, borderRadius: 8, padding: 12 }}>{sel.note}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  채용 관리
// ════════════════════════════════════════════════════════════════════
function RecruitManager({ candidates, setCandidates, w }) {
  const isMob = mob(w);
  const [adding, setAdding] = useState(false);
  const [filterStage, setFilterStage] = useState("전체");
  const initForm = { name: "", position: "", appliedDate: todayStr(), status: "서류검토", phone: "", email: "", source: "채용사이트", note: "" };
  const [form, setForm] = useState(initForm);
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const stages = ["서류검토","전화스크리닝","1차면접","2차면접","처우협의","최종합격","불합격"];
  const sources = ["채용사이트","헤드헌팅","내부추천","링크드인","워크넷","기타"];
  const sc = (s) => s === "최종합격" ? { color: C.green, bg: C.greenLight } : s === "불합격" ? { color: C.red, bg: C.redLight } : s === "처우협의" ? { color: C.purple, bg: C.purpleLight } : s === "2차면접" || s === "1차면접" ? { color: C.orange, bg: C.orangeLight } : { color: C.primary, bg: C.primaryLight };

  const add = () => {
    if (!form.name || !form.position) return;
    // 🤖 자동화: 등록 시 날짜 자동 기록
    const u = [...candidates, { ...form, id: Date.now(), history: [{ date: todayStr(), action: "지원 접수" }] }];
    setCandidates(u); save("hr-candidates", u);
    setForm(initForm); setAdding(false);
  };

  // 🤖 자동화: 단계 변경 시 날짜 자동 기록
  const updateStatus = (id, status) => {
    const u = candidates.map(c => c.id === id ? {
      ...c, status,
      history: [...(c.history || []), { date: todayStr(), action: `${status} 단계로 변경` }]
    } : c);
    setCandidates(u); save("hr-candidates", u);
  };
  const remove = (id) => { const u = candidates.filter(c => c.id !== id); setCandidates(u); save("hr-candidates", u); };

  const filtered = filterStage === "전체" ? candidates : candidates.filter(c => c.status === filterStage);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: isMob ? 20 : 24, fontWeight: 800 }}>채용 관리</h2>
        <button style={S.btn} onClick={() => setAdding(!adding)}>+ 지원자 추가</button>
      </div>

      {/* 🤖 자동화: 단계별 현황 자동 집계 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {["전체", ...stages].map(s => {
          const count = s === "전체" ? candidates.length : candidates.filter(c => c.status === s).length;
          const color = s === "전체" ? { color: C.ink, bg: C.bg } : sc(s);
          return (
            <div key={s} onClick={() => setFilterStage(s)} style={{ flexShrink: 0, backgroundColor: filterStage === s ? color.bg : C.bg, borderRadius: 8, padding: "10px 14px", textAlign: "center", minWidth: 68, cursor: "pointer", border: `1.5px solid ${filterStage === s ? color.color : C.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: color.color }}>{count}</div>
              <div style={{ fontSize: 10, color: color.color, fontWeight: 600 }}>{s}</div>
            </div>
          );
        })}
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.primaryLight, border: `1.5px solid ${C.primary}` }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>지원자 추가</div>
          <Grid cols={3} w={w}>
            <FormField label="이름 *"><input style={S.input} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="홍길동" /></FormField>
            <FormField label="지원 포지션 *"><input style={S.input} value={form.position} onChange={e => setF("position", e.target.value)} placeholder="프론트엔드 개발자" /></FormField>
            <FormField label="연락처"><input style={S.input} value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="010-0000-0000" /></FormField>
          </Grid>
          <Grid cols={3} w={w}>
            <FormField label="이메일"><input style={S.input} value={form.email} onChange={e => setF("email", e.target.value)} /></FormField>
            <FormField label="지원 경로">
              <select style={S.select} value={form.source} onChange={e => setF("source", e.target.value)}>
                {sources.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="현재 단계">
              <select style={S.select} value={form.status} onChange={e => setF("status", e.target.value)}>
                {stages.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
          </Grid>
          <FormField label="메모/특이사항"><input style={S.input} value={form.note} onChange={e => setF("note", e.target.value)} placeholder="면접 가능 일정, 현재 연봉 등" /></FormField>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}><button style={S.btn} onClick={add}>저장</button><button style={S.btnGhost} onClick={() => setAdding(false)}>취소</button></div>
        </div>
      )}

      {isMob ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(c => {
            const color = sc(c.status);
            return (
              <div key={c.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div><div style={{ fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 12, color: C.muted }}>{c.position}</div></div>
                  <button style={S.btnSm()} onClick={() => remove(c.id)}>삭제</button>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)} style={{ backgroundColor: color.bg, color: color.color, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {stages.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <Badge text={c.source || "채용사이트"} color={C.muted} bg={C.bg} />
                  <span style={{ fontSize: 11, color: C.muted }}>{fmt(c.appliedDate)}</span>
                </div>
                {c.note && <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>{c.note}</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 620 }}>
            <thead>
              <tr style={{ backgroundColor: C.bg }}>
                {["이름","포지션","연락처","지원경로","지원일","진행단계","메모",""].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: C.muted }}>지원자가 없습니다</td></tr>
              : filtered.map(c => {
                const color = sc(c.status);
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "11px 12px", fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: "11px 12px", color: C.muted }}>{c.position}</td>
                    <td style={{ padding: "11px 12px", color: C.muted }}>{c.phone || "-"}</td>
                    <td style={{ padding: "11px 12px" }}><Badge text={c.source || "채용사이트"} color={C.muted} bg={C.bg} /></td>
                    <td style={{ padding: "11px 12px", color: C.muted, whiteSpace: "nowrap" }}>{fmt(c.appliedDate)}</td>
                    <td style={{ padding: "11px 12px" }}>
                      <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)} style={{ backgroundColor: color.bg, color: color.color, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {stages.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "11px 12px", color: C.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.note || "-"}</td>
                    <td style={{ padding: "11px 12px" }}><button style={S.btnSm()} onClick={() => remove(c.id)}>삭제</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  근태 관리 — 신규
// ════════════════════════════════════════════════════════════════════
function AttendanceManager({ employees, attendances, setAttendances, w }) {
  const isMob = mob(w);
  const [form, setForm] = useState({ employeeId: "", type: "연차", startDate: todayStr(), endDate: todayStr(), reason: "" });
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const types = ["연차","반차(오전)","반차(오후)","병가","경조휴가","공가","출장","재택근무","외출"];
  const typeColor = (t) => t.includes("연차") || t.includes("반차") ? { color: C.primary, bg: C.primaryLight } : t === "병가" ? { color: C.red, bg: C.redLight } : t === "경조휴가" ? { color: C.purple, bg: C.purpleLight } : { color: C.green, bg: C.greenLight };

  const add = () => {
    if (!form.employeeId) return;
    const emp = employees.find(e => e.id === Number(form.employeeId));
    const u = [...attendances, { ...form, id: Date.now(), employeeName: emp?.name || "" }];
    setAttendances(u); save("hr-attendances", u);
    setForm({ employeeId: "", type: "연차", startDate: todayStr(), endDate: todayStr(), reason: "" });
  };
  const remove = (id) => { const u = attendances.filter(a => a.id !== id); setAttendances(u); save("hr-attendances", u); };

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", fontSize: isMob ? 20 : 24, fontWeight: 800 }}>근태 관리</h2>

      <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.primaryLight, border: `1.5px solid ${C.primary}` }}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>근태 신청 등록</div>
        <Grid cols={3} w={w}>
          <FormField label="직원 선택 *">
            <select style={S.select} value={form.employeeId} onChange={e => setF("employeeId", e.target.value)}>
              <option value="">선택</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.dept})</option>)}
            </select>
          </FormField>
          <FormField label="유형">
            <select style={S.select} value={form.type} onChange={e => setF("type", e.target.value)}>
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="사유"><input style={S.input} value={form.reason} onChange={e => setF("reason", e.target.value)} placeholder="사유 입력" /></FormField>
        </Grid>
        <Grid cols={2} w={w}>
          <FormField label="시작일"><input type="date" style={S.input} value={form.startDate} onChange={e => setF("startDate", e.target.value)} /></FormField>
          <FormField label="종료일"><input type="date" style={S.input} value={form.endDate} onChange={e => setF("endDate", e.target.value)} /></FormField>
        </Grid>
        <button style={S.btn} onClick={add}>등록</button>
      </div>

      <div style={{ ...S.card, padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: isMob ? 400 : 560 }}>
          <thead>
            <tr style={{ backgroundColor: C.bg }}>
              {["직원","유형","시작일","종료일","사유",""].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attendances.length === 0 ? <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.muted }}>등록된 근태 내역이 없습니다</td></tr>
            : [...attendances].reverse().map(a => {
              const tc = typeColor(a.type);
              return (
                <tr key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "11px 12px", fontWeight: 600 }}>{a.employeeName}</td>
                  <td style={{ padding: "11px 12px" }}><Badge text={a.type} color={tc.color} bg={tc.bg} /></td>
                  <td style={{ padding: "11px 12px", color: C.muted, whiteSpace: "nowrap" }}>{fmt(a.startDate)}</td>
                  <td style={{ padding: "11px 12px", color: C.muted, whiteSpace: "nowrap" }}>{fmt(a.endDate)}</td>
                  <td style={{ padding: "11px 12px", color: C.muted }}>{a.reason || "-"}</td>
                  <td style={{ padding: "11px 12px" }}><button style={S.btnSm()} onClick={() => remove(a.id)}>삭제</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  온보딩
// ════════════════════════════════════════════════════════════════════
const DEFAULT_ITEMS = [
  { text: "입사 안내 메일 발송", category: "HR" },
  { text: "노트북 신청", category: "총무" },
  { text: "이메일 계정 생성", category: "IT" },
  { text: "사내 시스템 계정 발급", category: "IT" },
  { text: "4대보험 취득 신고", category: "HR" },
  { text: "급여 계좌 등록", category: "HR" },
  { text: "근로계약서 서명", category: "HR" },
  { text: "조직도 및 사규 안내", category: "HR" },
  { text: "팀 소개 미팅 진행", category: "팀장" },
  { text: "사원증 발급", category: "총무" },
  { text: "명함 제작 신청", category: "총무" },
  { text: "주차 등록", category: "총무" },
  { text: "OJT 일정 수립", category: "팀장" },
  { text: "수습 평가 일정 안내", category: "HR" },
];

function OnboardingManager({ w }) {
  const isMob = mob(w);
  const [onboardings, setOnboardings] = useState(() => load("hr-onboardings", []));
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState(""); const [joinDate, setJoinDate] = useState(todayStr());

  const addOnboarding = () => {
    if (!newName) return;
    const items = DEFAULT_ITEMS.map((item, i) => ({ id: i, ...item, done: false }));
    const u = [...onboardings, { id: Date.now(), name: newName, joinDate, items }];
    setOnboardings(u); save("hr-onboardings", u);
    setNewName(""); setAdding(false);
  };
  const toggleItem = (oid, iid) => {
    const u = onboardings.map(o => o.id === oid ? { ...o, items: o.items.map(i => i.id === iid ? { ...i, done: !i.done, doneDate: !i.done ? todayStr() : null } : i) } : o);
    setOnboardings(u); save("hr-onboardings", u);
  };
  const removeO = (id) => { const u = onboardings.filter(o => o.id !== id); setOnboardings(u); save("hr-onboardings", u); if (selected === id) setSelected(null); };
  const current = onboardings.find(o => o.id === selected);
  const catColor = (c) => c === "HR" ? { color: C.primary, bg: C.primaryLight } : c === "IT" ? { color: C.green, bg: C.greenLight } : c === "총무" ? { color: C.orange, bg: C.orangeLight } : { color: C.purple, bg: C.purpleLight };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: isMob ? 20 : 24, fontWeight: 800 }}>온보딩 체크리스트</h2>
        <button style={S.btn} onClick={() => setAdding(!adding)}>+ 입사자 추가</button>
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.primaryLight, border: `1.5px solid ${C.primary}` }}>
          <Grid cols={2} w={w}>
            <FormField label="입사자 이름 *"><input style={S.input} value={newName} onChange={e => setNewName(e.target.value)} placeholder="홍길동" /></FormField>
            <FormField label="입사일"><input type="date" style={S.input} value={joinDate} onChange={e => setJoinDate(e.target.value)} /></FormField>
          </Grid>
          <div style={{ display: "flex", gap: 8 }}><button style={S.btn} onClick={addOnboarding}>추가</button><button style={S.btnGhost} onClick={() => setAdding(false)}>취소</button></div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMob ? "1fr" : "260px 1fr", gap: 16 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.muted, marginBottom: 12 }}>입사자 목록</div>
          {onboardings.length === 0 ? <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>입사자를 추가해주세요</div>
          : onboardings.map(o => {
            const done = o.items.filter(i => i.done).length;
            const pct = Math.round(done / o.items.length * 100);
            return (
              <div key={o.id} onClick={() => setSelected(o.id)} style={{ padding: 12, borderRadius: 8, marginBottom: 8, cursor: "pointer", backgroundColor: selected === o.id ? C.primaryLight : C.bg, border: `1.5px solid ${selected === o.id ? C.primary : C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{o.name}</span>
                  <button onClick={e => { e.stopPropagation(); removeO(o.id); }} style={S.btnSm()}>삭제</button>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{fmt(o.joinDate)} 입사</div>
                <div style={{ backgroundColor: C.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", backgroundColor: pct === 100 ? C.green : C.primary, borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: 11, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.muted }}>{done}/{o.items.length} 완료</span>
                  <span style={{ color: pct === 100 ? C.green : C.primary, fontWeight: 700 }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={S.card}>
          {!current ? (
            <div style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: "60px 0" }}>입사자를 선택해주세요</div>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{current.name}</div>
              <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>{fmt(current.joinDate)} 입사 · {current.items.filter(i => i.done).length}/{current.items.length} 완료</div>
              {current.items.map(item => {
                const cc = catColor(item.category);
                return (
                  <div key={item.id} onClick={() => toggleItem(current.id, item.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 6, cursor: "pointer", backgroundColor: item.done ? C.greenLight : C.bg }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${item.done ? C.green : C.border}`, backgroundColor: item.done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {item.done && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                    </div>
                    <Badge text={item.category} color={cc.color} bg={cc.bg} />
                    <span style={{ fontSize: 13, textDecoration: item.done ? "line-through" : "none", color: item.done ? C.muted : C.ink, flex: 1 }}>{item.text}</span>
                    {item.done && item.doneDate && <span style={{ fontSize: 11, color: C.muted }}>{fmt(item.doneDate)}</span>}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  일정 관리 — 신규
// ════════════════════════════════════════════════════════════════════
function EventManager({ events, setEvents, w }) {
  const isMob = mob(w);
  const [form, setForm] = useState({ title: "", date: todayStr(), category: "HR", desc: "" });
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const categories = ["HR","채용","급여","행사","총무","교육","기타"];
  const catColor = (c) => c === "HR" ? { color: C.primary, bg: C.primaryLight } : c === "채용" ? { color: C.green, bg: C.greenLight } : c === "급여" ? { color: C.yellow, bg: C.yellowLight } : c === "행사" ? { color: C.purple, bg: C.purpleLight } : { color: C.orange, bg: C.orangeLight };

  const add = () => {
    if (!form.title) return;
    const u = [...events, { ...form, id: Date.now() }];
    setEvents(u); save("hr-events", u);
    setForm({ title: "", date: todayStr(), category: "HR", desc: "" });
  };
  const remove = (id) => { const u = events.filter(e => e.id !== id); setEvents(u); save("hr-events", u); };

  // 🤖 자동화: 이번달 / 다음달 자동 분류
  const thisMonth = new Date().toISOString().slice(0, 7);
  const nextMonth = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 7);
  const grouped = {
    "이번달": events.filter(e => e.date.startsWith(thisMonth)).sort((a, b) => a.date.localeCompare(b.date)),
    "다음달": events.filter(e => e.date.startsWith(nextMonth)).sort((a, b) => a.date.localeCompare(b.date)),
    "이후": events.filter(e => e.date > nextMonth + "-31").sort((a, b) => a.date.localeCompare(b.date)),
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", fontSize: isMob ? 20 : 24, fontWeight: 800 }}>주요 일정</h2>

      <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.primaryLight, border: `1.5px solid ${C.primary}` }}>
        <Grid cols={4} mobCols={1} w={w}>
          <FormField label="일정 제목 *"><input style={S.input} value={form.title} onChange={e => setF("title", e.target.value)} placeholder="일정 입력" /></FormField>
          <FormField label="날짜"><input type="date" style={S.input} value={form.date} onChange={e => setF("date", e.target.value)} /></FormField>
          <FormField label="카테고리">
            <select style={S.select} value={form.category} onChange={e => setF("category", e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="상세내용"><input style={S.input} value={form.desc} onChange={e => setF("desc", e.target.value)} placeholder="상세내용" /></FormField>
        </Grid>
        <button style={S.btn} onClick={add}>+ 일정 추가</button>
      </div>

      {Object.entries(grouped).map(([period, evts]) => evts.length === 0 ? null : (
        <div key={period} style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.muted, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{period === "이번달" ? "📅" : period === "다음달" ? "🗓" : "📆"}</span>
            <span>{period}</span>
            <Badge text={`${evts.length}건`} color={C.primary} bg={C.primaryLight} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {evts.map(e => {
              const cc = catColor(e.category);
              const dl = daysLeft(e.date);
              return (
                <div key={e.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", flexWrap: isMob ? "wrap" : "nowrap" }}>
                  <div style={{ backgroundColor: cc.bg, borderRadius: 8, padding: "6px 10px", textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: cc.color }}>{e.date.slice(8)}</div>
                    <div style={{ fontSize: 9, color: cc.color }}>{e.date.slice(5, 7)}월</div>
                  </div>
                  <Badge text={e.category} color={cc.color} bg={cc.bg} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
                    {e.desc && <div style={{ fontSize: 12, color: C.muted }}>{e.desc}</div>}
                  </div>
                  {dl !== null && dl >= 0 && <span style={{ fontSize: 12, fontWeight: 700, color: dl <= 3 ? C.red : C.muted, whiteSpace: "nowrap" }}>D-{dl}</span>}
                  <button style={S.btnSm()} onClick={() => remove(e.id)}>삭제</button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Todo
// ════════════════════════════════════════════════════════════════════
function TodoManager({ w }) {
  const isMob = mob(w);
  const [todos, setTodos] = useState(() => load("hr-todos", []));
  const [form, setForm] = useState({ text: "", category: "채용", dueDate: "", priority: "보통" });
  const [filter, setFilter] = useState("전체");
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const categories = ["채용","온보딩","근태","급여","총무","행사","교육","기타"];
  const pc = (p) => p === "높음" ? { color: C.red, bg: C.redLight } : p === "낮음" ? { color: C.muted, bg: C.bg } : { color: C.yellow, bg: C.yellowLight };

  const add = () => {
    if (!form.text) return;
    const u = [...todos, { ...form, id: Date.now(), done: false, createdAt: todayStr() }];
    setTodos(u); save("hr-todos", u);
    setForm({ text: "", category: "채용", dueDate: "", priority: "보통" });
  };
  const toggle = (id) => { const u = todos.map(t => t.id === id ? { ...t, done: !t.done, doneDate: !t.done ? todayStr() : null } : t); setTodos(u); save("hr-todos", u); };
  const remove = (id) => { const u = todos.filter(t => t.id !== id); setTodos(u); save("hr-todos", u); };
  const filtered = todos.filter(t => filter === "전체" ? true : (filter === "완료" ? t.done : (filter === "미완료" ? !t.done : (!t.done && t.category === filter))));

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: isMob ? 20 : 24, fontWeight: 800 }}>업무 Todo <span style={{ fontSize: 14, color: C.muted, fontWeight: 400 }}>미완료 {todos.filter(t => !t.done).length}건</span></h2>

      <div style={{ ...S.card, marginBottom: 20 }}>
        <Grid cols={4} mobCols={1} w={w}>
          <FormField label="업무 내용 *">
            <input style={S.input} value={form.text} onChange={e => setF("text", e.target.value)} placeholder="할 일 입력 (Enter)" onKeyDown={e => e.key === "Enter" && add()} />
          </FormField>
          <FormField label="카테고리">
            <select style={{ ...S.select, width: "100%" }} value={form.category} onChange={e => setF("category", e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="우선순위">
            <select style={{ ...S.select, width: "100%" }} value={form.priority} onChange={e => setF("priority", e.target.value)}>
              {["높음","보통","낮음"].map(p => <option key={p}>{p}</option>)}
            </select>
          </FormField>
          <FormField label="마감일">
            <input type="date" style={{ ...S.input, width: "100%" }} value={form.dueDate} onChange={e => setF("dueDate", e.target.value)} />
          </FormField>
        </Grid>
        <button style={S.btn} onClick={add}>+ 추가</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["전체","미완료","완료",...categories].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", backgroundColor: filter === f ? C.primary : C.bg, color: filter === f ? "#fff" : C.muted, fontFamily: "inherit" }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: 40 }}>할 일이 없습니다 🎉</div>
        : filtered.map(t => {
          const pcolor = pc(t.priority);
          const dl = daysLeft(t.dueDate);
          return (
            <div key={t.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", opacity: t.done ? 0.6 : 1, flexWrap: isMob ? "wrap" : "nowrap" }}>
              <div onClick={() => toggle(t.id)} style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${t.done ? C.green : C.border}`, backgroundColor: t.done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                {t.done && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}
              </div>
              <Badge text={t.category} color={C.primary} bg={C.primaryLight} />
              <Badge text={t.priority} color={pcolor.color} bg={pcolor.bg} />
              <span style={{ flex: 1, fontSize: 14, textDecoration: t.done ? "line-through" : "none", color: t.done ? C.muted : C.ink, minWidth: 80 }}>{t.text}</span>
              {t.dueDate && <span style={{ fontSize: 12, fontWeight: 600, color: dl !== null && dl <= 1 && !t.done ? C.red : C.muted, whiteSpace: "nowrap" }}>{fmt(t.dueDate)}{dl !== null && !t.done && dl <= 3 ? ` D-${dl}` : ""}</span>}
              <button style={S.btnSm()} onClick={() => remove(t.id)}>삭제</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  앱 루트
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const w = useWindowWidth();
  const isMob = mob(w);
  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [employees, setEmployees] = useState(() => load("hr-employees", []));
  const [candidates, setCandidates] = useState(() => load("hr-candidates", []));
  const [attendances, setAttendances] = useState(() => load("hr-attendances", []));
  const [events, setEvents] = useState(() => load("hr-events", []));
  const todos = load("hr-todos", []);

  const nav = [
    { id: "dashboard", label: "대시보드", icon: "🏠" },
    { id: "employees", label: "직원 관리", icon: "👥" },
    { id: "recruiting", label: "채용 관리", icon: "📋" },
    { id: "attendance", label: "근태 관리", icon: "📅" },
    { id: "onboarding", label: "온보딩", icon: "✅" },
    { id: "events", label: "주요 일정", icon: "🗓" },
    { id: "todo", label: "업무 Todo", icon: "📌" },
  ];

  const goTo = (id) => { setPage(id); setMenuOpen(false); };

  const renderPage = () => {
    switch(page) {
      case "dashboard": return <Dashboard employees={employees} todos={todos} candidates={candidates} attendances={attendances} events={events} w={w} />;
      case "employees": return <EmployeeManager employees={employees} setEmployees={setEmployees} w={w} />;
      case "recruiting": return <RecruitManager candidates={candidates} setCandidates={setCandidates} w={w} />;
      case "attendance": return <AttendanceManager employees={employees} attendances={attendances} setAttendances={setAttendances} w={w} />;
      case "onboarding": return <OnboardingManager w={w} />;
      case "events": return <EventManager events={events} setEvents={setEvents} w={w} />;
      case "todo": return <TodoManager w={w} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif", color: C.ink }}>
      {isMob ? (
        <>
          <div style={{ position: "sticky", top: 0, zIndex: 200, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>🏢 HR 업무 관리</div>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ border: "none", backgroundColor: "transparent", fontSize: 22, cursor: "pointer" }}>☰</button>
          </div>
          {menuOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 300, backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setMenuOpen(false)}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 260, height: "100%", backgroundColor: C.surface, padding: "24px 12px", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20, padding: "0 8px" }}>🏢 HR 업무 관리</div>
                {nav.map(n => (
                  <button key={n.id} onClick={() => goTo(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 15, fontWeight: page === n.id ? 700 : 400, backgroundColor: page === n.id ? C.primaryLight : "transparent", color: page === n.id ? C.primary : C.ink, marginBottom: 4, fontFamily: "inherit" }}>
                    <span>{n.icon}</span><span>{n.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ padding: 16, paddingBottom: 80 }}>{renderPage()}</div>
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100 }}>
            {nav.slice(0, 5).map(n => (
              <button key={n.id} onClick={() => goTo(n.id)} style={{ flex: 1, border: "none", backgroundColor: "transparent", padding: "8px 2px 6px", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <span style={{ fontSize: 9, fontWeight: page === n.id ? 700 : 400, color: page === n.id ? C.primary : C.muted }}>{n.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{ display: "flex" }}>
          <div style={{ width: tab(w) ? 180 : 220, minHeight: "100vh", backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "24px 20px 18px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>HR SYSTEM</div>
              <div style={{ fontSize: tab(w) ? 14 : 16, fontWeight: 800 }}>인사 업무 관리</div>
            </div>
            <div style={{ padding: 12, flex: 1 }}>
              {nav.map(n => (
                <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: tab(w) ? 13 : 14, fontWeight: page === n.id ? 700 : 400, backgroundColor: page === n.id ? C.primaryLight : "transparent", color: page === n.id ? C.primary : C.ink, marginBottom: 2, fontFamily: "inherit" }}>
                  <span>{n.icon}</span><span>{n.label}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.muted }}>
              직원 {employees.length}명 · 지원자 {candidates.length}명
            </div>
          </div>
          <div style={{ flex: 1, padding: tab(w) ? "24px" : "32px 36px", overflowY: "auto", maxHeight: "100vh" }}>
            {renderPage()}
          </div>
        </div>
      )}
    </div>
  );
}
