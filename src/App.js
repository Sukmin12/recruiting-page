import { useState, useEffect } from "react";

// ─── 데이터 저장소 키 ───────────────────────────────────────────────────
const STORAGE_KEY = "recruiting-page-data";

// ─── 기본값 ────────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  company: {
    name: "",
    tagline: "",
    description: "",
    culture: "",
    website: "",
    logoText: "",
  },
  positions: [],
  process: {
    steps: ["서류 검토", "전화 스크리닝", "1차 면접", "2차 면접", "처우 협의 및 오퍼"],
    duration: "",
  },
  offer: {
    salary: "",
    benefits: "",
    extra: "",
  },
};

// ─── 색상 토큰 ─────────────────────────────────────────────────────────
const C = {
  bg: "#F7F6F3",
  surface: "#FFFFFF",
  ink: "#1A1A1A",
  muted: "#6B6B6B",
  accent: "#2D5BE3",
  accentLight: "#EEF2FF",
  border: "#E4E2DC",
  tag: "#F0EDE6",
};

// ─── 공통 스타일 헬퍼 ──────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", backgroundColor: C.bg, fontFamily: "'Inter', 'Apple SD Gothic Neo', sans-serif", color: C.ink },
  card: { backgroundColor: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "24px" },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" },
  input: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 15, color: C.ink, backgroundColor: C.surface, outline: "none", transition: "border-color 0.15s" },
  textarea: { width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 15, color: C.ink, backgroundColor: C.surface, resize: "vertical", outline: "none" },
  btn: { backgroundColor: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "0.01em" },
  btnOutline: { backgroundColor: "transparent", color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: 8, padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnGhost: { backgroundColor: "transparent", color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" },
};

// ═══════════════════════════════════════════════════════════════════════
//  ADMIN — 관리자 편집 화면
// ═══════════════════════════════════════════════════════════════════════
function AdminPage({ data, onSave }) {
  const [d, setD] = useState(JSON.parse(JSON.stringify(data)));
  const [tab, setTab] = useState("company");
  const [saved, setSaved] = useState(false);
  const [newPos, setNewPos] = useState({ title: "", team: "", type: "", description: "", requirements: "", preferred: "" });
  const [addingPos, setAddingPos] = useState(false);

  const set = (section, field, value) => setD(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  const setProcess = (i, val) => setD(prev => { const s = [...prev.process.steps]; s[i] = val; return { ...prev, process: { ...prev.process, steps: s } }; });
  const addStep = () => setD(prev => ({ ...prev, process: { ...prev.process, steps: [...prev.process.steps, ""] } }));
  const removeStep = (i) => setD(prev => { const s = prev.process.steps.filter((_, idx) => idx !== i); return { ...prev, process: { ...prev.process, steps: s } }; });
  const addPosition = () => { if (!newPos.title) return; setD(prev => ({ ...prev, positions: [...prev.positions, { ...newPos, id: Date.now() }] })); setNewPos({ title: "", team: "", type: "", description: "", requirements: "", preferred: "" }); setAddingPos(false); };
  const removePos = (id) => setD(prev => ({ ...prev, positions: prev.positions.filter(p => p.id !== id) }));

  const handleSave = () => { onSave(d); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const tabs = [
    { id: "company", label: "🏢 회사 소개" },
    { id: "positions", label: "📋 채용 포지션" },
    { id: "process", label: "🔄 면접 프로세스" },
    { id: "offer", label: "💰 처우 기준" },
  ];

  return (
    <div style={{ ...S.page, display: "flex" }}>
      {/* 사이드바 */}
      <div style={{ width: 220, minHeight: "100vh", backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, padding: "32px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>ADMIN</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>채용 페이지 편집</div>
        </div>
        <div style={{ padding: "16px 12px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: tab === t.id ? 600 : 400, backgroundColor: tab === t.id ? C.accentLight : "transparent", color: tab === t.id ? C.accent : C.ink, marginBottom: 2 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, padding: "40px 48px", maxWidth: 720 }}>
        {/* 회사 소개 */}
        {tab === "company" && (
          <div>
            <h2 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700 }}>회사 소개</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[["name", "회사 이름 *"], ["logoText", "로고 텍스트 (약자)"], ["tagline", "한 줄 소개"], ["website", "웹사이트 URL"]].map(([f, l]) => (
                <div key={f}>
                  <label style={S.label}>{l}</label>
                  <input style={S.input} value={d.company[f]} onChange={e => set("company", f, e.target.value)} placeholder={l} />
                </div>
              ))}
              <div>
                <label style={S.label}>회사 소개 (상세)</label>
                <textarea style={{ ...S.textarea, minHeight: 120 }} value={d.company.description} onChange={e => set("company", "description", e.target.value)} placeholder="회사의 미션, 비전, 사업 내용을 작성하세요." />
              </div>
              <div>
                <label style={S.label}>회사 문화 / 핵심 가치</label>
                <textarea style={{ ...S.textarea, minHeight: 100 }} value={d.company.culture} onChange={e => set("company", "culture", e.target.value)} placeholder="팀 문화, 일하는 방식, 중요하게 여기는 가치를 작성하세요." />
              </div>
            </div>
          </div>
        )}

        {/* 채용 포지션 */}
        {tab === "positions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>채용 포지션</h2>
              <button style={S.btn} onClick={() => setAddingPos(true)}>+ 포지션 추가</button>
            </div>
            {d.positions.length === 0 && !addingPos && (
              <div style={{ ...S.card, textAlign: "center", padding: "48px", color: C.muted }}>
                아직 등록된 포지션이 없어요.<br />위 버튼을 눌러 추가해보세요.
              </div>
            )}
            {d.positions.map(p => (
              <div key={p.id} style={{ ...S.card, marginBottom: 16, position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{p.title}</div>
                    <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{p.team} · {p.type}</div>
                  </div>
                  <button onClick={() => removePos(p.id)} style={{ ...S.btnGhost, color: "#E53E3E", borderColor: "#FED7D7", fontSize: 12, padding: "5px 12px" }}>삭제</button>
                </div>
              </div>
            ))}
            {addingPos && (
              <div style={{ ...S.card, marginTop: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>새 포지션 추가</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {[["title", "직무명 *"], ["team", "팀 / 부서"], ["type", "고용 형태 (정규직/계약직)"]].map(([f, l]) => (
                    <div key={f} style={f === "title" ? { gridColumn: "1/-1" } : {}}>
                      <label style={S.label}>{l}</label>
                      <input style={S.input} value={newPos[f]} onChange={e => setNewPos(p => ({ ...p, [f]: e.target.value }))} placeholder={l} />
                    </div>
                  ))}
                </div>
                {[["description", "직무 소개"], ["requirements", "자격 요건"], ["preferred", "우대 사항"]].map(([f, l]) => (
                  <div key={f} style={{ marginBottom: 16 }}>
                    <label style={S.label}>{l}</label>
                    <textarea style={{ ...S.textarea, minHeight: 80 }} value={newPos[f]} onChange={e => setNewPos(p => ({ ...p, [f]: e.target.value }))} placeholder={l} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={S.btn} onClick={addPosition}>저장</button>
                  <button style={S.btnGhost} onClick={() => setAddingPos(false)}>취소</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 면접 프로세스 */}
        {tab === "process" && (
          <div>
            <h2 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700 }}>면접 프로세스</h2>
            <div style={{ marginBottom: 24 }}>
              <label style={S.label}>전체 소요 기간</label>
              <input style={S.input} value={d.process.duration} onChange={e => set("process", "duration", e.target.value)} placeholder="예: 지원 후 2~3주 이내" />
            </div>
            <label style={S.label}>단계별 프로세스</label>
            {d.process.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <input style={{ ...S.input }} value={s} onChange={e => setProcess(i, e.target.value)} placeholder={`${i + 1}단계`} />
                <button onClick={() => removeStep(i)} style={{ ...S.btnGhost, padding: "8px 12px", flexShrink: 0 }}>×</button>
              </div>
            ))}
            <button style={{ ...S.btnGhost, marginTop: 8 }} onClick={addStep}>+ 단계 추가</button>
          </div>
        )}

        {/* 처우 기준 */}
        {tab === "offer" && (
          <div>
            <h2 style={{ margin: "0 0 24px", fontSize: 22, fontWeight: 700 }}>처우 기준</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={S.label}>연봉 / 급여 정책</label>
                <textarea style={{ ...S.textarea, minHeight: 90 }} value={d.offer.salary} onChange={e => set("offer", "salary", e.target.value)} placeholder="예: 경력 및 역량에 따라 협의. 전 직장 대비 최소 10% 이상 보장." />
              </div>
              <div>
                <label style={S.label}>복리후생</label>
                <textarea style={{ ...S.textarea, minHeight: 120 }} value={d.offer.benefits} onChange={e => set("offer", "benefits", e.target.value)} placeholder="예: 유연근무제, 재택근무 주 2회, 교육비 지원, 스톡옵션 등" />
              </div>
              <div>
                <label style={S.label}>기타 안내</label>
                <textarea style={{ ...S.textarea, minHeight: 80 }} value={d.offer.extra} onChange={e => set("offer", "extra", e.target.value)} placeholder="입사일 조율, 수습 기간 등 추가 안내" />
              </div>
            </div>
          </div>
        )}

        {/* 저장 버튼 */}
        <div style={{ marginTop: 36, paddingTop: 24, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16 }}>
          <button style={{ ...S.btn, padding: "12px 32px", fontSize: 15 }} onClick={handleSave}>변경사항 저장</button>
          {saved && <span style={{ color: "#38A169", fontWeight: 600, fontSize: 14 }}>✓ 저장되었습니다</span>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  APPLY FORM — 지원 폼 모달
// ═══════════════════════════════════════════════════════════════════════
// ⚠️ 여기에 본인의 Apps Script URL 붙여넣기
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbz2-vOTwX-EEKYNtwM4gwsXpzRaZSm0tXp9mNqTIpVu11mYBmJ1HhWeVj3EwH4qt_Aq/exec";

function ApplyModal({ position, companyName, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", currentCompany: "", experience: "", portfolio: "", motivation: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const handleSubmit = async () => {
    if (!form.name || !form.email) return;
    setLoading(true);
    setError("");
    try {
      await fetch(SHEETS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, position: position.title }),
      });
      setSubmitted(true);
    } catch (e) {
      setError("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ backgroundColor: C.surface, borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: "36px 40px" }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>지원이 완료되었습니다</div>
            <div style={{ color: C.muted, lineHeight: 1.7, marginBottom: 28 }}>
              <strong>{form.name}</strong>님, <strong>{position.title}</strong> 포지션에 지원해주셔서 감사합니다.<br />
              검토 후 <strong>{form.email}</strong>로 연락드리겠습니다.
            </div>
            <button style={S.btn} onClick={onClose}>닫기</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 6 }}>{companyName}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{position.title} 지원하기</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={S.label}>이름 *</label>
                  <input style={S.input} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="홍길동" />
                </div>
                <div>
                  <label style={S.label}>연락처</label>
                  <input style={S.input} value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="010-0000-0000" />
                </div>
              </div>
              <div>
                <label style={S.label}>이메일 *</label>
                <input style={S.input} value={form.email} onChange={e => setF("email", e.target.value)} placeholder="email@example.com" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={S.label}>현재 재직 중인 회사</label>
                  <input style={S.input} value={form.currentCompany} onChange={e => setF("currentCompany", e.target.value)} placeholder="회사명 (없으면 공란)" />
                </div>
                <div>
                  <label style={S.label}>총 경력</label>
                  <input style={S.input} value={form.experience} onChange={e => setF("experience", e.target.value)} placeholder="예: 5년 3개월" />
                </div>
              </div>
              <div>
                <label style={S.label}>포트폴리오 / 링크드인 / GitHub</label>
                <input style={S.input} value={form.portfolio} onChange={e => setF("portfolio", e.target.value)} placeholder="https://" />
              </div>
              <div>
                <label style={S.label}>지원 동기</label>
                <textarea style={{ ...S.textarea, minHeight: 100 }} value={form.motivation} onChange={e => setF("motivation", e.target.value)} placeholder="이 포지션에 지원하게 된 이유와 본인의 강점을 간략히 적어주세요." />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              {error && <div style={{ color: "#E53E3E", fontSize: 13, marginBottom: 8 }}>{error}</div>}
              <button style={{ ...S.btn, flex: 1, padding: "13px" }} onClick={handleSubmit} disabled={loading}>
                {loading ? "제출 중..." : "지원서 제출"}
              </button>
              <button style={{ ...S.btnGhost, padding: "13px 20px" }} onClick={onClose}>취소</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  PUBLIC — 지원자 채용 페이지
// ═══════════════════════════════════════════════════════════════════════
function PublicPage({ data, onAdminClick }) {
  const { company, positions, process, offer } = data;
  const [selected, setSelected] = useState(null);
  const [applyPos, setApplyPos] = useState(null);
  const isEmpty = !company.name;

  return (
    <div style={S.page}>
      {/* 네브바 */}
      <nav style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: C.accent }}>
          {company.logoText || company.name || "Company"}
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 14, fontWeight: 500, color: C.muted }}>
          <a href="#about" style={{ textDecoration: "none", color: "inherit" }}>회사 소개</a>
          <a href="#positions" style={{ textDecoration: "none", color: "inherit" }}>채용 공고</a>
          <a href="#process" style={{ textDecoration: "none", color: "inherit" }}>프로세스</a>
        </div>
        <button style={{ ...S.btnGhost, fontSize: 12 }} onClick={onAdminClick}>⚙ 관리자</button>
      </nav>

      {isEmpty ? (
        <div style={{ textAlign: "center", padding: "120px 24px", color: C.muted }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🏗</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 12 }}>채용 페이지를 준비 중입니다</div>
          <div style={{ marginBottom: 28 }}>관리자 모드에서 회사 정보를 입력해주세요.</div>
          <button style={S.btn} onClick={onAdminClick}>관리자 모드로 이동</button>
        </div>
      ) : (
        <>
          {/* 히어로 */}
          <section style={{ background: `linear-gradient(135deg, ${C.accentLight} 0%, ${C.bg} 60%)`, padding: "80px 40px 72px", textAlign: "center" }}>
            <div style={{ display: "inline-block", backgroundColor: C.accent, color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", padding: "5px 14px", borderRadius: 20, marginBottom: 20, textTransform: "uppercase" }}>
              We're Hiring
            </div>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {company.name}
            </h1>
            {company.tagline && (
              <p style={{ fontSize: 20, color: C.muted, maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.6 }}>{company.tagline}</p>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="#positions" style={{ ...S.btn, textDecoration: "none", padding: "13px 32px", fontSize: 15 }}>열린 포지션 보기 →</a>
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" style={{ ...S.btnOutline, textDecoration: "none", padding: "12px 28px", fontSize: 15 }}>웹사이트 방문</a>
              )}
            </div>
          </section>

          {/* 회사 소개 */}
          <section id="about" style={{ padding: "72px 40px", maxWidth: 960, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
              {company.description && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>About</div>
                  <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>우리는 이런 회사입니다</h2>
                  <p style={{ color: C.muted, lineHeight: 1.8, fontSize: 15 }}>{company.description}</p>
                </div>
              )}
              {company.culture && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Culture</div>
                  <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>우리의 문화</h2>
                  <p style={{ color: C.muted, lineHeight: 1.8, fontSize: 15 }}>{company.culture}</p>
                </div>
              )}
            </div>
          </section>

          {/* 채용 포지션 */}
          <section id="positions" style={{ backgroundColor: C.surface, padding: "72px 40px" }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Open Roles</div>
              <h2 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 40px", letterSpacing: "-0.02em" }}>채용 중인 포지션</h2>
              {positions.length === 0 ? (
                <div style={{ color: C.muted, textAlign: "center", padding: "40px" }}>현재 채용 중인 포지션이 없습니다.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {positions.map(p => (
                    <div key={p.id}>
                      <div onClick={() => setSelected(selected === p.id ? null : p.id)}
                        style={{ ...S.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "box-shadow 0.15s", boxShadow: selected === p.id ? "0 4px 20px rgba(45,91,227,0.1)" : "none", borderColor: selected === p.id ? C.accent : C.border }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 17 }}>{p.title}</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                            {p.team && <span style={{ backgroundColor: C.tag, color: C.muted, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 6 }}>{p.team}</span>}
                            {p.type && <span style={{ backgroundColor: C.accentLight, color: C.accent, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 6 }}>{p.type}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <button onClick={e => { e.stopPropagation(); setApplyPos(p); }} style={S.btn}>지원하기</button>
                          <span style={{ color: C.muted, fontSize: 18 }}>{selected === p.id ? "▲" : "▼"}</span>
                        </div>
                      </div>
                      {selected === p.id && (
                        <div style={{ border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "24px 28px", backgroundColor: C.surface }}>
                          {p.description && <div style={{ marginBottom: 20 }}><div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>직무 소개</div><p style={{ margin: 0, lineHeight: 1.8, color: C.ink }}>{p.description}</p></div>}
                          {p.requirements && <div style={{ marginBottom: 20 }}><div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>자격 요건</div><p style={{ margin: 0, lineHeight: 1.8, whiteSpace: "pre-line", color: C.ink }}>{p.requirements}</p></div>}
                          {p.preferred && <div><div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>우대 사항</div><p style={{ margin: 0, lineHeight: 1.8, whiteSpace: "pre-line", color: C.ink }}>{p.preferred}</p></div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 면접 프로세스 */}
          <section id="process" style={{ padding: "72px 40px" }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Process</div>
              <h2 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>채용 프로세스</h2>
              {process.duration && <p style={{ color: C.muted, marginBottom: 40, fontSize: 15 }}>⏱ {process.duration}</p>}
              <div style={{ display: "flex", gap: 0, overflowX: "auto", paddingBottom: 8 }}>
                {process.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: C.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, margin: "0 auto 10px" }}>{i + 1}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, maxWidth: 90, textAlign: "center", lineHeight: 1.4 }}>{step}</div>
                    </div>
                    {i < process.steps.length - 1 && <div style={{ width: 40, height: 2, backgroundColor: C.border, margin: "0 4px", marginBottom: 24, flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 처우 기준 */}
          {(offer.salary || offer.benefits) && (
            <section style={{ backgroundColor: C.surface, padding: "72px 40px" }}>
              <div style={{ maxWidth: 960, margin: "0 auto" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Compensation</div>
                <h2 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 40px", letterSpacing: "-0.02em" }}>처우 및 복리후생</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                  {offer.salary && <div style={{ ...S.card }}>
                    <div style={{ fontSize: 20, marginBottom: 12 }}>💰</div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>급여 정책</div>
                    <p style={{ color: C.muted, lineHeight: 1.8, margin: 0, fontSize: 14 }}>{offer.salary}</p>
                  </div>}
                  {offer.benefits && <div style={{ ...S.card }}>
                    <div style={{ fontSize: 20, marginBottom: 12 }}>🎁</div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>복리후생</div>
                    <p style={{ color: C.muted, lineHeight: 1.8, margin: 0, fontSize: 14, whiteSpace: "pre-line" }}>{offer.benefits}</p>
                  </div>}
                  {offer.extra && <div style={{ ...S.card, gridColumn: "1/-1" }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>📌 기타 안내</div>
                    <p style={{ color: C.muted, lineHeight: 1.8, margin: 0, fontSize: 14 }}>{offer.extra}</p>
                  </div>}
                </div>
              </div>
            </section>
          )}

          {/* 푸터 */}
          <footer style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: 13, borderTop: `1px solid ${C.border}` }}>
            © {new Date().getFullYear()} {company.name}. All rights reserved.
          </footer>
        </>
      )}

      {applyPos && <ApplyModal position={applyPos} companyName={company.name} onClose={() => setApplyPos(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  APP ROOT
// ═══════════════════════════════════════════════════════════════════════
export default function App() {
  const [mode, setMode] = useState("public"); // "public" | "admin"
  const [data, setData] = useState(DEFAULT_DATA);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setData(JSON.parse(stored));
    } catch {}
  }, []);

  const handleSave = (newData) => {
    setData(newData);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newData)); } catch {}
    setMode("public");
  };

  if (mode === "admin") return <AdminPage data={data} onSave={handleSave} />;
  return <PublicPage data={data} onAdminClick={() => setMode("admin")} />;
}
