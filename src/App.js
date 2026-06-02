import { useState, useRef } from "react";

// ── Defaults ─────────────────────────────────────────────────────────────────
const D_BUDGET  = 25000;
const D_DAILY   = 1500;
const D_ITEMS   = [
  { id:1, label:"朝食（家）",      icon:"🌅", amount:2100, color:"#f97316", note:"¥70 × 30日" },
  { id:2, label:"弁当（夜の残り）",icon:"🍱", amount:3300, color:"#10b981", note:"¥150 × 22日" },
  { id:3, label:"夕食（家）",      icon:"🌙", amount:6900, color:"#0ea5e9", note:"¥230 × 30日" },
  { id:4, label:"ランチ外食",      icon:"🍜", amount:6400, color:"#8b5cf6", note:"¥800 × 8回" },
  { id:5, label:"夕食外食",        icon:"🍣", amount:3000, color:"#ec4899", note:"¥1,500 × 2回" },
  { id:6, label:"サプリ",          icon:"💊", amount:1500, color:"#f59e0b", note:"月額目安" },
];
const D_DINNERS = [
  { id:1, name:"鶏むね塩麹焼き定食",emoji:"🐔",main:"鶏むね肉100g（塩麹漬け）",sides:["冷凍ブロッコリー蒸し","豆腐のみそ汁"],protein:42,cost:210,tip:"塩麹に漬けると柔らかく仕上がる。翌日弁当に◎",color:"#10b981" },
  { id:2, name:"鯖缶大根おろし定食",emoji:"🐟",main:"鯖水煮缶1缶",sides:["大根おろし","もやしナムル","わかめスープ"],protein:28,cost:160,tip:"鯖缶の汁もスープに使えばDHA丸ごと摂れる",color:"#0ea5e9" },
  { id:3, name:"豆腐チャンプルー",  emoji:"🥚",main:"木綿豆腐1丁＋卵2個＋もやし",sides:["小松菜ごま和え"],protein:30,cost:140,tip:"卵でとじるとボリューム感アップ。醤油少なめで",color:"#8b5cf6" },
  { id:4, name:"鶏むね蒸しサラダ",  emoji:"🥗",main:"鶏むね肉100g（茹でてほぐす）",sides:["レタス・アボカド","きのこスープ"],protein:38,cost:200,tip:"ポン酢＋ごま油で味付け。食べ応え◎",color:"#f97316" },
  { id:5, name:"豚もも生姜炒め",    emoji:"🥩",main:"豚もも肉80g（生姜・醤油少なめ）",sides:["ほうれん草炒め","豆腐スープ"],protein:28,cost:230,tip:"豚もも＝脂少なめ。週1〜2回まで",color:"#ec4899" },
  { id:6, name:"具だくさん卵スープ",emoji:"🍲",main:"卵2個＋鶏むね50g",sides:["きのこ・豆腐・わかめスープ","ほうれん草炒め"],protein:26,cost:130,tip:"具を多くすれば満腹感◎。節約デーに最適",color:"#f59e0b" },
];
const D_FIXED   = [
  { id:1, name:"家賃",   amount:65000, dueDate:25, color:"#0ea5e9" },
  { id:2, name:"電気代", amount:5000,  dueDate:28, color:"#f59e0b" },
  { id:3, name:"スマホ", amount:3000,  dueDate:1,  color:"#8b5cf6" },
];
const D_MEALS   = { breakfast:"", lunch:"", dinner:"" };
const D_COMMENT = "今月も節約がんばろう！";

const TAG_PALETTE = ["#0ea5e9","#10b981","#f97316","#8b5cf6","#ec4899","#f59e0b","#ef4444","#06b6d4"];

// ── LocalStorage hook ─────────────────────────────────────────────────────────
function useLS(key, def) {
  const [v, sv] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; }
    catch { return def; }
  });
  const set = x => {
    const nv = typeof x === "function" ? x(v) : x;
    sv(nv);
    try { localStorage.setItem(key, JSON.stringify(nv)); } catch {}
  };
  return [v, set];
}

// ── CSV Parsing ───────────────────────────────────────────────────────────────
function parseCSVRow(line) {
  const res = []; let cur = ""; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) { res.push(cur); cur = ""; }
    else cur += ch;
  }
  res.push(cur);
  return res.map(s => s.trim().replace(/^"|"$/g, ""));
}

function parseMF(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const hdr = parseCSVRow(lines[0]);
  const idx  = k => hdr.findIndex(c => c.includes(k));
  const [di, ni, ai, bi, mi] = [idx("日付"), idx("内容"), idx("金額"), idx("大項目"), idx("中項目")];
  return lines.slice(1).flatMap((line, i) => {
    const r = parseCSVRow(line);
    if (r.length < 3) return [];
    const amt = parseInt((r[ai] ?? "").replace(/[^\d-]/g, ""), 10);
    if (isNaN(amt)) return [];
    return [{ id: i + 1, date: r[di] ?? "", name: r[ni] ?? "",
      amount: amt, category: r[bi] || "その他", sub: r[mi] || "", tags: [] }];
  });
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const card = {
  background:"#fff", borderRadius:16, padding:16, marginBottom:12,
  boxShadow:"0 2px 12px #0ea5e910", border:"1px solid #f1f5f9",
};
const gradBtn = (bg, extra = {}) => ({
  border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, color:"#fff",
  background: bg, padding:"9px 16px", fontSize:13, ...extra,
});

function Tag({ color, children, onRemove }) {
  return (
    <span style={{
      background: color + "22", color, fontSize:11, fontWeight:700,
      padding:"3px 10px", borderRadius:99,
      display:"inline-flex", alignItems:"center", gap:4,
    }}>
      {children}
      {onRemove && <span style={{ cursor:"pointer", opacity:.6 }} onClick={onRemove}>×</span>}
    </span>
  );
}

function NumInput({ value, onChange, color, width = 88 }) {
  return (
    <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
      style={{
        width, textAlign:"right", fontSize:15, fontWeight:800, color: color || "#0ea5e9",
        border:"none", borderBottom:`2px solid ${color || "#0ea5e9"}`,
        background:"transparent", outline:"none", padding:"2px 0",
      }} />
  );
}

function TextInput({ value, onChange, placeholder, style: extra = {} }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width:"100%", padding:"9px 12px", borderRadius:10,
        border:"1px solid #e2e8f0", fontSize:13, outline:"none",
        background:"#f8fafc", boxSizing:"border-box", fontFamily:"inherit", ...extra,
      }} />
  );
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  ["home",    "🏠", "ホーム"],
  ["finance", "💰", "収支"],
  ["budget",  "🍽", "食費"],
  ["dinner",  "🌙", "夕食"],
  ["settings","⚙️", "設定"],
];

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,        setTab]        = useState("home");
  const [editMode,   setEditMode]   = useState(false);
  const [openDinner, setOpenDinner] = useState(null);
  const [filterCat,  setFilterCat]  = useState("all");
  const [tagInput,   setTagInput]   = useState({});
  const fileRef = useRef();

  // Persisted state
  const [budget,     setBudget]     = useLS("budget",  D_BUDGET);
  const [daily,      setDaily]      = useLS("daily",   D_DAILY);
  const [items,      setItems]      = useLS("items",   D_ITEMS);
  const [dinners,    setDinners]    = useLS("dinners", D_DINNERS);
  const [fixedCosts, setFixedCosts] = useLS("fixed",   D_FIXED);
  const [meals,      setMeals]      = useLS("meals",   D_MEALS);
  const [comment,    setComment]    = useLS("comment", D_COMMENT);
  const [txns,       setTxns]       = useLS("txns",    []);

  // Finance computed
  const incomeTotal  = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenseTotal = txns.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const balance      = incomeTotal + expenseTotal;
  const categories   = [...new Set(txns.map(t => t.category))];
  const catTotals    = categories.map(cat => ({
    cat,
    total: txns.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0),
    count: txns.filter(t => t.category === cat).length,
  })).sort((a, b) => a.total - b.total);
  const allTags  = [...new Set(txns.flatMap(t => t.tags))];
  const tagTotals = allTags.map(tag => ({
    tag,
    total: txns.filter(t => t.tags.includes(tag)).reduce((s, t) => s + t.amount, 0),
    count: txns.filter(t => t.tags.includes(tag)).length,
  }));

  // Food budget computed
  const foodTotal = items.reduce((s, i) => s + i.amount, 0);
  const remaining = budget - foodTotal;
  const foodPct   = Math.min(100, (foodTotal / budget) * 100);
  const overBudget = remaining < 0;

  // Date helpers
  const today    = new Date();
  const todayDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - todayDay;
  const dateStr  = `${today.getFullYear()}年${today.getMonth() + 1}月${todayDay}日`;

  // Upcoming fixed (within 7 days)
  const upcoming = fixedCosts.filter(f => {
    const diff = f.dueDate >= todayDay ? f.dueDate - todayDay
      : daysInMonth - todayDay + f.dueDate;
    return diff <= 7;
  });

  // Handlers
  const handleCSV = e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setTxns(parseMF(ev.target.result));
    reader.readAsText(f, "UTF-8");
    e.target.value = "";
  };

  const addTag = (id, tag) => {
    if (!tag.trim()) return;
    setTxns(prev => prev.map(t =>
      t.id === id && !t.tags.includes(tag.trim())
        ? { ...t, tags: [...t.tags, tag.trim()] } : t
    ));
  };
  const removeTag = (id, tag) =>
    setTxns(prev => prev.map(t =>
      t.id === id ? { ...t, tags: t.tags.filter(x => x !== tag) } : t
    ));

  const updateItem   = (id, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, amount: val } : i));
  const updateDinner = (id, field, val) => setDinners(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));

  const updateFixed  = (id, field, val) =>
    setFixedCosts(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f));
  const addFixed  = () => setFixedCosts(prev => [...prev, {
    id: Date.now(), name:"新しい固定費", amount:0, dueDate:1,
    color: TAG_PALETTE[prev.length % TAG_PALETTE.length],
  }]);
  const delFixed  = id => setFixedCosts(prev => prev.filter(f => f.id !== id));

  return (
    <div style={{
      fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
      background:"#f0f9ff", minHeight:"100vh",
      padding:"16px 16px 80px", maxWidth:480, margin:"0 auto",
    }}>

      {/* ── ヘッダー ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{
            display:"inline-block", background:"linear-gradient(135deg,#bae6fd,#d1fae5)",
            borderRadius:50, padding:"3px 12px", fontSize:10, fontWeight:700,
            color:"#0369a1", letterSpacing:2, marginBottom:4,
          }}>OKANE & MEAL</div>
          <div style={{
            fontSize:22, fontWeight:900, letterSpacing:-0.5,
            background:"linear-gradient(90deg,#0ea5e9,#10b981)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>家計 × 食事管理</div>
        </div>
        {(tab === "budget" || tab === "dinner") && (
          <button onClick={() => setEditMode(e => !e)} style={gradBtn(
            editMode ? "linear-gradient(135deg,#f97316,#ec4899)" : "linear-gradient(135deg,#0ea5e9,#10b981)",
            { fontSize:12 }
          )}>
            {editMode ? "✅ 完了" : "✏️ 編集"}
          </button>
        )}
      </div>

      {/* ── タブバー ── */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4, marginBottom:18,
        background:"#fff", borderRadius:14, padding:4,
        boxShadow:"0 1px 8px #0ea5e918",
      }}>
        {TABS.map(([key, icon, label]) => (
          <button key={key} onClick={() => { setTab(key); setEditMode(false); }} style={{
            padding:"7px 2px", borderRadius:10, border:"none",
            background: tab === key ? "linear-gradient(135deg,#0ea5e9,#10b981)" : "transparent",
            color: tab === key ? "#fff" : "#94a3b8",
            fontSize:10, fontWeight: tab === key ? 700 : 500, cursor:"pointer", transition:"all .2s",
          }}>
            <div style={{ fontSize:18, lineHeight:1.2 }}>{icon}</div>
            <div style={{ marginTop:2 }}>{label}</div>
          </button>
        ))}
      </div>

      {/* ══════ ホーム ══════ */}
      {tab === "home" && (
        <div>
          {/* コメントバナー */}
          <div style={{
            background:"linear-gradient(135deg,#0ea5e9,#10b981)",
            borderRadius:18, padding:"16px 18px", marginBottom:14, color:"#fff",
          }}>
            <div style={{ fontSize:11, opacity:.75, marginBottom:6 }}>💬 今日のひとこと</div>
            <div style={{ fontSize:15, fontWeight:700, lineHeight:1.7 }}>{comment || "コメント未設定"}</div>
            <div style={{ fontSize:11, opacity:.65, marginTop:10 }}>
              {dateStr} ・ あと {daysLeft}日
            </div>
          </div>

          {/* 今日のメニュー */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:12 }}>🍽 今日のメニュー</div>
            {[["朝食","🌅", meals.breakfast],["昼食","🌞", meals.lunch],["夕食","🌙", meals.dinner]].map(([label, icon, val]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{
                  width:34, height:34, borderRadius:9, background:"#f0f9ff",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0,
                }}>{icon}</div>
                <div>
                  <div style={{ fontSize:10, color:"#94a3b8", marginBottom:1 }}>{label}</div>
                  <div style={{ fontSize:14, fontWeight:600, color: val ? "#1e293b" : "#cbd5e1" }}>
                    {val || "未設定"}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ fontSize:10, color:"#94a3b8", textAlign:"right", marginTop:4 }}>
              ※ 設定タブから編集できます
            </div>
          </div>

          {/* 予算サマリー */}
          <div style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:12 }}>💴 予算サマリー</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div style={{ background:"#f0f9ff", borderRadius:12, padding:12 }}>
                <div style={{ fontSize:10, color:"#94a3b8", marginBottom:3 }}>1日の予算</div>
                <div style={{ fontSize:22, fontWeight:900, color:"#0ea5e9" }}>¥{daily.toLocaleString()}</div>
              </div>
              <div style={{ background:"#f0fdf4", borderRadius:12, padding:12 }}>
                <div style={{ fontSize:10, color:"#94a3b8", marginBottom:3 }}>今月の食費予算</div>
                <div style={{ fontSize:22, fontWeight:900, color:"#10b981" }}>¥{budget.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:6, display:"flex", justifyContent:"space-between" }}>
              <span>食費計画 {foodPct.toFixed(0)}%</span>
              <span style={{ color: overBudget ? "#ef4444" : "#10b981", fontWeight:700 }}>
                {overBudget ? `-¥${Math.abs(remaining).toLocaleString()} 超過` : `残 +¥${remaining.toLocaleString()}`}
              </span>
            </div>
            <div style={{ background:"#f0f9ff", borderRadius:99, height:9, overflow:"hidden" }}>
              <div style={{
                height:"100%", width:`${foodPct}%`,
                background: overBudget
                  ? "linear-gradient(90deg,#f97316,#ef4444)"
                  : "linear-gradient(90deg,#0ea5e9,#10b981)",
                borderRadius:99, transition:"width .4s",
              }} />
            </div>
          </div>

          {/* 固定費 */}
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>📌 今月の固定費</div>
              {upcoming.length > 0 && (
                <span style={{
                  background:"#fef3c7", color:"#d97706", fontSize:10, fontWeight:700,
                  padding:"3px 10px", borderRadius:99,
                }}>⚠ {upcoming.length}件まもなく</span>
              )}
            </div>
            {fixedCosts.length === 0 ? (
              <div style={{ fontSize:12, color:"#cbd5e1", textAlign:"center", padding:"12px 0" }}>
                設定タブで固定費を追加できます
              </div>
            ) : (
              <>
                {fixedCosts.map(f => {
                  const diff = f.dueDate >= todayDay ? f.dueDate - todayDay
                    : daysInMonth - todayDay + f.dueDate;
                  const soon = diff <= 7;
                  return (
                    <div key={f.id} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"10px 12px", borderRadius:10, marginBottom:6,
                      background: soon ? f.color + "12" : "#f8fafc",
                      border: soon ? `1px solid ${f.color}40` : "1px solid #f1f5f9",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:99, background:f.color, flexShrink:0 }} />
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{f.name}</div>
                          {soon && (
                            <div style={{ fontSize:10, color:f.color, fontWeight:700 }}>
                              {diff === 0 ? "今日！" : `あと${diff}日`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:16, fontWeight:800, color:f.color }}>¥{f.amount.toLocaleString()}</div>
                        <div style={{ fontSize:10, color:"#94a3b8" }}>毎月{f.dueDate}日</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{
                  display:"flex", justifyContent:"space-between",
                  borderTop:"1px solid #f1f5f9", paddingTop:10, marginTop:4,
                }}>
                  <div style={{ fontSize:12, color:"#94a3b8", fontWeight:600 }}>月間固定費合計</div>
                  <div style={{ fontSize:17, fontWeight:900, color:"#334155" }}>
                    ¥{fixedCosts.reduce((s, f) => s + f.amount, 0).toLocaleString()}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════ 収支タブ ══════ */}
      {tab === "finance" && (
        <div>
          {/* CSVインポート */}
          <div style={{ ...card, background:"linear-gradient(135deg,#f0fdf4,#f0f9ff)" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:6 }}>
              📂 MoneyForward CSV インポート
            </div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:12, lineHeight:1.7 }}>
              MoneyForward MEのCSVエクスポートを読み込みます。<br />
              「日付・内容・金額・大項目・中項目」列に対応しています。
            </div>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} style={{ display:"none" }} />
            <button onClick={() => fileRef.current?.click()}
              style={gradBtn("linear-gradient(135deg,#0ea5e9,#10b981)", { width:"100%", padding:"11px 0" })}>
              📂 CSVファイルを選択
            </button>
            {txns.length > 0 && (
              <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:"#64748b" }}>{txns.length}件読み込み済み</span>
                <button onClick={() => setTxns([])} style={{
                  fontSize:11, color:"#ef4444", background:"none", border:"none",
                  cursor:"pointer", fontWeight:600,
                }}>クリア</button>
              </div>
            )}
          </div>

          {txns.length > 0 && <>
            {/* 収支サマリー */}
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:12 }}>📊 収支サマリー</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                <div style={{ background:"#f0fdf4", borderRadius:12, padding:12 }}>
                  <div style={{ fontSize:10, color:"#94a3b8" }}>収入合計</div>
                  <div style={{ fontSize:20, fontWeight:900, color:"#10b981" }}>+¥{incomeTotal.toLocaleString()}</div>
                </div>
                <div style={{ background:"#fff1f2", borderRadius:12, padding:12 }}>
                  <div style={{ fontSize:10, color:"#94a3b8" }}>支出合計</div>
                  <div style={{ fontSize:20, fontWeight:900, color:"#ef4444" }}>-¥{Math.abs(expenseTotal).toLocaleString()}</div>
                </div>
              </div>
              <div style={{
                background: balance >= 0 ? "#f0fdf4" : "#fff1f2",
                borderRadius:12, padding:12, textAlign:"center",
              }}>
                <div style={{ fontSize:11, color:"#94a3b8", marginBottom:2 }}>収支差額</div>
                <div style={{ fontSize:26, fontWeight:900, color: balance >= 0 ? "#10b981" : "#ef4444" }}>
                  {balance >= 0 ? "+" : ""}¥{balance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* カテゴリ別集計 */}
            <div style={card}>
              <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:12 }}>📂 カテゴリ別集計</div>
              {catTotals.map(({ cat, total, count }) => (
                <div key={cat} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"9px 10px", borderRadius:9, marginBottom:6, background:"#f8fafc",
                }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{cat}</div>
                    <div style={{ fontSize:10, color:"#94a3b8" }}>{count}件</div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:800, color: total >= 0 ? "#10b981" : "#ef4444" }}>
                    {total >= 0 ? "+" : ""}¥{Math.abs(total).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* タグ別集計 */}
            {allTags.length > 0 && (
              <div style={card}>
                <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:12 }}>🏷 タグ別集計</div>
                {tagTotals.map(({ tag, total, count }, i) => (
                  <div key={tag} style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"9px 10px", borderRadius:9, marginBottom:6, background:"#f8fafc",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <Tag color={TAG_PALETTE[i % TAG_PALETTE.length]}>{tag}</Tag>
                      <span style={{ fontSize:10, color:"#94a3b8" }}>{count}件</span>
                    </div>
                    <div style={{ fontSize:15, fontWeight:800, color: total >= 0 ? "#10b981" : "#ef4444" }}>
                      {total >= 0 ? "+" : ""}¥{Math.abs(total).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* カテゴリフィルター */}
            <div style={{ overflowX:"auto", display:"flex", gap:6, paddingBottom:8, marginBottom:4 }}>
              {["all", ...categories].map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)} style={{
                  flexShrink:0, padding:"6px 14px", borderRadius:99, border:"none", cursor:"pointer",
                  background: filterCat === cat ? "#0ea5e9" : "#f1f5f9",
                  color: filterCat === cat ? "#fff" : "#64748b",
                  fontSize:12, fontWeight:700, whiteSpace:"nowrap",
                }}>{cat === "all" ? "すべて" : cat}</button>
              ))}
            </div>

            {/* 取引一覧 */}
            {txns
              .filter(t => filterCat === "all" || t.category === filterCat)
              .map(t => (
                <div key={t.id} style={{ ...card, padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div style={{ flex:1, minWidth:0, marginRight:8 }}>
                      <div style={{
                        fontSize:13, fontWeight:600, color:"#1e293b", marginBottom:2,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      }}>{t.name}</div>
                      <div style={{ fontSize:10, color:"#94a3b8" }}>{t.date} ・ {t.category}{t.sub ? ` / ${t.sub}` : ""}</div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:800, flexShrink:0, color: t.amount >= 0 ? "#10b981" : "#ef4444" }}>
                      {t.amount >= 0 ? "+" : ""}¥{Math.abs(t.amount).toLocaleString()}
                    </div>
                  </div>
                  {t.tags.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                      {t.tags.map(tag => (
                        <Tag key={tag} color={TAG_PALETTE[allTags.indexOf(tag) % TAG_PALETTE.length]}
                          onRemove={() => removeTag(t.id, tag)}>
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:6 }}>
                    <input
                      value={tagInput[t.id] || ""}
                      onChange={e => setTagInput(p => ({ ...p, [t.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          addTag(t.id, tagInput[t.id] || "");
                          setTagInput(p => ({ ...p, [t.id]: "" }));
                        }
                      }}
                      placeholder="タグを追加… (Enterで確定)"
                      style={{
                        flex:1, fontSize:11, padding:"6px 10px", borderRadius:8,
                        border:"1px solid #e2e8f0", background:"#f8fafc", outline:"none",
                        fontFamily:"inherit",
                      }}
                    />
                    <button onClick={() => {
                      addTag(t.id, tagInput[t.id] || "");
                      setTagInput(p => ({ ...p, [t.id]: "" }));
                    }} style={gradBtn("#0ea5e9", { fontSize:11, padding:"6px 12px" })}>
                      追加
                    </button>
                  </div>
                </div>
              ))
            }
          </>}
        </div>
      )}

      {/* ══════ 食費タブ ══════ */}
      {tab === "budget" && (
        <div>
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:11, color:"#94a3b8", marginBottom:2 }}>月合計</div>
                <div style={{ fontSize:28, fontWeight:900, color:"#0ea5e9", letterSpacing:-1 }}>
                  ¥{foodTotal.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"#94a3b8", marginBottom:2 }}>{overBudget ? "超過" : "残り"}</div>
                <div style={{ fontSize:22, fontWeight:800, color: overBudget ? "#ef4444" : "#10b981" }}>
                  {overBudget ? `-¥${Math.abs(remaining).toLocaleString()}` : `+¥${remaining.toLocaleString()}`}
                </div>
              </div>
            </div>
            <div style={{ background:"#f0f9ff", borderRadius:99, height:10, overflow:"hidden" }}>
              <div style={{
                height:"100%", width:`${foodPct}%`,
                background: overBudget
                  ? "linear-gradient(90deg,#f97316,#ef4444)"
                  : "linear-gradient(90deg,#0ea5e9,#10b981)",
                borderRadius:99, transition:"width .4s",
              }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#cbd5e1", marginTop:4 }}>
              <span>¥0</span>
              <span>
                {editMode ? (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:3 }}>
                    予算 ¥<input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))}
                      style={{
                        width:80, fontSize:11, fontWeight:700, color:"#0ea5e9",
                        border:"none", borderBottom:"1px solid #0ea5e9",
                        background:"transparent", outline:"none",
                      }} />
                  </span>
                ) : `予算 ¥${budget.toLocaleString()}`}
              </span>
            </div>
          </div>

          {items.map(item => (
            <div key={item.id} style={{
              display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
              background:"#fff", border:"1px solid #f1f5f9", borderRadius:12, marginBottom:8,
              boxShadow:"0 1px 4px #0ea5e908",
            }}>
              <div style={{
                width:38, height:38, borderRadius:10, background: item.color + "18",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, flexShrink:0,
              }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{item.label}</div>
                {!editMode
                  ? <div style={{ fontSize:11, color:"#94a3b8" }}>{item.note}</div>
                  : <input value={item.note}
                    onChange={e => setItems(prev => prev.map(i => i.id === item.id ? { ...i, note: e.target.value } : i))}
                    placeholder="メモ（任意）"
                    style={{
                      fontSize:11, color:"#94a3b8", border:"none",
                      borderBottom:"1px solid #cbd5e1", background:"transparent",
                      outline:"none", width:"100%", marginTop:2,
                    }} />
                }
              </div>
              {editMode ? (
                <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                  <span style={{ fontSize:14, color:item.color, fontWeight:700 }}>¥</span>
                  <NumInput value={item.amount} onChange={v => updateItem(item.id, v)} color={item.color} />
                </div>
              ) : (
                <div style={{ fontSize:17, fontWeight:800, color:item.color, flexShrink:0 }}>
                  ¥{item.amount.toLocaleString()}
                </div>
              )}
            </div>
          ))}

          {editMode && (
            <button onClick={() => { setItems(D_ITEMS); setBudget(D_BUDGET); }} style={{
              width:"100%", marginTop:8, padding:"10px 0",
              background:"#f8fafc", border:"1px dashed #cbd5e1",
              borderRadius:10, fontSize:12, color:"#94a3b8", cursor:"pointer", fontWeight:600,
            }}>↩ デフォルトに戻す</button>
          )}
        </div>
      )}

      {/* ══════ 夕食タブ ══════ */}
      {tab === "dinner" && (
        <div>
          {!editMode && (
            <div style={{ fontSize:12, color:"#94a3b8", marginBottom:14, textAlign:"center" }}>
              6パターンローテーション — タップで詳細表示
            </div>
          )}
          {editMode && (
            <div style={{
              background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10,
              padding:"10px 14px", marginBottom:14, fontSize:12, color:"#92400e",
            }}>✏️ 編集モード：コスト・タンパク質量を変更できます</div>
          )}

          {dinners.map((d, i) => (
            <div key={d.id} style={{ marginBottom:10 }}>
              <div onClick={() => !editMode && setOpenDinner(openDinner === i ? null : i)} style={{
                display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                background:"#fff",
                border: `1.5px solid ${openDinner === i ? d.color + "60" : "#f1f5f9"}`,
                borderRadius: openDinner === i ? "14px 14px 0 0" : 14,
                cursor: editMode ? "default" : "pointer",
                boxShadow: openDinner === i ? `0 2px 12px ${d.color}20` : "0 1px 4px #0ea5e908",
              }}>
                <div style={{
                  width:40, height:40, borderRadius:12, background: d.color + "18",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:20, flexShrink:0,
                }}>{d.emoji}</div>

                <div style={{ flex:1, minWidth:0 }}>
                  {editMode ? (
                    <input value={d.name} onChange={e => updateDinner(d.id, "name", e.target.value)}
                      style={{
                        fontSize:14, fontWeight:700, color:"#1e293b",
                        border:"none", borderBottom:"1.5px solid " + d.color,
                        background:"transparent", outline:"none", width:"100%",
                      }} />
                  ) : (
                    <div style={{ fontSize:14, fontWeight:700, color:"#1e293b", marginBottom:2 }}>{d.name}</div>
                  )}
                  <div style={{
                    fontSize:11, color:"#94a3b8", marginTop:2,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>{d.main}</div>
                </div>

                <div style={{ textAlign:"right", flexShrink:0 }}>
                  {editMode ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                        <span style={{ fontSize:11, color:"#94a3b8" }}>¥</span>
                        <input type="number" value={d.cost}
                          onChange={e => updateDinner(d.id, "cost", Number(e.target.value))}
                          style={{
                            width:58, textAlign:"right", fontSize:14, fontWeight:800,
                            color:d.color, border:"none", borderBottom:"1.5px solid " + d.color,
                            background:"transparent", outline:"none",
                          }} />
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                        <span style={{ fontSize:10, color:"#94a3b8" }}>P</span>
                        <input type="number" value={d.protein}
                          onChange={e => updateDinner(d.id, "protein", Number(e.target.value))}
                          style={{
                            width:40, textAlign:"right", fontSize:11, color:"#64748b",
                            border:"none", borderBottom:"1px solid #cbd5e1",
                            background:"transparent", outline:"none",
                          }} />
                        <span style={{ fontSize:10, color:"#94a3b8" }}>g</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize:15, fontWeight:800, color:d.color }}>¥{d.cost}</div>
                      <div style={{ fontSize:11, color:"#94a3b8" }}>P {d.protein}g</div>
                    </>
                  )}
                </div>
              </div>

              {!editMode && openDinner === i && (
                <div style={{
                  background:"#f8fafc",
                  border:`1.5px solid ${d.color}40`, borderTop:"none",
                  borderRadius:"0 0 14px 14px", padding:"14px 16px",
                }}>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, marginBottom:6, letterSpacing:1 }}>副菜</div>
                    {d.sides.map((s, j) => (
                      <div key={j} style={{ fontSize:13, color:"#475569", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ width:4, height:4, borderRadius:99, background:d.color, display:"inline-block", flexShrink:0 }} />
                        {s}
                      </div>
                    ))}
                  </div>
                  <div style={{
                    background:"#fff", borderRadius:10, padding:"10px 12px",
                    border:`1px solid ${d.color}30`, fontSize:12, color:"#64748b", lineHeight:1.7,
                  }}>
                    <span style={{ color:d.color, fontWeight:700 }}>💡 </span>{d.tip}
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                    <Tag color={d.color}>🥩 タンパク質 {d.protein}g</Tag>
                    <Tag color="#0369a1">糖質 低</Tag>
                  </div>
                </div>
              )}
            </div>
          ))}

          {editMode && (
            <button onClick={() => setDinners(D_DINNERS)} style={{
              width:"100%", marginTop:4, padding:"10px 0",
              background:"#f8fafc", border:"1px dashed #cbd5e1",
              borderRadius:10, fontSize:12, color:"#94a3b8", cursor:"pointer", fontWeight:600,
            }}>↩ デフォルトに戻す</button>
          )}

          {!editMode && (
            <div style={{
              background:"#f0fdf4", border:"1px solid #bbf7d0",
              borderRadius:14, padding:14, marginTop:4,
              fontSize:12, color:"#166534", lineHeight:1.9,
            }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>🍱 弁当化のコツ</div>
              夕食を少し多めに作って詰めるだけ。<br />
              鶏むね・鯖缶・卵は冷めても美味しい。<br />
              ドレッシングは別容器で持参すると◎
            </div>
          )}
        </div>
      )}

      {/* ══════ 設定タブ ══════ */}
      {tab === "settings" && (
        <div>
          {/* 今日のメニュー */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:14 }}>🍽 今日のメニュー</div>
            {[["breakfast","朝食 🌅"],["lunch","昼食 🌞"],["dinner","夕食 🌙"]].map(([key, label]) => (
              <div key={key} style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, color:"#94a3b8", display:"block", marginBottom:5 }}>{label}</label>
                <TextInput
                  value={meals[key]}
                  onChange={v => setMeals(p => ({ ...p, [key]: v }))}
                  placeholder="メニューを入力…"
                />
              </div>
            ))}
          </div>

          {/* 予算設定 */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:14 }}>💴 予算設定</div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:"#94a3b8", display:"block", marginBottom:5 }}>1日の予算</label>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:16, color:"#0ea5e9", fontWeight:700 }}>¥</span>
                <input type="number" value={daily} onChange={e => setDaily(Number(e.target.value))}
                  style={{
                    flex:1, padding:"9px 12px", borderRadius:10, border:"1px solid #e2e8f0",
                    fontSize:14, outline:"none", background:"#f8fafc",
                  }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, color:"#94a3b8", display:"block", marginBottom:5 }}>今月の食費予算</label>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:16, color:"#10b981", fontWeight:700 }}>¥</span>
                <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))}
                  style={{
                    flex:1, padding:"9px 12px", borderRadius:10, border:"1px solid #e2e8f0",
                    fontSize:14, outline:"none", background:"#f8fafc",
                  }} />
              </div>
            </div>
          </div>

          {/* コメント */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:10 }}>💬 一言コメント</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>ホーム画面に表示されます</div>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="ホームに表示するコメントを入力…" rows={3}
              style={{
                width:"100%", padding:"10px 12px", borderRadius:10,
                border:"1px solid #e2e8f0", fontSize:13, outline:"none",
                background:"#f8fafc", resize:"none", boxSizing:"border-box",
                lineHeight:1.7, fontFamily:"inherit",
              }} />
          </div>

          {/* 固定費 */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:14 }}>📌 固定費管理</div>
            {fixedCosts.map(f => (
              <div key={f.id} style={{
                display:"flex", alignItems:"center", gap:8, marginBottom:10,
                padding:"10px 12px", background:"#f8fafc", borderRadius:10,
                border:`1px solid ${f.color}30`,
              }}>
                <div style={{ width:10, height:10, borderRadius:99, background:f.color, flexShrink:0 }} />
                <input value={f.name} onChange={e => updateFixed(f.id, "name", e.target.value)}
                  style={{
                    flex:1, fontSize:13, fontWeight:600, border:"none",
                    borderBottom:"1px solid #e2e8f0", background:"transparent",
                    outline:"none", padding:"2px 4px", color:"#334155",
                    fontFamily:"inherit",
                  }} />
                <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                  <span style={{ fontSize:12, color:"#94a3b8" }}>¥</span>
                  <input type="number" value={f.amount} onChange={e => updateFixed(f.id, "amount", Number(e.target.value))}
                    style={{
                      width:76, textAlign:"right", fontSize:13, fontWeight:700,
                      color:f.color, border:"none", borderBottom:"1px solid #e2e8f0",
                      background:"transparent", outline:"none", padding:"2px 0",
                    }} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                  <input type="number" value={f.dueDate} min={1} max={31}
                    onChange={e => updateFixed(f.id, "dueDate", Number(e.target.value))}
                    style={{
                      width:32, textAlign:"center", fontSize:12, border:"none",
                      borderBottom:"1px solid #e2e8f0", background:"transparent",
                      outline:"none", padding:"2px 0", color:"#64748b",
                    }} />
                  <span style={{ fontSize:11, color:"#94a3b8" }}>日</span>
                </div>
                <button onClick={() => delFixed(f.id)} style={{
                  background:"none", border:"none", cursor:"pointer",
                  color:"#ef4444", fontSize:18, padding:"0 2px", lineHeight:1,
                }}>×</button>
              </div>
            ))}
            <button onClick={addFixed}
              style={gradBtn("linear-gradient(135deg,#10b981,#0ea5e9)", { width:"100%", marginTop:4 })}>
              ＋ 固定費を追加
            </button>
            {fixedCosts.length > 0 && (
              <div style={{
                display:"flex", justifyContent:"space-between",
                borderTop:"1px solid #f1f5f9", paddingTop:12, marginTop:12,
              }}>
                <div style={{ fontSize:12, color:"#94a3b8", fontWeight:600 }}>月間固定費合計</div>
                <div style={{ fontSize:16, fontWeight:900, color:"#334155" }}>
                  ¥{fixedCosts.reduce((s, f) => s + f.amount, 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* リセット */}
          <button onClick={() => {
            if (window.confirm("すべての設定をデフォルトに戻しますか？\n（CSVデータは保持されます）")) {
              setBudget(D_BUDGET); setDaily(D_DAILY); setItems(D_ITEMS);
              setDinners(D_DINNERS); setFixedCosts(D_FIXED);
              setMeals(D_MEALS); setComment(D_COMMENT);
            }
          }} style={{
            width:"100%", padding:"11px 0", background:"#f8fafc",
            border:"1px dashed #cbd5e1", borderRadius:10,
            fontSize:12, color:"#94a3b8", cursor:"pointer", fontWeight:600,
          }}>↩ 設定をデフォルトに戻す</button>
        </div>
      )}

      <div style={{ textAlign:"center", fontSize:10, color:"#cbd5e1", marginTop:24 }}>
        ※ データはこの端末のみに保存されます
      </div>
    </div>
  );
}
