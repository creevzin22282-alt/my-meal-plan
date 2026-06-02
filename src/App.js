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
  { id:6, label:"サプリ",          icon:"💊", amount:1300, color:"#f59e0b", note:"プロテイン＋マルチビタミン＋オメガ3" },
];
const D_DINNERS = [
  { id:1, name:"鶏むね塩麹焼き定食",      emoji:"🐔", main:"鶏むね肉100g（塩麹漬け）",                  sides:["冷凍ブロッコリー蒸し","豆腐のみそ汁"],           protein:42, cost:210, tip:"塩麹に漬けると柔らかく仕上がる。翌日弁当に◎",                         color:"#10b981" },
  { id:2, name:"鯖缶大根おろし定食",      emoji:"🐟", main:"鯖水煮缶1缶",                               sides:["大根おろし","もやしナムル","わかめスープ"],       protein:28, cost:160, tip:"鯖缶の汁もスープに使えばDHA丸ごと摂れる",                             color:"#0ea5e9" },
  { id:3, name:"豆腐アボカドチキンサラダ",emoji:"🥗", main:"鶏むね肉80g（茹で）＋豆腐1/2丁＋アボカド1/2",sides:["レタス・きゅうり","レモン醤油ドレッシング"], protein:36, cost:220, tip:"豆腐は水切りして食べ応えアップ。アボカドの良質脂質がダイエットをサポート", color:"#22c55e" },
  { id:4, name:"鶏むね蒸しサラダ",        emoji:"🥗", main:"鶏むね肉100g（茹でてほぐす）",               sides:["レタス・アボカド","きのこスープ"],               protein:38, cost:200, tip:"ポン酢＋ごま油で味付け。食べ応え◎",                                   color:"#f97316" },
  { id:5, name:"豆腐チャンプルー",        emoji:"🥚", main:"木綿豆腐1丁＋卵2個＋もやし",                sides:["小松菜ごま和え"],                               protein:30, cost:140, tip:"卵でとじるとボリューム感アップ。醤油少なめで",                         color:"#8b5cf6" },
  { id:6, name:"豚もも生姜炒め",          emoji:"🥩", main:"豚もも肉80g（生姜・醤油少なめ）",            sides:["ほうれん草炒め","豆腐スープ"],                   protein:28, cost:230, tip:"豚もも＝脂少なめ。週1〜2回まで",                                   color:"#ec4899" },
  { id:7, name:"具だくさん卵スープ",      emoji:"🍲", main:"卵2個＋鶏むね50g",                          sides:["きのこ・豆腐・わかめスープ","ほうれん草炒め"],   protein:26, cost:130, tip:"具を多くすれば満腹感◎。節約デーに最適",                             color:"#f59e0b" },
];
const D_FIXED   = [
  { id:1, name:"家賃",   amount:65000, dueDate:25, color:"#0ea5e9" },
  { id:2, name:"電気代", amount:5000,  dueDate:28, color:"#f59e0b" },
  { id:3, name:"スマホ", amount:3000,  dueDate:1,  color:"#8b5cf6" },
];
const D_MEALS      = { breakfast:"", lunch:"", dinner:"" };
const D_MEAL_MODE  = { breakfast:"select", lunch:"select", dinner:"select" };
const D_COMMENT    = "今月も節約がんばろう！";

// ── 7日ローテーション ─────────────────────────────────────────────────────────
const D_WEEKLY_MENU = [
  { day:"日", emoji:"☀️", breakfast:"オートミール＋ゆで卵2個",       lunch:"家で軽く（残り物）", dinner:"具だくさん卵スープ定食",    isEatOut:false },
  { day:"月", emoji:"🌅", breakfast:"ヨーグルト(無糖)＋バナナ",     lunch:"夜の残り弁当",        dinner:"鶏むね塩麹焼き定食",        isEatOut:false },
  { day:"火", emoji:"🌞", breakfast:"卵かけご飯(少量)＋納豆",       lunch:"夜の残り弁当",        dinner:"鯖缶大根おろし定食",        isEatOut:false },
  { day:"水", emoji:"🌤", breakfast:"オートミール＋ゆで卵2個",       lunch:"夜の残り弁当",        dinner:"豆腐アボカドチキンサラダ",  isEatOut:false },
  { day:"木", emoji:"🌈", breakfast:"ヨーグルト(無糖)＋プロテイン", lunch:"夜の残り弁当",        dinner:"鶏むね蒸しサラダ",          isEatOut:false },
  { day:"金", emoji:"🌙", breakfast:"卵スクランブル2個＋納豆",       lunch:"夜の残り弁当",        dinner:"豆腐チャンプルー",          isEatOut:false },
  { day:"土", emoji:"🎉", breakfast:"オートミール＋ゆで卵2個",       lunch:"家で軽く（残り物）", dinner:"外食OK（¥1,500以内目安）",  isEatOut:true  },
];

// ── コスパサプリ ──────────────────────────────────────────────────────────────
const D_SUPPLEMENTS = [
  { name:"ホエイプロテイン", cost:600, note:"朝 or 夕食後 20g。筋肉維持＋腹持ち◎", color:"#0ea5e9", emoji:"🥛" },
  { name:"マルチビタミン",   cost:300, note:"朝食後1錠。食事の栄養ギャップを補う",  color:"#10b981", emoji:"💊" },
  { name:"オメガ3（魚油）",  cost:400, note:"夕食後1〜2錠。鯖缶2〜3回/週で代替可", color:"#8b5cf6", emoji:"🐟" },
];

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

// ── Wish Form ─────────────────────────────────────────────────────────────────
function WishForm({ wishForm, setWishForm, onSave, onCancel, isNew }) {
  const upd = (k, v) => setWishForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{
      background:"#fdf2f8", borderRadius:12, padding:"12px 14px", marginBottom:10,
      border:"1px solid #fce7f3",
    }}>
      <div style={{ display:"grid", gridTemplateColumns:"60px 1fr", gap:8, marginBottom:8 }}>
        <div>
          <label style={{ fontSize:10, color:"#94a3b8", display:"block", marginBottom:3 }}>絵文字</label>
          <input value={wishForm.emoji} onChange={e => upd("emoji", e.target.value)}
            style={{
              width:"100%", padding:"6px 4px", borderRadius:8, border:"1px solid #fce7f3",
              fontSize:20, background:"#fff", outline:"none", boxSizing:"border-box", textAlign:"center",
            }} />
        </div>
        <div>
          <label style={{ fontSize:10, color:"#94a3b8", display:"block", marginBottom:5 }}>カラー</label>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {TAG_PALETTE.map(c => (
              <div key={c} onClick={() => upd("color", c)} style={{
                width:22, height:22, borderRadius:99, background:c, cursor:"pointer",
                border: wishForm.color === c ? "2.5px solid #1e293b" : "2px solid transparent",
                flexShrink:0,
              }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom:8 }}>
        <label style={{ fontSize:10, color:"#94a3b8", display:"block", marginBottom:3 }}>名前 *</label>
        <input value={wishForm.name} onChange={e => upd("name", e.target.value)} placeholder="例: 新しいスニーカー"
          style={{
            width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #fce7f3",
            fontSize:13, background:"#fff", outline:"none", boxSizing:"border-box", fontFamily:"inherit",
          }} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        <div>
          <label style={{ fontSize:10, color:"#94a3b8", display:"block", marginBottom:3 }}>目標金額 (¥)</label>
          <input type="number" value={wishForm.price} onChange={e => upd("price", Number(e.target.value))}
            style={{
              width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #fce7f3",
              fontSize:13, background:"#fff", outline:"none", boxSizing:"border-box",
            }} />
        </div>
        <div>
          <label style={{ fontSize:10, color:"#94a3b8", display:"block", marginBottom:3 }}>貯金済み (¥)</label>
          <input type="number" value={wishForm.saved || 0} onChange={e => upd("saved", Number(e.target.value))}
            style={{
              width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #fce7f3",
              fontSize:13, background:"#fff", outline:"none", boxSizing:"border-box",
            }} />
        </div>
      </div>

      <div style={{ marginBottom:8 }}>
        <label style={{ fontSize:10, color:"#94a3b8", display:"block", marginBottom:3 }}>購入目標日</label>
        <input type="date" value={wishForm.targetDate} onChange={e => upd("targetDate", e.target.value)}
          style={{
            width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #fce7f3",
            fontSize:13, background:"#fff", outline:"none", boxSizing:"border-box", fontFamily:"inherit",
          }} />
      </div>

      <div style={{ marginBottom:10 }}>
        <label style={{ fontSize:10, color:"#94a3b8", display:"block", marginBottom:3 }}>メモ（任意）</label>
        <input value={wishForm.note} onChange={e => upd("note", e.target.value)} placeholder="ブランド名や購入場所など…"
          style={{
            width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #fce7f3",
            fontSize:13, background:"#fff", outline:"none", boxSizing:"border-box", fontFamily:"inherit",
          }} />
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onSave} style={gradBtn("linear-gradient(135deg,#ec4899,#8b5cf6)", { flex:1, padding:"9px 0", fontSize:12 })}>
          {isNew ? "追加する" : "保存する"}
        </button>
        <button onClick={onCancel} style={{
          flex:1, padding:"9px 0", borderRadius:10, border:"1px solid #e2e8f0",
          background:"#fff", color:"#64748b", cursor:"pointer", fontSize:12, fontWeight:600,
        }}>キャンセル</button>
      </div>
    </div>
  );
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  ["home",    "🏠", "ホーム"],
  ["finance", "💰", "収支"],
  ["budget",  "🍽", "食費"],
  ["dinner",  "🌙", "夕食"],
  ["wish",    "💝", "欲しい"],
  ["settings","⚙️", "設定"],
];

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,          setTab]          = useState("home");
  const [editMode,     setEditMode]     = useState(false);
  const [openDinner,   setOpenDinner]   = useState(null);
  const [filterCat,    setFilterCat]    = useState("all");
  const [tagInput,     setTagInput]     = useState({});
  const [showWeekMenu, setShowWeekMenu] = useState(false);
  const fileRef = useRef();

  // Persisted state
  const [budget,        setBudget]        = useLS("budget",       D_BUDGET);
  const [daily,         setDaily]         = useLS("daily",        D_DAILY);
  const [items,         setItems]         = useLS("items",        D_ITEMS);
  const [dinners,       setDinners]       = useLS("dinners",      D_DINNERS);
  const [fixedCosts,    setFixedCosts]    = useLS("fixed",        D_FIXED);
  const [meals,         setMeals]         = useLS("meals",        D_MEALS);
  const [mealInputMode, setMealInputMode] = useLS("mealInputMode",D_MEAL_MODE);
  const [comment,       setComment]       = useLS("comment",      D_COMMENT);
  const [txns,          setTxns]          = useLS("txns",         []);
  const [wishlist,      setWishlist]      = useLS("wishlist",     []);
  const [shops,         setShops]         = useLS("shops",        []);

  // Local form state
  const [newShopName, setNewShopName] = useState("");
  const [newShopAmt,  setNewShopAmt]  = useState("");
  const [editWishId,  setEditWishId]  = useState(null);
  const [showAddWish, setShowAddWish] = useState(false);
  const [wishForm,    setWishForm]    = useState({ name:"", price:0, targetDate:"", note:"", emoji:"🛍", color:"#ec4899", saved:0 });

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
  const allTags   = [...new Set(txns.flatMap(t => t.tags))];
  const tagTotals = allTags.map(tag => ({
    tag,
    total: txns.filter(t => t.tags.includes(tag)).reduce((s, t) => s + t.amount, 0),
    count: txns.filter(t => t.tags.includes(tag)).length,
  }));

  // Food budget computed
  const foodTotal  = items.reduce((s, i) => s + i.amount, 0);
  const remaining  = budget - foodTotal;
  const foodPct    = Math.min(100, (foodTotal / budget) * 100);
  const overBudget = remaining < 0;

  // Date helpers
  const today       = new Date();
  const todayDay    = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft    = daysInMonth - todayDay;
  const dateStr     = `${today.getFullYear()}年${today.getMonth() + 1}月${todayDay}日`;
  const todayStr    = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(todayDay).padStart(2,"0")}`;

  // Today's shopping
  const todayShops = shops.filter(s => s.date === todayStr);
  const todaySpent = todayShops.reduce((s, x) => s + x.amount, 0);

  // Rotation
  const todayRotation = D_WEEKLY_MENU[today.getDay()];
  const displayMeals  = {
    breakfast: meals.breakfast || todayRotation.breakfast,
    lunch:     meals.lunch     || todayRotation.lunch,
    dinner:    meals.dinner    || todayRotation.dinner,
  };

  // Unique options for each meal slot across all rotation days
  const rotationOptions = {
    breakfast: [...new Set(D_WEEKLY_MENU.map(m => m.breakfast))],
    lunch:     [...new Set(D_WEEKLY_MENU.map(m => m.lunch))],
    dinner:    [...new Set(D_WEEKLY_MENU.map(m => m.dinner))],
  };

  // Upcoming fixed costs (within 7 days)
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
  const updateFixed  = (id, field, val) => setFixedCosts(prev => prev.map(f => f.id === id ? { ...f, [field]: val } : f));
  const addFixed     = () => setFixedCosts(prev => [...prev, {
    id: Date.now(), name:"新しい固定費", amount:0, dueDate:1,
    color: TAG_PALETTE[prev.length % TAG_PALETTE.length],
  }]);
  const delFixed = id => setFixedCosts(prev => prev.filter(f => f.id !== id));

  const addShop = () => {
    const amt = Number(newShopAmt);
    if (!newShopName.trim() || !amt) return;
    setShops(prev => [...prev, { id: Date.now(), name: newShopName.trim(), amount: amt, date: todayStr }]);
    setNewShopName(""); setNewShopAmt("");
  };
  const delShop = id => setShops(prev => prev.filter(s => s.id !== id));

  const startEditWish = w => { setEditWishId(w.id); setWishForm({ ...w }); setShowAddWish(false); };
  const saveEditWish  = () => { setWishlist(prev => prev.map(w => w.id === editWishId ? { ...wishForm, id: editWishId } : w)); setEditWishId(null); };
  const delWish       = id => setWishlist(prev => prev.filter(w => w.id !== id));
  const startAddWish  = () => { setShowAddWish(true); setEditWishId(null); setWishForm({ name:"", price:0, targetDate:"", note:"", emoji:"🛍", color: TAG_PALETTE[wishlist.length % TAG_PALETTE.length], saved:0 }); };
  const addWishItem   = () => { if (!wishForm.name.trim()) return; setWishlist(prev => [...prev, { ...wishForm, id: Date.now() }]); setShowAddWish(false); };

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

      {/* ── タブバー (6列) ── */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:3, marginBottom:18,
        background:"#fff", borderRadius:14, padding:4,
        boxShadow:"0 1px 8px #0ea5e918",
      }}>
        {TABS.map(([key, icon, label]) => (
          <button key={key} onClick={() => { setTab(key); setEditMode(false); }} style={{
            padding:"6px 1px", borderRadius:10, border:"none",
            background: tab === key ? "linear-gradient(135deg,#0ea5e9,#10b981)" : "transparent",
            color: tab === key ? "#fff" : "#94a3b8",
            fontSize:9, fontWeight: tab === key ? 700 : 500, cursor:"pointer", transition:"all .2s",
          }}>
            <div style={{ fontSize:17, lineHeight:1.2 }}>{icon}</div>
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
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>🍽 今日のメニュー</div>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:4,
                background: todayRotation.isEatOut ? "#fef3c7" : "#f0fdf4",
                color: todayRotation.isEatOut ? "#d97706" : "#059669",
                fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:99,
              }}>
                {todayRotation.emoji} {todayRotation.day}曜日ローテ
              </div>
            </div>

            {[
              ["朝食","🌅", displayMeals.breakfast],
              ["昼食","🌞", displayMeals.lunch],
              ["夕食","🌙", displayMeals.dinner],
            ].map(([label, icon, val]) => (
              <div key={label} style={{
                display:"flex", alignItems:"flex-start", gap:10, marginBottom:10,
                padding:"10px 12px", borderRadius:10,
                background: label === "夕食" ? "#f0fdf4" : "#f8fafc",
                border: label === "夕食" ? "1px solid #bbf7d0" : "1px solid #f1f5f9",
              }}>
                <div style={{
                  width:34, height:34, borderRadius:9,
                  background: label === "夕食" ? "#dcfce7" : "#f0f9ff",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0,
                }}>{icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:"#94a3b8", marginBottom:2, display:"flex", justifyContent:"space-between" }}>
                    <span>{label}</span>
                    {label === "夕食" && <span style={{ color:"#16a34a", fontWeight:700 }}>低糖質・高タンパク</span>}
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1e293b", lineHeight:1.5 }}>{val}</div>
                </div>
              </div>
            ))}

            <button onClick={() => setShowWeekMenu(v => !v)} style={{
              width:"100%", padding:"8px 0", background:"none", border:"1px dashed #cbd5e1",
              borderRadius:8, fontSize:11, color:"#64748b", cursor:"pointer", marginTop:4,
            }}>
              {showWeekMenu ? "▲ 今週のメニューを閉じる" : "▼ 今週のメニューを見る"}
            </button>

            {showWeekMenu && (
              <div style={{ marginTop:10 }}>
                {D_WEEKLY_MENU.map((m, i) => (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap:8,
                    padding:"7px 10px", borderRadius:8, marginBottom:4,
                    background: i === today.getDay() ? "#f0fdf4" : "#f8fafc",
                    border: i === today.getDay() ? "1px solid #86efac" : "1px solid #f1f5f9",
                  }}>
                    <span style={{ fontSize:14, width:22, textAlign:"center" }}>{m.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:10, fontWeight:700, color: i === today.getDay() ? "#16a34a" : "#94a3b8", marginRight:6 }}>
                        {m.day}
                      </span>
                      <span style={{
                        fontSize:11, color:"#475569",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        display:"inline-block", maxWidth:"85%",
                      }}>
                        {m.dinner}
                      </span>
                    </div>
                    {m.isEatOut && (
                      <span style={{ fontSize:9, background:"#fef3c7", color:"#d97706", fontWeight:700, padding:"2px 6px", borderRadius:99, flexShrink:0 }}>外食</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 今日の買い物 */}
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>🛒 今日の買い物</div>
              <div style={{ fontSize:11, fontWeight:700, color: todaySpent > daily ? "#ef4444" : "#10b981" }}>
                {todaySpent > daily
                  ? `¥${(todaySpent - daily).toLocaleString()} 超過`
                  : `残 ¥${(daily - todaySpent).toLocaleString()}`}
              </div>
            </div>

            <div style={{ background:"#f0f9ff", borderRadius:99, height:7, overflow:"hidden", marginBottom:4 }}>
              <div style={{
                height:"100%", width:`${Math.min(100, (todaySpent / Math.max(daily,1)) * 100)}%`,
                background: todaySpent > daily
                  ? "linear-gradient(90deg,#f97316,#ef4444)"
                  : "linear-gradient(90deg,#0ea5e9,#10b981)",
                borderRadius:99, transition:"width .4s",
              }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#cbd5e1", marginBottom:10 }}>
              <span>¥0</span>
              <span>日予算 ¥{daily.toLocaleString()}</span>
            </div>

            {todayShops.map(s => (
              <div key={s.id} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"7px 10px", borderRadius:8, marginBottom:5,
                background:"#f8fafc", border:"1px solid #f1f5f9",
              }}>
                <div style={{ fontSize:13, color:"#334155", flex:1 }}>{s.name}</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#0ea5e9", marginRight:8 }}>¥{s.amount.toLocaleString()}</div>
                <button onClick={() => delShop(s.id)} style={{
                  background:"none", border:"none", cursor:"pointer",
                  color:"#ef4444", fontSize:17, padding:0, lineHeight:1,
                }}>×</button>
              </div>
            ))}

            <div style={{ display:"flex", gap:6, marginTop: todayShops.length > 0 ? 8 : 0 }}>
              <input
                value={newShopName}
                onChange={e => setNewShopName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addShop()}
                placeholder="品目名"
                style={{
                  flex:2, padding:"8px 10px", borderRadius:9, border:"1px solid #e2e8f0",
                  fontSize:13, outline:"none", background:"#f8fafc", fontFamily:"inherit",
                }}
              />
              <input
                type="number"
                value={newShopAmt}
                onChange={e => setNewShopAmt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addShop()}
                placeholder="金額"
                style={{
                  flex:1, padding:"8px 6px", borderRadius:9, border:"1px solid #e2e8f0",
                  fontSize:13, outline:"none", background:"#f8fafc", fontFamily:"inherit", minWidth:0,
                }}
              />
              <button onClick={addShop} style={gradBtn("linear-gradient(135deg,#0ea5e9,#10b981)", { padding:"8px 12px", fontSize:12, flexShrink:0 })}>
                追加
              </button>
            </div>

            {todayShops.length > 0 && (
              <div style={{
                display:"flex", justifyContent:"space-between",
                borderTop:"1px solid #f1f5f9", paddingTop:8, marginTop:8,
              }}>
                <div style={{ fontSize:11, color:"#94a3b8" }}>本日合計</div>
                <div style={{ fontSize:15, fontWeight:800, color: todaySpent > daily ? "#ef4444" : "#334155" }}>
                  ¥{todaySpent.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* サプリ（コンパクト表示） */}
          <div style={card}>
            <div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:8 }}>
              💊 サプリ（月計 ¥{D_SUPPLEMENTS.reduce((s,x)=>s+x.cost,0).toLocaleString()}）
            </div>
            {D_SUPPLEMENTS.map((s, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"5px 8px", borderRadius:8, marginBottom:4,
                background: s.color + "08", border:`1px solid ${s.color}20`,
              }}>
                <span style={{ fontSize:13, flexShrink:0 }}>{s.emoji}</span>
                <span style={{ fontSize:11, fontWeight:700, color:s.color, flexShrink:0 }}>{s.name}</span>
                <span style={{ fontSize:10, color:"#94a3b8", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.note}</span>
                <span style={{ fontSize:11, fontWeight:800, color:s.color, flexShrink:0 }}>¥{s.cost}/月</span>
              </div>
            ))}
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
                <span style={{ background:"#fef3c7", color:"#d97706", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>
                  ⚠ {upcoming.length}件まもなく
                </span>
              )}
            </div>
            {fixedCosts.length === 0 ? (
              <div style={{ fontSize:12, color:"#cbd5e1", textAlign:"center", padding:"12px 0" }}>設定タブで固定費を追加できます</div>
            ) : (
              <>
                {fixedCosts.map(f => {
                  const diff = f.dueDate >= todayDay ? f.dueDate - todayDay : daysInMonth - todayDay + f.dueDate;
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
                          {soon && <div style={{ fontSize:10, color:f.color, fontWeight:700 }}>{diff === 0 ? "今日！" : `あと${diff}日`}</div>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:16, fontWeight:800, color:f.color }}>¥{f.amount.toLocaleString()}</div>
                        <div style={{ fontSize:10, color:"#94a3b8" }}>毎月{f.dueDate}日</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid #f1f5f9", paddingTop:10, marginTop:4 }}>
                  <div style={{ fontSize:12, color:"#94a3b8", fontWeight:600 }}>月間固定費合計</div>
                  <div style={{ fontSize:17, fontWeight:900, color:"#334155" }}>¥{fixedCosts.reduce((s, f) => s + f.amount, 0).toLocaleString()}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════ 収支タブ ══════ */}
      {tab === "finance" && (
        <div>
          <div style={{ ...card, background:"linear-gradient(135deg,#f0fdf4,#f0f9ff)" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:6 }}>📂 MoneyForward CSV インポート</div>
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
                <button onClick={() => setTxns([])} style={{ fontSize:11, color:"#ef4444", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>クリア</button>
              </div>
            )}
          </div>

          {txns.length > 0 && <>
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
              <div style={{ background: balance >= 0 ? "#f0fdf4" : "#fff1f2", borderRadius:12, padding:12, textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#94a3b8", marginBottom:2 }}>収支差額</div>
                <div style={{ fontSize:26, fontWeight:900, color: balance >= 0 ? "#10b981" : "#ef4444" }}>
                  {balance >= 0 ? "+" : ""}¥{balance.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:12 }}>📂 カテゴリ別集計</div>
              {catTotals.map(({ cat, total, count }) => (
                <div key={cat} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 10px", borderRadius:9, marginBottom:6, background:"#f8fafc" }}>
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

            {allTags.length > 0 && (
              <div style={card}>
                <div style={{ fontSize:12, fontWeight:700, color:"#64748b", marginBottom:12 }}>🏷 タグ別集計</div>
                {tagTotals.map(({ tag, total, count }, i) => (
                  <div key={tag} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 10px", borderRadius:9, marginBottom:6, background:"#f8fafc" }}>
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

            {txns.filter(t => filterCat === "all" || t.category === filterCat).map(t => (
              <div key={t.id} style={{ ...card, padding:"12px 14px", marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <div style={{ flex:1, minWidth:0, marginRight:8 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#1e293b", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.name}</div>
                    <div style={{ fontSize:10, color:"#94a3b8" }}>{t.date} ・ {t.category}{t.sub ? ` / ${t.sub}` : ""}</div>
                  </div>
                  <div style={{ fontSize:15, fontWeight:800, flexShrink:0, color: t.amount >= 0 ? "#10b981" : "#ef4444" }}>
                    {t.amount >= 0 ? "+" : ""}¥{Math.abs(t.amount).toLocaleString()}
                  </div>
                </div>
                {t.tags.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                    {t.tags.map(tag => (
                      <Tag key={tag} color={TAG_PALETTE[allTags.indexOf(tag) % TAG_PALETTE.length]} onRemove={() => removeTag(t.id, tag)}>{tag}</Tag>
                    ))}
                  </div>
                )}
                <div style={{ display:"flex", gap:6 }}>
                  <input
                    value={tagInput[t.id] || ""}
                    onChange={e => setTagInput(p => ({ ...p, [t.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") { addTag(t.id, tagInput[t.id] || ""); setTagInput(p => ({ ...p, [t.id]: "" })); } }}
                    placeholder="タグを追加… (Enterで確定)"
                    style={{ flex:1, fontSize:11, padding:"6px 10px", borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", outline:"none", fontFamily:"inherit" }}
                  />
                  <button onClick={() => { addTag(t.id, tagInput[t.id] || ""); setTagInput(p => ({ ...p, [t.id]: "" })); }}
                    style={gradBtn("#0ea5e9", { fontSize:11, padding:"6px 12px" })}>追加</button>
                </div>
              </div>
            ))}
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
                <div style={{ fontSize:28, fontWeight:900, color:"#0ea5e9", letterSpacing:-1 }}>¥{foodTotal.toLocaleString()}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"#94a3b8", marginBottom:2 }}>{overBudget ? "超過" : "残り"}</div>
                <div style={{ fontSize:22, fontWeight:800, color: overBudget ? "#ef4444" : "#10b981" }}>
                  {overBudget ? `-¥${Math.abs(remaining).toLocaleString()}` : `+¥${remaining.toLocaleString()}`}
                </div>
              </div>
            </div>
            <div style={{ background:"#f0f9ff", borderRadius:99, height:10, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${foodPct}%`, background: overBudget ? "linear-gradient(90deg,#f97316,#ef4444)" : "linear-gradient(90deg,#0ea5e9,#10b981)", borderRadius:99, transition:"width .4s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#cbd5e1", marginTop:4 }}>
              <span>¥0</span>
              <span>
                {editMode ? (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:3 }}>
                    予算 ¥<input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))}
                      style={{ width:80, fontSize:11, fontWeight:700, color:"#0ea5e9", border:"none", borderBottom:"1px solid #0ea5e9", background:"transparent", outline:"none" }} />
                  </span>
                ) : `予算 ¥${budget.toLocaleString()}`}
              </span>
            </div>
          </div>

          {items.map(item => (
            <div key={item.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px", background:"#fff", border:"1px solid #f1f5f9", borderRadius:12, marginBottom:8, boxShadow:"0 1px 4px #0ea5e908" }}>
              <div style={{ width:38, height:38, borderRadius:10, background: item.color + "18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{item.label}</div>
                {!editMode
                  ? <div style={{ fontSize:11, color:"#94a3b8" }}>{item.note}</div>
                  : <input value={item.note}
                    onChange={e => setItems(prev => prev.map(i => i.id === item.id ? { ...i, note: e.target.value } : i))}
                    placeholder="メモ（任意）"
                    style={{ fontSize:11, color:"#94a3b8", border:"none", borderBottom:"1px solid #cbd5e1", background:"transparent", outline:"none", width:"100%", marginTop:2 }} />
                }
              </div>
              {editMode ? (
                <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                  <span style={{ fontSize:14, color:item.color, fontWeight:700 }}>¥</span>
                  <NumInput value={item.amount} onChange={v => updateItem(item.id, v)} color={item.color} />
                </div>
              ) : (
                <div style={{ fontSize:17, fontWeight:800, color:item.color, flexShrink:0 }}>¥{item.amount.toLocaleString()}</div>
              )}
            </div>
          ))}

          {editMode && (
            <button onClick={() => { setItems(D_ITEMS); setBudget(D_BUDGET); }} style={{ width:"100%", marginTop:8, padding:"10px 0", background:"#f8fafc", border:"1px dashed #cbd5e1", borderRadius:10, fontSize:12, color:"#94a3b8", cursor:"pointer", fontWeight:600 }}>
              ↩ デフォルトに戻す
            </button>
          )}
        </div>
      )}

      {/* ══════ 夕食タブ ══════ */}
      {tab === "dinner" && (
        <div>
          <div style={{ background:"linear-gradient(135deg,#f0fdf4,#f0f9ff)", border:"1px solid #bbf7d0", borderRadius:14, padding:"12px 14px", marginBottom:14, fontSize:12, color:"#166534", lineHeight:1.8 }}>
            <div style={{ fontWeight:700, marginBottom:4, fontSize:13 }}>🥗 夕食ルール（ダイエット方針）</div>
            <span style={{ background:"#dcfce7", borderRadius:6, padding:"1px 7px", marginRight:6, fontWeight:700 }}>低糖質</span>炭水化物は控えめ（ご飯なし or 少量）<br />
            <span style={{ background:"#dbeafe", borderRadius:6, padding:"1px 7px", marginRight:6, fontWeight:700 }}>高タンパク</span>鶏むね・鯖・卵・豆腐を中心に<br />
            <span style={{ background:"#ede9fe", borderRadius:6, padding:"1px 7px", marginRight:6, fontWeight:700 }}>栄養◎</span>野菜・海藻・きのこを必ず1品以上
          </div>

          {!editMode && <div style={{ fontSize:12, color:"#94a3b8", marginBottom:14, textAlign:"center" }}>7パターンローテーション — タップで詳細表示</div>}
          {editMode && (
            <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#92400e" }}>
              ✏️ 編集モード：コスト・タンパク質量を変更できます
            </div>
          )}

          {dinners.map((d, i) => (
            <div key={d.id} style={{ marginBottom:10 }}>
              <div onClick={() => !editMode && setOpenDinner(openDinner === i ? null : i)} style={{
                display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:"#fff",
                border: `1.5px solid ${openDinner === i ? d.color + "60" : "#f1f5f9"}`,
                borderRadius: openDinner === i ? "14px 14px 0 0" : 14,
                cursor: editMode ? "default" : "pointer",
                boxShadow: openDinner === i ? `0 2px 12px ${d.color}20` : "0 1px 4px #0ea5e908",
              }}>
                <div style={{ width:40, height:40, borderRadius:12, background: d.color + "18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{d.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  {editMode ? (
                    <input value={d.name} onChange={e => updateDinner(d.id, "name", e.target.value)}
                      style={{ fontSize:14, fontWeight:700, color:"#1e293b", border:"none", borderBottom:"1.5px solid " + d.color, background:"transparent", outline:"none", width:"100%" }} />
                  ) : (
                    <div style={{ fontSize:14, fontWeight:700, color:"#1e293b", marginBottom:2 }}>{d.name}</div>
                  )}
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.main}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  {editMode ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                        <span style={{ fontSize:11, color:"#94a3b8" }}>¥</span>
                        <input type="number" value={d.cost} onChange={e => updateDinner(d.id, "cost", Number(e.target.value))}
                          style={{ width:58, textAlign:"right", fontSize:14, fontWeight:800, color:d.color, border:"none", borderBottom:"1.5px solid " + d.color, background:"transparent", outline:"none" }} />
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                        <span style={{ fontSize:10, color:"#94a3b8" }}>P</span>
                        <input type="number" value={d.protein} onChange={e => updateDinner(d.id, "protein", Number(e.target.value))}
                          style={{ width:40, textAlign:"right", fontSize:11, color:"#64748b", border:"none", borderBottom:"1px solid #cbd5e1", background:"transparent", outline:"none" }} />
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
                <div style={{ background:"#f8fafc", border:`1.5px solid ${d.color}40`, borderTop:"none", borderRadius:"0 0 14px 14px", padding:"14px 16px" }}>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, marginBottom:6, letterSpacing:1 }}>副菜</div>
                    {d.sides.map((s, j) => (
                      <div key={j} style={{ fontSize:13, color:"#475569", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ width:4, height:4, borderRadius:99, background:d.color, display:"inline-block", flexShrink:0 }} />{s}
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"#fff", borderRadius:10, padding:"10px 12px", border:`1px solid ${d.color}30`, fontSize:12, color:"#64748b", lineHeight:1.7 }}>
                    <span style={{ color:d.color, fontWeight:700 }}>💡 </span>{d.tip}
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                    <Tag color={d.color}>🥩 タンパク質 {d.protein}g</Tag>
                    <Tag color="#0369a1">糖質 低</Tag>
                    <Tag color="#16a34a">ダイエット◎</Tag>
                  </div>
                </div>
              )}
            </div>
          ))}

          {editMode && (
            <button onClick={() => setDinners(D_DINNERS)} style={{ width:"100%", marginTop:4, padding:"10px 0", background:"#f8fafc", border:"1px dashed #cbd5e1", borderRadius:10, fontSize:12, color:"#94a3b8", cursor:"pointer", fontWeight:600 }}>
              ↩ デフォルトに戻す
            </button>
          )}

          {!editMode && (
            <>
              {/* サプリ（コンパクト） */}
              <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:14, padding:12, marginTop:4, marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#0369a1", marginBottom:8 }}>
                  💊 サプリ（月計 ¥{D_SUPPLEMENTS.reduce((s,x)=>s+x.cost,0).toLocaleString()}）
                </div>
                {D_SUPPLEMENTS.map((s, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 8px", borderRadius:8, marginBottom:4, background:"#fff", border:`1px solid ${s.color}20` }}>
                    <span style={{ fontSize:13, flexShrink:0 }}>{s.emoji}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:s.color, flexShrink:0 }}>{s.name}</span>
                    <span style={{ fontSize:10, color:"#64748b", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.note}</span>
                    <span style={{ fontSize:11, fontWeight:800, color:s.color, flexShrink:0 }}>¥{s.cost}/月</span>
                  </div>
                ))}
              </div>

              <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:14, padding:14, fontSize:12, color:"#166534", lineHeight:1.9 }}>
                <div style={{ fontWeight:700, marginBottom:6 }}>🍱 弁当化のコツ</div>
                夕食を少し多めに作って詰めるだけ。<br />
                鶏むね・鯖缶・卵は冷めても美味しい。<br />
                ドレッシングは別容器で持参すると◎
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════ 欲しいものタブ ══════ */}
      {tab === "wish" && (
        <div>
          {wishlist.length === 0 ? (
            <div style={{ textAlign:"center", padding:"48px 24px", background:"#fff", borderRadius:20, boxShadow:"0 2px 12px #0ea5e910" }}>
              <div style={{ fontSize:52, marginBottom:16 }}>💝</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#334155", marginBottom:8 }}>欲しいものリストが空です</div>
              <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.8, marginBottom:20 }}>
                設定タブから目標アイテムを追加して<br />お金を貯めるモチベーションを高めましょう！
              </div>
              <button onClick={() => setTab("settings")} style={gradBtn("linear-gradient(135deg,#ec4899,#8b5cf6)")}>
                設定で追加する →
              </button>
            </div>
          ) : (
            <>
              <div style={{ background:"linear-gradient(135deg,#fdf2f8,#f5f3ff)", borderRadius:14, padding:"11px 14px", marginBottom:14, fontSize:12, color:"#6d28d9", fontWeight:600, textAlign:"center" }}>
                💝 目標を見て、今日も節約がんばろう！
              </div>
              {wishlist.map(w => {
                const pct       = w.price > 0 ? Math.min(100, ((w.saved || 0) / w.price) * 100) : 0;
                const need      = Math.max(0, w.price - (w.saved || 0));
                const daysUntil = w.targetDate
                  ? Math.ceil((new Date(w.targetDate) - today) / 86400000)
                  : null;
                return (
                  <div key={w.id} style={{ ...card, border:`1.5px solid ${w.color}30`, background:`linear-gradient(135deg,${w.color}06,#fff)` }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
                      <div style={{ width:50, height:50, borderRadius:14, background: w.color + "20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
                        {w.emoji}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:16, fontWeight:800, color:"#1e293b", marginBottom:3 }}>{w.name}</div>
                        {w.note && <div style={{ fontSize:11, color:"#64748b" }}>{w.note}</div>}
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontSize:20, fontWeight:900, color:w.color }}>¥{w.price.toLocaleString()}</div>
                        {(w.saved || 0) > 0 && <div style={{ fontSize:10, color:"#64748b" }}>貯金 ¥{w.saved.toLocaleString()}</div>}
                      </div>
                    </div>

                    {w.price > 0 && (
                      <>
                        <div style={{ background:"#f0f9ff", borderRadius:99, height:8, overflow:"hidden", marginBottom:5 }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${w.color},${w.color}bb)`, borderRadius:99, transition:"width .4s" }} />
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:10 }}>
                          <span style={{ color:"#94a3b8" }}>{pct.toFixed(0)}% 達成</span>
                          {need > 0
                            ? <span style={{ color:w.color, fontWeight:700 }}>あと ¥{need.toLocaleString()} で買える！</span>
                            : <span style={{ color:"#10b981", fontWeight:700 }}>🎉 目標金額到達！</span>
                          }
                        </div>
                      </>
                    )}

                    {daysUntil !== null && (
                      <div style={{
                        display:"inline-flex", alignItems:"center", gap:4,
                        background: daysUntil < 0 ? "#fff1f2" : daysUntil <= 30 ? "#fef3c7" : "#f0fdf4",
                        color: daysUntil < 0 ? "#ef4444" : daysUntil <= 30 ? "#d97706" : "#059669",
                        fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99,
                      }}>
                        📅 {w.targetDate.replace(/-/g, "/")} 目標
                        {daysUntil >= 0 ? ` · あと${daysUntil}日` : ` · ${Math.abs(daysUntil)}日超過`}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ══════ 設定タブ ══════ */}
      {tab === "settings" && (
        <div>
          {/* 今日のメニュー（ローテ選択 or 手入力） */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:4 }}>🍽 今日のメニュー</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:14, lineHeight:1.6 }}>
              ローテーションから選ぶか、手入力で今日だけ変更できます。
            </div>
            {[["breakfast","朝食 🌅"],["lunch","昼食 🌞"],["dinner","夕食 🌙"]].map(([key, label]) => (
              <div key={key} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <label style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{label}</label>
                  <div style={{ display:"flex", gap:4 }}>
                    {[["select","ローテから選ぶ"],["text","手入力"]].map(([mode, mlabel]) => (
                      <button key={mode} onClick={() => setMealInputMode(p => ({ ...p, [key]: mode }))} style={{
                        fontSize:10, padding:"3px 9px", borderRadius:99, border:"none", cursor:"pointer", fontWeight:700,
                        background: mealInputMode[key] === mode ? "#0ea5e9" : "#f1f5f9",
                        color: mealInputMode[key] === mode ? "#fff" : "#64748b",
                      }}>{mlabel}</button>
                    ))}
                  </div>
                </div>
                {mealInputMode[key] === "select" ? (
                  <select
                    value={meals[key]}
                    onChange={e => setMeals(p => ({ ...p, [key]: e.target.value }))}
                    style={{
                      width:"100%", padding:"9px 12px", borderRadius:10, border:"1px solid #e2e8f0",
                      fontSize:13, outline:"none", background:"#f8fafc", boxSizing:"border-box",
                      fontFamily:"inherit", color:"#334155", cursor:"pointer",
                    }}
                  >
                    <option value="">（今日のローテーションを使う）</option>
                    {rotationOptions[key].map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <TextInput
                    value={meals[key]}
                    onChange={v => setMeals(p => ({ ...p, [key]: v }))}
                    placeholder={`例: ${D_WEEKLY_MENU[today.getDay()][key]}`}
                  />
                )}
              </div>
            ))}
            {(meals.breakfast || meals.lunch || meals.dinner) && (
              <button onClick={() => setMeals(D_MEALS)} style={{ width:"100%", marginTop:4, padding:"8px 0", background:"#f8fafc", border:"1px dashed #cbd5e1", borderRadius:8, fontSize:11, color:"#94a3b8", cursor:"pointer" }}>
                ↩ クリアしてローテーションに戻す
              </button>
            )}
          </div>

          {/* 予算設定 */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:14 }}>💴 予算設定</div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:"#94a3b8", display:"block", marginBottom:5 }}>1日の予算</label>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:16, color:"#0ea5e9", fontWeight:700 }}>¥</span>
                <input type="number" value={daily} onChange={e => setDaily(Number(e.target.value))}
                  style={{ flex:1, padding:"9px 12px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:14, outline:"none", background:"#f8fafc" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, color:"#94a3b8", display:"block", marginBottom:5 }}>今月の食費予算</label>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:16, color:"#10b981", fontWeight:700 }}>¥</span>
                <input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))}
                  style={{ flex:1, padding:"9px 12px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:14, outline:"none", background:"#f8fafc" }} />
              </div>
            </div>
          </div>

          {/* コメント */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:10 }}>💬 一言コメント</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:8 }}>ホーム画面に表示されます</div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="ホームに表示するコメントを入力…" rows={3}
              style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid #e2e8f0", fontSize:13, outline:"none", background:"#f8fafc", resize:"none", boxSizing:"border-box", lineHeight:1.7, fontFamily:"inherit" }} />
          </div>

          {/* 欲しいものリスト管理 */}
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#334155" }}>💝 欲しいものリスト</div>
              {!showAddWish && (
                <button onClick={startAddWish} style={gradBtn("linear-gradient(135deg,#ec4899,#8b5cf6)", { fontSize:11, padding:"6px 12px" })}>
                  ＋ 追加
                </button>
              )}
            </div>

            {showAddWish && (
              <WishForm wishForm={wishForm} setWishForm={setWishForm} onSave={addWishItem} onCancel={() => setShowAddWish(false)} isNew={true} />
            )}

            {wishlist.length === 0 && !showAddWish && (
              <div style={{ fontSize:12, color:"#cbd5e1", textAlign:"center", padding:"12px 0" }}>欲しいものを追加してみよう</div>
            )}

            {wishlist.map(w => (
              <div key={w.id}>
                {editWishId === w.id ? (
                  <WishForm wishForm={wishForm} setWishForm={setWishForm} onSave={saveEditWish} onCancel={() => setEditWishId(null)} isNew={false} />
                ) : (
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, padding:"10px 12px", background:"#f8fafc", borderRadius:10, border:`1px solid ${w.color}30` }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{w.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#334155", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.name}</div>
                      <div style={{ fontSize:11, color:w.color, fontWeight:700 }}>
                        ¥{w.price.toLocaleString()}
                        {w.targetDate && <span style={{ color:"#94a3b8", fontWeight:400, marginLeft:6 }}>{w.targetDate.replace(/-/g,"/")}まで</span>}
                      </div>
                    </div>
                    <button onClick={() => startEditWish(w)} style={{ fontSize:11, padding:"4px 10px", borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", color:"#64748b", cursor:"pointer", fontWeight:600, flexShrink:0 }}>編集</button>
                    <button onClick={() => delWish(w.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize:18, padding:"0 2px", lineHeight:1, flexShrink:0 }}>×</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 固定費管理 */}
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:700, color:"#334155", marginBottom:14 }}>📌 固定費管理</div>
            {fixedCosts.map(f => (
              <div key={f.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, padding:"10px 12px", background:"#f8fafc", borderRadius:10, border:`1px solid ${f.color}30` }}>
                <div style={{ width:10, height:10, borderRadius:99, background:f.color, flexShrink:0 }} />
                <input value={f.name} onChange={e => updateFixed(f.id, "name", e.target.value)}
                  style={{ flex:1, fontSize:13, fontWeight:600, border:"none", borderBottom:"1px solid #e2e8f0", background:"transparent", outline:"none", padding:"2px 4px", color:"#334155", fontFamily:"inherit" }} />
                <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                  <span style={{ fontSize:12, color:"#94a3b8" }}>¥</span>
                  <input type="number" value={f.amount} onChange={e => updateFixed(f.id, "amount", Number(e.target.value))}
                    style={{ width:76, textAlign:"right", fontSize:13, fontWeight:700, color:f.color, border:"none", borderBottom:"1px solid #e2e8f0", background:"transparent", outline:"none", padding:"2px 0" }} />
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
                  <input type="number" value={f.dueDate} min={1} max={31} onChange={e => updateFixed(f.id, "dueDate", Number(e.target.value))}
                    style={{ width:32, textAlign:"center", fontSize:12, border:"none", borderBottom:"1px solid #e2e8f0", background:"transparent", outline:"none", padding:"2px 0", color:"#64748b" }} />
                  <span style={{ fontSize:11, color:"#94a3b8" }}>日</span>
                </div>
                <button onClick={() => delFixed(f.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize:18, padding:"0 2px", lineHeight:1 }}>×</button>
              </div>
            ))}
            <button onClick={addFixed} style={gradBtn("linear-gradient(135deg,#10b981,#0ea5e9)", { width:"100%", marginTop:4 })}>
              ＋ 固定費を追加
            </button>
            {fixedCosts.length > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid #f1f5f9", paddingTop:12, marginTop:12 }}>
                <div style={{ fontSize:12, color:"#94a3b8", fontWeight:600 }}>月間固定費合計</div>
                <div style={{ fontSize:16, fontWeight:900, color:"#334155" }}>¥{fixedCosts.reduce((s, f) => s + f.amount, 0).toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* リセット */}
          <button onClick={() => {
            if (window.confirm("すべての設定をデフォルトに戻しますか？\n（CSVデータ・買い物・欲しいものリストは保持されます）")) {
              setBudget(D_BUDGET); setDaily(D_DAILY); setItems(D_ITEMS);
              setDinners(D_DINNERS); setFixedCosts(D_FIXED);
              setMeals(D_MEALS); setComment(D_COMMENT);
            }
          }} style={{ width:"100%", padding:"11px 0", background:"#f8fafc", border:"1px dashed #cbd5e1", borderRadius:10, fontSize:12, color:"#94a3b8", cursor:"pointer", fontWeight:600 }}>
            ↩ 設定をデフォルトに戻す
          </button>
        </div>
      )}

      <div style={{ textAlign:"center", fontSize:10, color:"#cbd5e1", marginTop:24 }}>
        ※ データはこの端末のみに保存されます
      </div>
    </div>
  );
}
