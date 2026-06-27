import { useState } from "react";

// ── 색상 ──────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F7FA",
  surface: "#FFFFFF",
  ink: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  primary: "#2563EB",
  primaryLight: "#EFF6FF",
  green: "#059669",
  greenLight: "#ECFDF5",
  red: "#DC2626",
  redLight: "#FEF2F2",
  yellow: "#D97706",
  yellowLight: "#FFFBEB",
  purple: "#7C3AED",
  purpleLight: "#F5F3FF",
};

// ── 공통 스타일 ───────────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", backgroundColor: C.bg, fontFamily: "'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif", color: C.ink },
  card: { backgroundColor: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px" },
  input: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: C.ink, backgroundColor: C.surface, outline: "none", fontFamily: "inherit" },
  select: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: C.ink, backgroundColor: C.surface, outline: "none", fontFamily: "inherit", cursor: "pointer" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 4 },
  btn: { backgroundColor: C.primary, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  btnGhost: { backgroundColor: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  btnRed: { backgroundColor: C.red, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" },
};

// ── 로컬스토리지 헬퍼 ────────────────────────────────────────────────
const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ── 날짜 헬퍼 ────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const daysLeft = (dateStr) => { if (!dateStr) return null; const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000); return diff; };
const formatDate = (dateStr) => { if (!dateStr) return "-"; const d = new Date(dateStr); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`; };

// ── 배지 ──────────────────────────────────────────────────────────────
const Badge = ({ text, color = C.primary, bg = C.primaryLight }) => (
  <span style={{ backgroundColor: bg, color, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{text}</span>
);

// ── 섹션 헤더 ─────────────────────────────────────────────────────────
const SectionHeader = ({ title, sub, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
    <div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</h2>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>{sub}</p>}
    </div>
    {action}
  </div>
);

// ════════════════════════════════════════════════════════════════════
//  대시보드
// ════════════════════════════════════════════════════════════════════
function Dashboard({ employees, todos, candidates }) {
  const alerts = [];

  employees.forEach(e => {
    if (e.probationEnd) {
      const d = daysLeft(e.probationEnd);
      if (d !== null && d <= 30 && d >= 0) alerts.push({ type: "수습종료", name: e.name, date: e.probationEnd, days: d, color: C.yellow, bg: C.yellowLight });
    }
    if (e.contractEnd) {
      const d = daysLeft(e.contractEnd);
      if (d !== null && d <= 30 && d >= 0) alerts.push({ type: "계약만료", name: e.name, date: e.contractEnd, days: d, color: C.red, bg: C.redLight });
    }
    if (e.leaveRemain !== undefined && e.leaveRemain <= 3) {
      alerts.push({ type: "연차부족", name: e.name, date: null, days: null, color: C.purple, bg: C.purpleLight, extra: `잔여 ${e.leaveRemain}일` });
    }
  });

  const todayTodos = todos.filter(t => !t.done);
  const hiringCount = candidates.filter(c => c.status !== "불합격" && c.status !== "최종합격").length;

  const stats = [
    { label: "전체 직원", value: employees.length, color: C.primary, bg: C.primaryLight, icon: "👥" },
    { label: "진행 중 채용", value: hiringCount, color: C.green, bg: C.greenLight, icon: "📋" },
    { label: "미완료 Todo", value: todayTodos.length, color: C.yellow, bg: C.yellowLight, icon: "✅" },
    { label: "긴급 알림", value: alerts.length, color: C.red, bg: C.redLight, icon: "⚠️" },
  ];

  return (
    <div>
      <SectionHeader title="대시보드" sub={`${today()} 기준`} />

      {/* 통계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...S.card, textAlign: "center", backgroundColor: s.bg, border: "none" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* 긴급 알림 */}
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            ⚠️ 긴급 알림
          </div>
          {alerts.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>긴급 알림이 없습니다 ✅</div>
          ) : alerts.map((a, i) => (
            <div key={i} style={{ backgroundColor: a.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Badge text={a.type} color={a.color} bg="transparent" />
                <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 8 }}>{a.name}</span>
                {a.extra && <span style={{ fontSize: 12, color: a.color, marginLeft: 8 }}>{a.extra}</span>}
              </div>
              {a.days !== null && (
                <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.days === 0 ? "오늘!" : `D-${a.days}`}</span>
              )}
            </div>
          ))}
        </div>

        {/* 미완료 Todo */}
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>✅ 미완료 업무</div>
          {todayTodos.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>모든 업무 완료! 🎉</div>
          ) : todayTodos.slice(0, 6).map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <Badge text={t.category} color={C.primary} bg={C.primaryLight} />
              <span style={{ fontSize: 13, flex: 1 }}>{t.text}</span>
              {t.dueDate && <span style={{ fontSize: 11, color: C.muted }}>{formatDate(t.dueDate)}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  직원 관리
// ════════════════════════════════════════════════════════════════════
function EmployeeManager({ employees, setEmployees }) {
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", dept: "", position: "", joinDate: "", employType: "정규직", probationEnd: "", contractEnd: "", leaveTotal: 15, leaveUsed: 0, phone: "", email: "" });
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const add = () => {
    if (!form.name) return;
    const newEmp = { ...form, id: Date.now(), leaveRemain: form.leaveTotal - form.leaveUsed };
    const updated = [...employees, newEmp];
    setEmployees(updated);
    save("hr-employees", updated);
    setForm({ name: "", dept: "", position: "", joinDate: "", employType: "정규직", probationEnd: "", contractEnd: "", leaveTotal: 15, leaveUsed: 0, phone: "", email: "" });
    setAdding(false);
  };

  const remove = (id) => {
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    save("hr-employees", updated);
  };

  const filtered = employees.filter(e => e.name.includes(search) || e.dept.includes(search));

  return (
    <div>
      <SectionHeader title="직원 관리" sub={`총 ${employees.length}명`}
        action={<button style={S.btn} onClick={() => setAdding(!adding)}>+ 직원 추가</button>} />

      {/* 추가 폼 */}
      {adding && (
        <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.primaryLight, border: `1px solid ${C.primary}` }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>새 직원 등록</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
            {[["name","이름 *"],["dept","부서"],["position","직급/직책"]].map(([f,l]) => (
              <div key={f}>
                <label style={S.label}>{l}</label>
                <input style={S.input} value={form[f]} onChange={e => setF(f, e.target.value)} placeholder={l} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={S.label}>입사일</label>
              <input type="date" style={S.input} value={form.joinDate} onChange={e => setF("joinDate", e.target.value)} />
            </div>
            <div>
              <label style={S.label}>고용형태</label>
              <select style={S.select} value={form.employType} onChange={e => setF("employType", e.target.value)}>
                {["정규직","계약직","인턴","파견직"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>수습 종료일</label>
              <input type="date" style={S.input} value={form.probationEnd} onChange={e => setF("probationEnd", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={S.label}>계약 만료일</label>
              <input type="date" style={S.input} value={form.contractEnd} onChange={e => setF("contractEnd", e.target.value)} />
            </div>
            <div>
              <label style={S.label}>연차 총일수</label>
              <input type="number" style={S.input} value={form.leaveTotal} onChange={e => setF("leaveTotal", Number(e.target.value))} />
            </div>
            <div>
              <label style={S.label}>사용 연차</label>
              <input type="number" style={S.input} value={form.leaveUsed} onChange={e => setF("leaveUsed", Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[["phone","연락처"],["email","이메일"]].map(([f,l]) => (
              <div key={f}>
                <label style={S.label}>{l}</label>
                <input style={S.input} value={form[f]} onChange={e => setF(f, e.target.value)} placeholder={l} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btn} onClick={add}>저장</button>
            <button style={S.btnGhost} onClick={() => setAdding(false)}>취소</button>
          </div>
        </div>
      )}

      {/* 검색 */}
      <input style={{ ...S.input, marginBottom: 16 }} placeholder="이름 또는 부서로 검색" value={search} onChange={e => setSearch(e.target.value)} />

      {/* 직원 목록 */}
      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: C.bg }}>
              {["이름","부서","직급","고용형태","입사일","수습종료","계약만료","연차현황","연락처",""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: "40px", textAlign: "center", color: C.muted }}>등록된 직원이 없습니다</td></tr>
            ) : filtered.map(e => {
              const probDays = daysLeft(e.probationEnd);
              const contDays = daysLeft(e.contractEnd);
              const leaveRemain = e.leaveTotal - e.leaveUsed;
              return (
                <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>{e.name}</td>
                  <td style={{ padding: "12px 14px", color: C.muted }}>{e.dept || "-"}</td>
                  <td style={{ padding: "12px 14px", color: C.muted }}>{e.position || "-"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge text={e.employType} color={e.employType === "정규직" ? C.green : C.yellow} bg={e.employType === "정규직" ? C.greenLight : C.yellowLight} />
                  </td>
                  <td style={{ padding: "12px 14px", color: C.muted }}>{formatDate(e.joinDate)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {e.probationEnd ? (
                      <span style={{ color: probDays !== null && probDays <= 7 ? C.red : C.muted, fontWeight: probDays !== null && probDays <= 7 ? 700 : 400 }}>
                        {formatDate(e.probationEnd)}{probDays !== null && probDays >= 0 && ` (D-${probDays})`}
                      </span>
                    ) : "-"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {e.contractEnd ? (
                      <span style={{ color: contDays !== null && contDays <= 30 ? C.red : C.muted, fontWeight: contDays !== null && contDays <= 30 ? 700 : 400 }}>
                        {formatDate(e.contractEnd)}{contDays !== null && contDays >= 0 && ` (D-${contDays})`}
                      </span>
                    ) : "-"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ color: leaveRemain <= 3 ? C.red : C.green, fontWeight: 600 }}>{leaveRemain}일</span>
                    <span style={{ color: C.muted, fontSize: 11 }}> / {e.leaveTotal}일</span>
                  </td>
                  <td style={{ padding: "12px 14px", color: C.muted }}>{e.phone || "-"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button style={S.btnRed} onClick={() => remove(e.id)}>삭제</button>
                  </td>
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
//  채용 관리
// ════════════════════════════════════════════════════════════════════
function RecruitManager({ candidates, setCandidates }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", position: "", appliedDate: today(), status: "서류검토", phone: "", email: "", resume: "", note: "" });
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const stages = ["서류검토", "전화스크리닝", "1차면접", "2차면접", "처우협의", "최종합격", "불합격"];

  const add = () => {
    if (!form.name || !form.position) return;
    const updated = [...candidates, { ...form, id: Date.now() }];
    setCandidates(updated);
    save("hr-candidates", updated);
    setForm({ name: "", position: "", appliedDate: today(), status: "서류검토", phone: "", email: "", resume: "", note: "" });
    setAdding(false);
  };

  const updateStatus = (id, status) => {
    const updated = candidates.map(c => c.id === id ? { ...c, status } : c);
    setCandidates(updated);
    save("hr-candidates", updated);
  };

  const remove = (id) => {
    const updated = candidates.filter(c => c.id !== id);
    setCandidates(updated);
    save("hr-candidates", updated);
  };

  const stageColor = (s) => {
    if (s === "최종합격") return { color: C.green, bg: C.greenLight };
    if (s === "불합격") return { color: C.red, bg: C.redLight };
    if (s === "처우협의") return { color: C.purple, bg: C.purpleLight };
    return { color: C.primary, bg: C.primaryLight };
  };

  return (
    <div>
      <SectionHeader title="채용 관리" sub={`진행 중 ${candidates.filter(c => c.status !== "불합격" && c.status !== "최종합격").length}건`}
        action={<button style={S.btn} onClick={() => setAdding(!adding)}>+ 지원자 추가</button>} />

      {/* 단계별 현황 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {stages.map(s => {
          const count = candidates.filter(c => c.status === s).length;
          const sc = stageColor(s);
          return (
            <div key={s} style={{ flexShrink: 0, backgroundColor: sc.bg, borderRadius: 8, padding: "10px 16px", textAlign: "center", minWidth: 80 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: sc.color }}>{count}</div>
              <div style={{ fontSize: 11, color: sc.color, fontWeight: 600 }}>{s}</div>
            </div>
          );
        })}
      </div>

      {/* 추가 폼 */}
      {adding && (
        <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.primaryLight, border: `1px solid ${C.primary}` }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>지원자 추가</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
            {[["name","이름 *"],["position","지원 포지션 *"],["phone","연락처"]].map(([f,l]) => (
              <div key={f}>
                <label style={S.label}>{l}</label>
                <input style={S.input} value={form[f]} onChange={e => setF(f, e.target.value)} placeholder={l} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={S.label}>이메일</label>
              <input style={S.input} value={form.email} onChange={e => setF("email", e.target.value)} placeholder="이메일" />
            </div>
            <div>
              <label style={S.label}>지원일</label>
              <input type="date" style={S.input} value={form.appliedDate} onChange={e => setF("appliedDate", e.target.value)} />
            </div>
            <div>
              <label style={S.label}>현재 단계</label>
              <select style={S.select} value={form.status} onChange={e => setF("status", e.target.value)}>
                {stages.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={S.label}>메모</label>
            <input style={S.input} value={form.note} onChange={e => setF("note", e.target.value)} placeholder="특이사항, 메모" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={S.btn} onClick={add}>저장</button>
            <button style={S.btnGhost} onClick={() => setAdding(false)}>취소</button>
          </div>
        </div>
      )}

      {/* 지원자 목록 */}
      <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: C.bg }}>
              {["이름","지원 포지션","연락처","지원일","진행 단계","메모",""].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: C.muted }}>등록된 지원자가 없습니다</td></tr>
            ) : candidates.map(c => {
              const sc = stageColor(c.status);
              return (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: "12px 14px", color: C.muted }}>{c.position}</td>
                  <td style={{ padding: "12px 14px", color: C.muted }}>{c.phone || "-"}</td>
                  <td style={{ padding: "12px 14px", color: C.muted }}>{formatDate(c.appliedDate)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)}
                      style={{ backgroundColor: sc.bg, color: sc.color, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {stages.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "12px 14px", color: C.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.note || "-"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button style={S.btnRed} onClick={() => remove(c.id)}>삭제</button>
                  </td>
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
//  온보딩 체크리스트
// ════════════════════════════════════════════════════════════════════
const DEFAULT_CHECKLIST = [
  "입사 안내 메일 발송", "노트북 신청", "이메일 계정 생성", "사내 시스템 계정 발급",
  "4대보험 취득 신고", "급여 계좌 등록", "근로계약서 서명", "조직도 안내",
  "팀 소개 미팅 진행", "사원증 발급", "명함 제작 신청", "주차 등록",
];

function OnboardingManager({ employees }) {
  const [onboardings, setOnboardings] = useState(() => load("hr-onboardings", []));
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinDate, setJoinDate] = useState(today());

  const addOnboarding = () => {
    if (!newName) return;
    const items = DEFAULT_CHECKLIST.map((text, i) => ({ id: i, text, done: false }));
    const updated = [...onboardings, { id: Date.now(), name: newName, joinDate, items }];
    setOnboardings(updated);
    save("hr-onboardings", updated);
    setNewName(""); setJoinDate(today()); setAdding(false);
  };

  const toggleItem = (onbId, itemId) => {
    const updated = onboardings.map(o => o.id === onbId ? {
      ...o, items: o.items.map(item => item.id === itemId ? { ...item, done: !item.done } : item)
    } : o);
    setOnboardings(updated);
    save("hr-onboardings", updated);
  };

  const removeOnboarding = (id) => {
    const updated = onboardings.filter(o => o.id !== id);
    setOnboardings(updated);
    save("hr-onboardings", updated);
    if (selected === id) setSelected(null);
  };

  const current = onboardings.find(o => o.id === selected);

  return (
    <div>
      <SectionHeader title="온보딩 체크리스트" sub="입사자별 온보딩 진행 현황"
        action={<button style={S.btn} onClick={() => setAdding(!adding)}>+ 입사자 추가</button>} />

      {adding && (
        <div style={{ ...S.card, marginBottom: 20, backgroundColor: C.primaryLight, border: `1px solid ${C.primary}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
            <div>
              <label style={S.label}>입사자 이름 *</label>
              <input style={S.input} value={newName} onChange={e => setNewName(e.target.value)} placeholder="홍길동" />
            </div>
            <div>
              <label style={S.label}>입사일</label>
              <input type="date" style={S.input} value={joinDate} onChange={e => setJoinDate(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn} onClick={addOnboarding}>추가</button>
              <button style={S.btnGhost} onClick={() => setAdding(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
        {/* 입사자 목록 */}
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.muted, marginBottom: 12 }}>입사자 목록</div>
          {onboardings.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>입사자를 추가해주세요</div>
          ) : onboardings.map(o => {
            const done = o.items.filter(i => i.done).length;
            const total = o.items.length;
            const pct = Math.round(done / total * 100);
            return (
              <div key={o.id} onClick={() => setSelected(o.id)}
                style={{ padding: "12px", borderRadius: 8, marginBottom: 8, cursor: "pointer", backgroundColor: selected === o.id ? C.primaryLight : C.bg, border: `1px solid ${selected === o.id ? C.primary : C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{o.name}</span>
                  <button onClick={e => { e.stopPropagation(); removeOnboarding(o.id); }} style={{ ...S.btnRed, padding: "3px 8px", fontSize: 11 }}>삭제</button>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{formatDate(o.joinDate)} 입사</div>
                <div style={{ backgroundColor: C.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", backgroundColor: pct === 100 ? C.green : C.primary, borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{done}/{total} 완료 ({pct}%)</div>
              </div>
            );
          })}
        </div>

        {/* 체크리스트 */}
        <div style={S.card}>
          {!current ? (
            <div style={{ color: C.muted, fontSize: 14, textAlign: "center", padding: "60px 0" }}>왼쪽에서 입사자를 선택해주세요</div>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{current.name} 온보딩 체크리스트</div>
              <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>{formatDate(current.joinDate)} 입사</div>
              {current.items.map(item => (
                <div key={item.id} onClick={() => toggleItem(current.id, item.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 8, marginBottom: 6, cursor: "pointer", backgroundColor: item.done ? C.greenLight : C.bg, transition: "background 0.15s" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${item.done ? C.green : C.border}`, backgroundColor: item.done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.done && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 14, textDecoration: item.done ? "line-through" : "none", color: item.done ? C.muted : C.ink }}>{item.text}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Todo 관리
// ════════════════════════════════════════════════════════════════════
function TodoManager() {
  const [todos, setTodos] = useState(() => load("hr-todos", []));
  const [form, setForm] = useState({ text: "", category: "채용", dueDate: "", priority: "보통" });
  const [filter, setFilter] = useState("전체");
  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const categories = ["채용", "온보딩", "근태", "급여", "총무", "행사", "기타"];
  const priorities = ["높음", "보통", "낮음"];

  const add = () => {
    if (!form.text) return;
    const updated = [...todos, { ...form, id: Date.now(), done: false, createdAt: today() }];
    setTodos(updated);
    save("hr-todos", updated);
    setForm({ text: "", category: "채용", dueDate: "", priority: "보통" });
  };

  const toggle = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTodos(updated);
    save("hr-todos", updated);
  };

  const remove = (id) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    save("hr-todos", updated);
  };

  const filtered = todos.filter(t => filter === "전체" ? true : filter === "완료" ? t.done : (filter === "미완료" ? !t.done : (!t.done && t.category === filter)));
  const priorityColor = (p) => p === "높음" ? { color: C.red, bg: C.redLight } : p === "낮음" ? { color: C.muted, bg: C.bg } : { color: C.yellow, bg: C.yellowLight };

  return (
    <div>
      <SectionHeader title="업무 Todo" sub={`미완료 ${todos.filter(t => !t.done).length}건`} />

      {/* 추가 */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, alignItems: "flex-end" }}>
          <div>
            <label style={S.label}>업무 내용 *</label>
            <input style={S.input} value={form.text} onChange={e => setF("text", e.target.value)} placeholder="할 일을 입력하세요" onKeyDown={e => e.key === "Enter" && add()} />
          </div>
          <div>
            <label style={S.label}>카테고리</label>
            <select style={{ ...S.select, width: "auto" }} value={form.category} onChange={e => setF("category", e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>우선순위</label>
            <select style={{ ...S.select, width: "auto" }} value={form.priority} onChange={e => setF("priority", e.target.value)}>
              {priorities.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>마감일</label>
            <input type="date" style={{ ...S.input, width: "auto" }} value={form.dueDate} onChange={e => setF("dueDate", e.target.value)} />
          </div>
        </div>
        <button style={{ ...S.btn, marginTop: 12 }} onClick={add}>+ 추가</button>
      </div>

      {/* 필터 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["전체", "미완료", "완료", ...categories].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", backgroundColor: filter === f ? C.primary : C.bg, color: filter === f ? "#fff" : C.muted, fontFamily: "inherit" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Todo 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: "40px" }}>할 일이 없습니다 🎉</div>
        ) : filtered.map(t => {
          const pc = priorityColor(t.priority);
          const dl = daysLeft(t.dueDate);
          return (
            <div key={t.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", opacity: t.done ? 0.6 : 1 }}>
              <div onClick={() => toggle(t.id)} style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${t.done ? C.green : C.border}`, backgroundColor: t.done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                {t.done && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}
              </div>
              <Badge text={t.category} color={C.primary} bg={C.primaryLight} />
              <Badge text={t.priority} color={pc.color} bg={pc.bg} />
              <span style={{ flex: 1, fontSize: 14, textDecoration: t.done ? "line-through" : "none", color: t.done ? C.muted : C.ink }}>{t.text}</span>
              {t.dueDate && (
                <span style={{ fontSize: 12, fontWeight: 600, color: dl !== null && dl <= 1 && !t.done ? C.red : C.muted }}>
                  {formatDate(t.dueDate)}{dl !== null && !t.done && dl <= 3 && ` (D-${dl})`}
                </span>
              )}
              <button style={S.btnRed} onClick={() => remove(t.id)}>삭제</button>
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
  const [page, setPage] = useState("dashboard");
  const [employees, setEmployees] = useState(() => load("hr-employees", []));
  const [candidates, setCandidates] = useState(() => load("hr-candidates", []));
  const [todos] = useState(() => load("hr-todos", []));

  const nav = [
    { id: "dashboard", label: "대시보드", icon: "🏠" },
    { id: "employees", label: "직원 관리", icon: "👥" },
    { id: "recruiting", label: "채용 관리", icon: "📋" },
    { id: "onboarding", label: "온보딩", icon: "✅" },
    { id: "todo", label: "업무 Todo", icon: "📌" },
  ];

  return (
    <div style={{ ...S.page, display: "flex" }}>
      {/* 사이드바 */}
      <div style={{ width: 220, minHeight: "100vh", backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, padding: "0", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>HR SYSTEM</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>인사 업무 관리</div>
        </div>
        <div style={{ padding: "12px" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: page === n.id ? 700 : 400, backgroundColor: page === n.id ? C.primaryLight : "transparent", color: page === n.id ? C.primary : C.ink, marginBottom: 2, fontFamily: "inherit" }}>
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: "20px", position: "absolute", bottom: 0, fontSize: 11, color: C.muted }}>
          직원 {employees.length}명 · 지원자 {candidates.length}명
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxHeight: "100vh" }}>
        {page === "dashboard" && <Dashboard employees={employees} todos={todos} candidates={candidates} />}
        {page === "employees" && <EmployeeManager employees={employees} setEmployees={setEmployees} />}
        {page === "recruiting" && <RecruitManager candidates={candidates} setCandidates={setCandidates} />}
        {page === "onboarding" && <OnboardingManager employees={employees} />}
        {page === "todo" && <TodoManager />}
      </div>
    </div>
  );
}
