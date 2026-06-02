import { useState } from "react";

const DEFAULT_BUDGET = 25000;
const DEFAULT_ITEMS = [
  { id: 1, label: "朝食（家）",       icon: "🌅", amount: 2100, color: "#f97316", note: "¥70 × 30日",  editable: true },
  { id: 2, label: "弁当（夜の残り）", icon: "🍱", amount: 3300, color: "#10b981", note: "¥150 × 22日", editable: true },
  { id: 3, label: "夕食（家）",       icon: "🌙", amount: 6900, color: "#0ea5e9", note: "¥230 × 30日", editable: true },
  { id: 4, label: "ランチ外食",       icon: "🍜", amount: 6400, color: "#8b5cf6", note: "¥800 × 8回",  editable: true },
  { id: 5, label: "夕食外食",         icon: "🍣", amount: 3000, color: "#ec4899", note: "¥1,500 × 2回",editable: true },
  { id: 6, label: "サプリ",           icon: "💊", amount: 1500, color: "#f59e0b", note: "月額目安",      editable: true },
];

const DEFAULT_DINNERS = [
  { id:1, name:"鶏むね塩麹焼き定食", emoji:"🐔", main:"鶏むね肉100g（塩麹漬け）", sides:["冷凍ブロッコリー蒸し","豆腐のみそ汁"],   protein:42, cost:210, tip:"塩麹に漬けると柔らかく仕上がる。翌日弁当に◎", color:"#10b981" },
  { id:2, name:"鯖缶大根おろし定食", emoji:"🐟", main:"鯖水煮缶1缶",               sides:["大根おろし","もやしナムル","わかめスープ"],protein:28, cost:160, tip:"鯖缶の汁もスープに使えばDHA丸ごと摂れる",   color:"#0ea5e9" },
  { id:3, name:"豆腐チャンプルー",   emoji:"🥚", main:"木綿豆腐1丁＋卵2個＋もやし",sides:["小松菜ごま和え"],                        protein:30, cost:140, tip:"卵でとじるとボリューム感アップ。醤油少なめで",color:"#8b5cf6" },
  { id:4, name:"鶏むね蒸しサラダ",   emoji:"🥗", main:"鶏むね肉100g（茹でてほぐす）",sides:["レタス・アボカド","きのこスープ"],      protein:38, cost:200, tip:"ポン酢＋ごま油で味付け。食べ応え◎",          color:"#f97316" },
  { id:5, name:"豚もも生姜炒め",     emoji:"🥩", main:"豚もも肉80g（生姜・醤油少なめ）",sides:["ほうれん草炒め","豆腐スープ"],       protein:28, cost:230, tip:"豚もも＝脂少なめ。週1〜2回まで",             color:"#ec4899" },
  { id:6, name:"具だくさん卵スープ", emoji:"🍲", main:"卵2個＋鶏むね50g",            sides:["きのこ・豆腐・わかめスープ","ほうれん草炒め"],protein:26,cost:130,tip:"具を多くすれば満腹感◎。節約デーに最適",   color:"#f59e0b" },
];

const TABS = [["budget","💴 予算"],["dinner","🌙 夕食"],["supple","💊 サプリ"]];

// ── 小コンポーネント ──────────────────────────

function NumInput({ value, onChange, color }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{
        width: 88, textAlign: "right", fontSize: 15, fontWeight: 800,
        color: color || "#0ea5e9", border: "none", borderBottom: `2px solid ${color || "#0ea5e9"}`,
        background: "transparent", outline: "none", padding: "2px 0",
      }}
    />
  );
}

function Tag({ color, children }) {
  return (
    <span style={{
      background: color + "18", color, fontSize: 12, fontWeight: 700,
      padding: "4px 12px", borderRadius: 99,
    }}>{children}</span>
  );
}

// ── メインアプリ ──────────────────────────────

export default function App() {
  const [tab, setTab]           = useState("budget");
  const [editMode, setEditMode] = useState(false);
  const [budget, setBudget]     = useState(DEFAULT_BUDGET);
  const [items, setItems]       = useState(DEFAULT_ITEMS);
  const [dinners, setDinners]   = useState(DEFAULT_DINNERS);
  const [openDinner, setOpenDinner] = useState(null);

  const total     = items.reduce((s, i) => s + i.amount, 0);
  const remaining = budget - total;
  const pct       = Math.min(100, (total / budget) * 100);
  const overBudget = remaining < 0;

  const updateItem   = (id, val) => setItems(prev => prev.map(i => i.id===id ? {...i, amount: val} : i));
  const updateDinner = (id, field, val) => setDinners(prev => prev.map(d => d.id===id ? {...d, [field]: val} : d));

  return (
    <div style={{
      fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
      background: "#f0f9ff", minHeight: "100vh",
      padding: "20px 16px 48px", maxWidth: 480, margin: "0 auto",
    }}>

      {/* ── ヘッダー ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{
            display: "inline-block", background: "linear-gradient(135deg,#bae6fd,#d1fae5)",
            borderRadius: 50, padding: "3px 14px",
            fontSize: 10, fontWeight: 700, color: "#0369a1", letterSpacing: 2, marginBottom: 6,
          }}>MONTHLY FOOD PLAN</div>
          <div style={{
            fontSize: 26, fontWeight: 900, letterSpacing: -1,
            background: "linear-gradient(90deg,#0ea5e9,#10b981)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {editMode ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                ¥<input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))}
                  style={{
                    width: 110, fontSize: 26, fontWeight: 900, letterSpacing: -1,
                    background: "transparent", border: "none",
                    borderBottom: "2px solid #0ea5e9", outline: "none",
                    color: "#0ea5e9",
                  }} />
              </span>
            ) : `¥${budget.toLocaleString()}`}
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>低糖質 · 高タンパク · ダイエット意識</div>
        </div>

        {/* 編集ボタン */}
        <button onClick={() => setEditMode(e => !e)} style={{
          padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
          background: editMode
            ? "linear-gradient(135deg,#f97316,#ec4899)"
            : "linear-gradient(135deg,#0ea5e9,#10b981)",
          color: "#fff", fontSize: 12, fontWeight: 700,
          boxShadow: "0 2px 8px #0ea5e930",
        }}>
          {editMode ? "✅ 完了" : "✏️ 編集"}
        </button>
      </div>

      {/* ── タブ ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 20,
        background: "#fff", borderRadius: 14, padding: 5,
        boxShadow: "0 1px 8px #0ea5e918",
      }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "9px 4px", borderRadius: 10, border: "none",
            background: tab === key ? "linear-gradient(135deg,#0ea5e9,#10b981)" : "transparent",
            color: tab === key ? "#fff" : "#94a3b8",
            fontSize: 12, fontWeight: tab === key ? 700 : 500, cursor: "pointer",
            boxShadow: tab === key ? "0 2px 8px #0ea5e940" : "none",
            transition: "all .2s",
          }}>{label}</button>
        ))}
      </div>

      {/* ══════ 予算タブ ══════ */}
      {tab === "budget" && (
        <div>
          {/* サマリーカード */}
          <div style={{
            background: "#fff", borderRadius: 18, padding: 20, marginBottom: 14,
            boxShadow: "0 2px 16px #0ea5e912", border: "1px solid #e0f2fe",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>月合計</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#0ea5e9", letterSpacing: -1 }}>
                  ¥{total.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>
                  {overBudget ? "超過" : "残り"}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: overBudget ? "#ef4444" : "#10b981" }}>
                  {overBudget ? `-¥${Math.abs(remaining).toLocaleString()}` : `+¥${remaining.toLocaleString()}`}
                </div>
              </div>
            </div>
            <div style={{ background: "#f0f9ff", borderRadius: 99, height: 10, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: overBudget
                  ? "linear-gradient(90deg,#f97316,#ef4444)"
                  : "linear-gradient(90deg,#0ea5e9,#10b981)",
                borderRadius: 99, transition: "width .4s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#cbd5e1", marginTop: 4 }}>
              <span>¥0</span><span>予算 ¥{budget.toLocaleString()}</span>
            </div>
          </div>

          {/* 各項目 */}
          {items.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "13px 16px", background: "#fff",
              border: "1px solid #f1f5f9", borderRadius: 12, marginBottom: 8,
              boxShadow: "0 1px 4px #0ea5e908",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: item.color + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{item.label}</div>
                {!editMode && <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.note}</div>}
                {editMode && (
                  <input
                    value={item.note}
                    onChange={e => setItems(prev => prev.map(i => i.id===item.id ? {...i, note: e.target.value} : i))}
                    placeholder="メモ（任意）"
                    style={{
                      fontSize: 11, color: "#94a3b8", border: "none",
                      borderBottom: "1px solid #cbd5e1", background: "transparent",
                      outline: "none", width: "100%", marginTop: 2,
                    }}
                  />
                )}
              </div>
              {editMode ? (
                <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, color: item.color, fontWeight: 700 }}>¥</span>
                  <NumInput value={item.amount} onChange={v => updateItem(item.id, v)} color={item.color} />
                </div>
              ) : (
                <div style={{ fontSize: 17, fontWeight: 800, color: item.color, flexShrink: 0 }}>
                  ¥{item.amount.toLocaleString()}
                </div>
              )}
            </div>
          ))}

          {editMode && (
            <button onClick={() => { setItems(DEFAULT_ITEMS); setBudget(DEFAULT_BUDGET); }} style={{
              width: "100%", marginTop: 8, padding: "10px 0",
              background: "#f8fafc", border: "1px dashed #cbd5e1",
              borderRadius: 10, fontSize: 12, color: "#94a3b8",
              cursor: "pointer", fontWeight: 600,
            }}>↩ デフォルトに戻す</button>
          )}
        </div>
      )}

      {/* ══════ 夕食タブ ══════ */}
      {tab === "dinner" && (
        <div>
          {!editMode && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, textAlign: "center" }}>
              6パターンローテーション — タップで詳細表示
            </div>
          )}
          {editMode && (
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 10, padding: "10px 14px", marginBottom: 14,
              fontSize: 12, color: "#92400e",
            }}>✏️ 編集モード：コスト・タンパク質量を変更できます</div>
          )}

          {dinners.map((d, i) => (
            <div key={d.id} style={{ marginBottom: 10 }}>
              <div onClick={() => !editMode && setOpenDinner(openDinner===i?null:i)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", background: "#fff",
                border: `1.5px solid ${openDinner===i ? d.color+"60" : "#f1f5f9"}`,
                borderRadius: openDinner===i ? "14px 14px 0 0" : 14,
                cursor: editMode ? "default" : "pointer",
                boxShadow: openDinner===i ? `0 2px 12px ${d.color}20` : "0 1px 4px #0ea5e908",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: d.color + "18",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>{d.emoji}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editMode ? (
                    <input value={d.name}
                      onChange={e => updateDinner(d.id,"name",e.target.value)}
                      style={{
                        fontSize: 14, fontWeight: 700, color: "#1e293b",
                        border: "none", borderBottom: "1.5px solid " + d.color,
                        background: "transparent", outline: "none", width: "100%",
                      }} />
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 2 }}>{d.name}</div>
                  )}
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.main}</div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {editMode ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>¥</span>
                        <input type="number" value={d.cost}
                          onChange={e => updateDinner(d.id,"cost",Number(e.target.value))}
                          style={{
                            width: 58, textAlign: "right", fontSize: 14, fontWeight: 800,
                            color: d.color, border: "none",
                            borderBottom: "1.5px solid " + d.color,
                            background: "transparent", outline: "none",
                          }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>P</span>
                        <input type="number" value={d.protein}
                          onChange={e => updateDinner(d.id,"protein",Number(e.target.value))}
                          style={{
                            width: 40, textAlign: "right", fontSize: 11,
                            color: "#64748b", border: "none",
                            borderBottom: "1px solid #cbd5e1",
                            background: "transparent", outline: "none",
                          }} />
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>g</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 800, color: d.color }}>¥{d.cost}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>P {d.protein}g</div>
                    </>
                  )}
                </div>
              </div>

              {/* 詳細展開（閲覧モードのみ） */}
              {!editMode && openDinner===i && (
                <div style={{
                  background: "#f8fafc",
                  border: `1.5px solid ${d.color}40`, borderTop: "none",
                  borderRadius: "0 0 14px 14px", padding: "14px 16px",
                }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>副菜</div>
                    {d.sides.map((s, j) => (
                      <div key={j} style={{ fontSize: 13, color: "#475569", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 4, height: 4, borderRadius: 99, background: d.color, display: "inline-block", flexShrink: 0 }} />
                        {s}
                      </div>
                    ))}
                  </div>
                  <div style={{
                    background: "#fff", borderRadius: 10, padding: "10px 12px",
                    border: `1px solid ${d.color}30`, fontSize: 12, color: "#64748b", lineHeight: 1.7,
                  }}>
                    <span style={{ color: d.color, fontWeight: 700 }}>💡 </span>{d.tip}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <Tag color={d.color}>🥩 タンパク質 {d.protein}g</Tag>
                    <Tag color="#0369a1">糖質 低</Tag>
                  </div>
                </div>
              )}
            </div>
          ))}

          {editMode && (
            <button onClick={() => setDinners(DEFAULT_DINNERS)} style={{
              width: "100%", marginTop: 4, padding: "10px 0",
              background: "#f8fafc", border: "1px dashed #cbd5e1",
              borderRadius: 10, fontSize: 12, color: "#94a3b8",
              cursor: "pointer", fontWeight: 600,
            }}>↩ デフォルトに戻す</button>
          )}

          {!editMode && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 14, padding: 14, marginTop: 4,
              fontSize: 12, color: "#166534", lineHeight: 1.9,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>🍱 弁当化のコツ</div>
              夕食を少し多めに作って詰めるだけ。<br />
              鶏むね・鯖缶・卵は冷めても美味しい。<br />
              ドレッシングは別容器で持参すると◎
            </div>
          )}
        </div>
      )}

      {/* ══════ サプリタブ ══════ */}
      {tab === "supple" && (
        <div>
          {[
            { name:"マルチビタミン＆ミネラル", icon:"🧪", priority:3, reason:"野菜だけでは不足しがちな微量栄養素を補完", cost:"¥500〜800/月", product:"DHC・NOW Foods・Kirklandなど", color:"#10b981" },
            { name:"ビタミンD",               icon:"☀️", priority:3, reason:"日光不足・免疫・骨密度。日本人は慢性的に不足", cost:"¥300〜500/月", product:"DHC ビタミンD（1粒/日）",         color:"#f97316" },
            { name:"プロテイン（ホエイ）",     icon:"💪", priority:2, reason:"タンパク質が足りない日の補完。筋肉維持・代謝UP",cost:"¥2,000〜3,500/月",product:"Myprotein・DNS・ザバスなど",   color:"#0ea5e9" },
            { name:"オメガ3（フィッシュオイル）",icon:"🐟",priority:1, reason:"鯖缶を週3〜4食べるなら不要。食べられない週に◎",cost:"¥500〜1,000/月",product:"NOW Foods Omega-3など",         color:"#8b5cf6" },
          ].map(s => (
            <div key={s.name} style={{
              background:"#fff", border:"1px solid #f1f5f9",
              borderRadius:14, padding:16, marginBottom:10,
              boxShadow:"0 1px 6px #0ea5e908",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{
                    width:38, height:38, borderRadius:10,
                    background: s.color+"18",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1e293b" }}>{s.name}</div>
                    <div style={{ display:"flex", gap:3, marginTop:3 }}>
                      {[1,2,3].map(n=>(
                        <span key={n} style={{
                          width:10, height:10, borderRadius:99,
                          background: n<=s.priority ? s.color : "#e2e8f0",
                          display:"inline-block",
                        }}/>
                      ))}
                      <span style={{ fontSize:10, color:"#94a3b8", marginLeft:4 }}>優先度</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize:14, fontWeight:800, color:s.color, whiteSpace:"nowrap" }}>{s.cost}</div>
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:8, lineHeight:1.6 }}>{s.reason}</div>
              <div style={{ background:"#f8fafc", borderRadius:8, padding:"6px 12px", fontSize:11, color:"#94a3b8" }}>
                おすすめ: {s.product}
              </div>
            </div>
          ))}

          <div style={{
            background:"linear-gradient(135deg,#ecfdf5,#e0f2fe)",
            border:"1px solid #a7f3d0", borderRadius:14, padding:16,
          }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#059669", marginBottom:8 }}>
              💡 ¥{budget.toLocaleString()}内に収めるなら
            </div>
            <div style={{ fontSize:12, color:"#047857", lineHeight:2 }}>
              ① まずマルチビタミン＋ビタミンDだけ（月〜¥1,300）<br />
              ② タンパク質が足りない日だけプロテイン1杯<br />
              ③ 鯖缶を週3〜4食べればオメガ3は不要
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign:"center", fontSize:10, color:"#cbd5e1", marginTop:28 }}>
        ※ 価格は関西圏スーパー参考値。変動あり。
      </div>
    </div>
  );
}