import { useState, useRef, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "./firebase";

// ── helpers ──────────────────────────────────────────────
const GST_RATES = [0, 5, 12, 18, 28];
const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Lakshadweep","Puducherry"];

function calcItem(item) {
  const base = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
  const gstAmt = base * (parseFloat(item.gst) || 0) / 100;
  return { base, gstAmt, total: base + gstAmt };
}

function toWords(n) {
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (n === 0) return "Zero";
  const convert = x => x < 20 ? a[x] : b[Math.floor(x/10)] + (x%10 ? " " + a[x%10] : "");
  let result = "";
  if (Math.floor(n/10000000)) { result += convert(Math.floor(n/10000000)) + " Crore "; n %= 10000000; }
  if (Math.floor(n/100000)) { result += convert(Math.floor(n/100000)) + " Lakh "; n %= 100000; }
  if (Math.floor(n/1000)) { result += convert(Math.floor(n/1000)) + " Thousand "; n %= 1000; }
  if (Math.floor(n/100)) { result += convert(Math.floor(n/100)) + " Hundred "; n %= 100; }
  if (n) result += convert(n);
  return result.trim() + " Rupees Only";
}

const fmt = n => Number(n || 0).toFixed(2);
const today = () => new Date().toISOString().split("T")[0];
const newItem = () => ({ id: Date.now(), desc: "", hsn: "", qty: "", rate: "", gst: 18, unit: "Nos" });

// ── initial state ─────────────────────────────────────────
const initBiz = { name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", phone: "", email: "", bank: "", ifsc: "", account: "" };
const initClient = { name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", phone: "", email: "" };
const initMeta = { invoiceNo: "INV-001", date: today(), dueDate: "", placeOfSupply: "Maharashtra", notes: "Thank you for your business!", terms: "Payment due within 30 days." };

// ── SCREENS ───────────────────────────────────────────────
const SCREENS = ["Dashboard", "New Invoice", "My Invoices", "Settings"];

export default function App() {
  const [screen, setScreen] = useState("Dashboard");
  const [biz, setBiz] = useState(initBiz);
  const [bizSaved, setBizSaved] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [previewInv, setPreviewInv] = useState(null);

  // invoice form state
  const [client, setClient] = useState(initClient);
  const [meta, setMeta] = useState(initMeta);
  const [items, setItems] = useState([newItem()]);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef();

  // ── load data from Firebase on app start ─────────────────
  useEffect(() => {
    const bizRef = ref(db, "business");
    onValue(bizRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBiz(data);
        setBizSaved(true);
      }
    });

    const invRef = ref(db, "invoices");
    onValue(invRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data).sort((a, b) => b.id - a.id);
        setInvoices(list);
      } else {
        setInvoices([]);
      }
    });
  }, []);

  // ── compute totals ──────────────────────────────────────
  const computed = items.map(calcItem);
  const subtotal = computed.reduce((s, c) => s + c.base, 0);
  const totalGST = computed.reduce((s, c) => s + c.gstAmt, 0);
  const grandTotal = subtotal + totalGST;
  const isIGST = biz.state !== meta.placeOfSupply;

  // ── item helpers ────────────────────────────────────────
  const addItem = () => setItems(p => [...p, newItem()]);
  const removeItem = id => setItems(p => p.filter(i => i.id !== id));
  const updateItem = (id, key, val) => setItems(p => p.map(i => i.id === id ? { ...i, [key]: val } : i));

  // ── save invoice ────────────────────────────────────────
  const saveInvoice = () => {
    const inv = { id: Date.now(), meta: { ...meta }, client: { ...client }, items: [...items], biz: { ...biz }, grandTotal, subtotal, totalGST, isIGST };
    set(ref(db, "invoices/" + inv.id), inv);
    setMeta(m => ({ ...m, invoiceNo: "INV-" + String(parseInt(m.invoiceNo.replace(/\D/g,"") || 0) + 1).padStart(3,"0"), date: today() }));
    setClient(initClient);
    setItems([newItem()]);
    setScreen("My Invoices");
  };

  const handlePrint = () => window.print();

  // ── styles ───────────────────────────────────────────────
  const S = {
    app: { minHeight: "100vh", background: "#F1F5F9", color: "#1E293B", fontFamily: "'Inter', 'Segoe UI', sans-serif", paddingBottom: 80 },
    header: { background: "#0F172A", borderBottom: "1px solid #1E293B", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoBox: { width: 36, height: 36, borderRadius: 8, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" },
    logoText: { fontSize: 17, fontWeight: 700, color: "#fff" },
    nav: { display: "flex", gap: 4, background: "#1E293B", borderRadius: 10, padding: 4, border: "none", overflowX: "auto" },
    navBtn: (active) => ({ padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", background: active ? "#2563EB" : "transparent", color: active ? "#fff" : "#94A3B8", boxShadow: "none", fontFamily: "inherit" }),
    body: { maxWidth: 760, margin: "0 auto", padding: "20px 16px" },
    card: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, marginBottom: 14, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" },
    label: { fontSize: 11, color: "#64748B", fontFamily: "inherit", letterSpacing: 0.5, marginBottom: 6, display: "block", fontWeight: 600, textTransform: "uppercase" },
    input: { width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", color: "#1E293B", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s" },
    select: { width: "100%", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px", color: "#1E293B", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
    btn: (color="#2563EB") => ({ background: color, border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(15,23,42,0.12)" }),
    btnOutline: { background: "#fff", border: "1px solid #CBD5E1", borderRadius: 8, padding: "10px 20px", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    sectionTitle: { fontSize: 11, color: "#2563EB", fontFamily: "inherit", letterSpacing: 1, marginBottom: 14, fontWeight: 700, textTransform: "uppercase" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    statCard: (color) => ({ background: `${color}0D`, border: `1px solid ${color}26`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "16px 18px" }),
  };

  // ── PRINT COMPONENT (regular function, not JSX component, to avoid focus bugs) ──
  const renderInvoicePrint = (inv) => {
    const { meta, client, items, biz, grandTotal, subtotal, totalGST, isIGST, computed } = inv;
    const ps = { background: "#fff", color: "#111", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px #00000044", fontFamily: "Arial, sans-serif", fontSize: 12 };
    return (
      <div ref={printRef} id="print-area" style={ps}>
        <style>{`@media print { body { margin: 0; } }`}</style>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)", padding: "24px 28px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{biz.name || "Your Business Name"}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{biz.address}{biz.city ? ", " + biz.city : ""}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{biz.state}{biz.pin ? " - " + biz.pin : ""}</div>
              {biz.phone && <div style={{ fontSize: 12, opacity: 0.8 }}>📞 {biz.phone}</div>}
              {biz.gstin && <div style={{ fontSize: 12, marginTop: 6, background: "#ffffff22", padding: "3px 10px", borderRadius: 99, display: "inline-block" }}>GSTIN: {biz.gstin}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 2 }}>INVOICE</div>
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>#{meta.invoiceNo}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Date: {meta.date}</div>
              {meta.dueDate && <div style={{ fontSize: 12, opacity: 0.7 }}>Due: {meta.dueDate}</div>}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ padding: "16px 24px", borderRight: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>BILL TO</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>{client.name || "—"}</div>
            {client.gstin && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>GSTIN: {client.gstin}</div>}
            {client.address && <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>{client.address}</div>}
            {client.city && <div style={{ fontSize: 11, color: "#374151" }}>{client.city}, {client.state} {client.pin}</div>}
            {client.phone && <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>📞 {client.phone}</div>}
          </div>
          <div style={{ padding: "16px 24px" }}>
            <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>INVOICE INFO</div>
            {[
              ["Invoice No", meta.invoiceNo],
              ["Invoice Date", meta.date],
              ["Due Date", meta.dueDate || "—"],
              ["Place of Supply", meta.placeOfSupply],
              ["GST Type", isIGST ? "IGST (Inter-state)" : "CGST + SGST (Intra-state)"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#6B7280", fontSize: 11 }}>{k}:</span>
                <span style={{ fontWeight: 600, fontSize: 11 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div className="scroll-hint">↔ Swipe to see full table</div>
        <div className="invoice-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F1F5F9" }}>
                {["#", "Description", "HSN", "Qty", "Unit", "Rate", "GST%", "GST Amt", "Total"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: h === "#" ? "center" : h === "Total" || h === "GST Amt" || h === "Rate" ? "right" : "left", fontSize: 10, color: "#6B7280", fontWeight: 700, letterSpacing: 1, borderBottom: "2px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const c = computed ? computed[i] : calcItem(item);
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: "#9CA3AF", fontSize: 11 }}>{i + 1}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111" }}>{item.desc}</td>
                    <td style={{ padding: "10px 12px", color: "#6B7280", fontSize: 11 }}>{item.hsn || "—"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.qty}</td>
                    <td style={{ padding: "10px 12px", color: "#6B7280", fontSize: 11 }}>{item.unit}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>₹{fmt(item.rate)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: "#6B7280" }}>{item.gst}%</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#6B7280" }}>₹{fmt(c.gstAmt)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#1D4ED8" }}>₹{fmt(c.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "2px solid #E5E7EB" }}>
          <div style={{ padding: "16px 24px" }}>
            {biz.bank && (
              <div>
                <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>BANK DETAILS</div>
                <div style={{ fontSize: 11, color: "#374151" }}>Bank: {biz.bank}</div>
                <div style={{ fontSize: 11, color: "#374151" }}>A/C: {biz.account}</div>
                <div style={{ fontSize: 11, color: "#374151" }}>IFSC: {biz.ifsc}</div>
              </div>
            )}
            {meta.notes && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: 2, marginBottom: 4, fontWeight: 700 }}>NOTES</div>
                <div style={{ fontSize: 11, color: "#374151" }}>{meta.notes}</div>
              </div>
            )}
          </div>
          <div style={{ padding: "16px 24px", background: "#F8FAFC" }}>
            {[
              ["Subtotal", "₹" + fmt(subtotal)],
              ...(isIGST
                ? [["IGST", "₹" + fmt(totalGST)]]
                : [["CGST", "₹" + fmt(totalGST/2)], ["SGST", "₹" + fmt(totalGST/2)]]
              ),
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #E5E7EB", fontSize: 12 }}>
                <span style={{ color: "#6B7280" }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>TOTAL</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#1D4ED8" }}>₹{fmt(grandTotal)}</span>
            </div>
            <div style={{ fontSize: 10, color: "#9CA3AF", fontStyle: "italic", marginTop: 4 }}>{toWords(Math.round(grandTotal))}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#1E3A5F", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ color: "#93C5FD", fontSize: 11 }}>{meta.terms}</div>
          <div style={{ color: "#93C5FD", fontSize: 10, opacity: 0.7 }}>Generated by GST Invoice Tool</div>
        </div>
      </div>
    );
  };

  // ── DASHBOARD ────────────────────────────────────────────
  const dashboardView = (() => {
    const thisMonth = invoices.filter(i => i.meta.date.startsWith(new Date().toISOString().slice(0,7)));
    const revenue = invoices.reduce((s,i) => s + i.grandTotal, 0);
    const monthRev = thisMonth.reduce((s,i) => s + i.grandTotal, 0);
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: "#2563EB", fontFamily: "inherit", letterSpacing: 1, margin: "0 0 6px", fontWeight: 700, textTransform: "uppercase" }}>Welcome Back</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#0F172A" }}>
            {biz.name || "Setup your business"} 👋
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { label: "TOTAL INVOICES", value: invoices.length, color: "#2563EB", icon: "🧾" },
            { label: "THIS MONTH", value: thisMonth.length, color: "#059669", icon: "📅" },
            { label: "TOTAL REVENUE", value: "₹" + fmt(revenue), color: "#D97706", icon: "💰" },
            { label: "MONTH REVENUE", value: "₹" + fmt(monthRev), color: "#7C3AED", icon: "📈" },
          ].map((s, i) => (
            <div key={i} style={S.statCard(s.color)}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 10, color: "#64748B", fontFamily: "inherit", letterSpacing: 0.5, marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <p style={S.sectionTitle}>⚡ Quick Actions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button style={{ ...S.btn(), width: "100%", padding: "14px 20px", fontSize: 14 }} onClick={() => setScreen("New Invoice")}>
              ➕ New GST Invoice
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button style={{ ...S.btnOutline, borderRadius: 8 }} onClick={() => setScreen("My Invoices")}>📋 View Invoices</button>
              <button style={{ ...S.btnOutline, borderRadius: 8 }} onClick={() => setScreen("Settings")}>⚙️ Business Setup</button>
            </div>
          </div>
        </div>

        {!bizSaved && (
          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: 13, color: "#B45309", fontWeight: 700, margin: "0 0 6px" }}>⚠️ Business Details Missing!</p>
            <p style={{ fontSize: 12, color: "#92400E", margin: "0 0 10px" }}>Invoice pe aapka naam aur GST number nahi dikhega. Pehle Setup karo!</p>
            <button style={S.btn("#D97706")} onClick={() => setScreen("Settings")}>Setup Now →</button>
          </div>
        )}

        {invoices.length > 0 && (
          <div style={S.card}>
            <p style={S.sectionTitle}>🕐 Recent Invoices</p>
            {invoices.slice(0,3).map(inv => (
              <div key={inv.id} onClick={() => { setPreviewInv(inv); setScreen("preview"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0", marginBottom: 8, cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{inv.meta.invoiceNo}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{inv.client.name || "No client"} · {inv.meta.date}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>₹{fmt(inv.grandTotal)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })();

  // ── NEW INVOICE ───────────────────────────────────────────
  const newInvoiceView = (
    <div>
      <p style={{ ...S.sectionTitle, fontSize: 13, marginBottom: 16 }}>📄 CREATE NEW GST INVOICE</p>

      {/* Invoice Meta */}
      <div style={S.card}>
        <p style={S.sectionTitle}>INVOICE DETAILS</p>
        <div style={S.grid2}>
          <div>
            <label style={S.label}>INVOICE NO</label>
            <input style={S.input} value={meta.invoiceNo} onChange={e => setMeta(m => ({...m, invoiceNo: e.target.value}))} />
          </div>
          <div>
            <label style={S.label}>DATE</label>
            <input type="date" style={S.input} value={meta.date} onChange={e => setMeta(m => ({...m, date: e.target.value}))} />
          </div>
          <div>
            <label style={S.label}>DUE DATE</label>
            <input type="date" style={S.input} value={meta.dueDate} onChange={e => setMeta(m => ({...m, dueDate: e.target.value}))} />
          </div>
          <div>
            <label style={S.label}>PLACE OF SUPPLY</label>
            <select style={S.select} value={meta.placeOfSupply} onChange={e => setMeta(m => ({...m, placeOfSupply: e.target.value}))}>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Client */}
      <div style={S.card}>
        <p style={S.sectionTitle}>BILL TO (CLIENT)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>CLIENT NAME *</label>
              <input style={S.input} placeholder="Sharma Traders" value={client.name} onChange={e => setClient(c => ({...c, name: e.target.value}))} />
            </div>
            <div>
              <label style={S.label}>GSTIN (Optional)</label>
              <input style={S.input} placeholder="27XXXXX" value={client.gstin} onChange={e => setClient(c => ({...c, gstin: e.target.value.toUpperCase()}))} />
            </div>
          </div>
          <div>
            <label style={S.label}>ADDRESS</label>
            <input style={S.input} placeholder="Street, Area" value={client.address} onChange={e => setClient(c => ({...c, address: e.target.value}))} />
          </div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>CITY</label>
              <input style={S.input} placeholder="Mumbai" value={client.city} onChange={e => setClient(c => ({...c, city: e.target.value}))} />
            </div>
            <div>
              <label style={S.label}>STATE</label>
              <select style={S.select} value={client.state} onChange={e => setClient(c => ({...c, state: e.target.value}))}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>PIN CODE</label>
              <input style={S.input} placeholder="400001" value={client.pin} onChange={e => setClient(c => ({...c, pin: e.target.value}))} />
            </div>
            <div>
              <label style={S.label}>PHONE</label>
              <input style={S.input} placeholder="9876543210" value={client.phone} onChange={e => setClient(c => ({...c, phone: e.target.value}))} />
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={S.card}>
        <p style={S.sectionTitle}>Items / Services</p>
        {items.map((item, idx) => {
          const c = calcItem(item);
          return (
            <div key={item.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#2563EB", fontFamily: "inherit", fontWeight: 700 }}>ITEM {idx + 1}</span>
                {items.length > 1 && <button onClick={() => removeItem(item.id)} style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "3px 10px", color: "#DC2626", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✕ Remove</button>}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>DESCRIPTION *</label>
                <input style={S.input} placeholder="Product / Service name" value={item.desc} onChange={e => updateItem(item.id, "desc", e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={S.label}>HSN/SAC CODE</label>
                  <input style={S.input} placeholder="1234" value={item.hsn} onChange={e => updateItem(item.id, "hsn", e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>UNIT</label>
                  <select style={S.select} value={item.unit} onChange={e => updateItem(item.id, "unit", e.target.value)}>
                    {["Nos","Kg","Ltr","Mtr","Box","Set","Pair","Hrs","Days","Pcs"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>QUANTITY *</label>
                  <input type="number" style={S.input} placeholder="1" value={item.qty} onChange={e => updateItem(item.id, "qty", e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>RATE (₹) *</label>
                  <input type="number" style={S.input} placeholder="1000" value={item.rate} onChange={e => updateItem(item.id, "rate", e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>GST RATE</label>
                  <select style={S.select} value={item.gst} onChange={e => updateItem(item.id, "gst", e.target.value)}>
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <label style={S.label}>AMOUNT</label>
                  <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 700, color: "#2563EB" }}>₹{fmt(c.total)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <button onClick={addItem} style={{ ...S.btnOutline, width: "100%", borderStyle: "dashed", borderRadius: 8 }}>+ Add Item</button>
      </div>

      {/* Totals */}
      <div style={S.card}>
        <p style={S.sectionTitle}>Summary</p>
        <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16, border: "1px solid #E2E8F0" }}>
          {[
            { label: "Subtotal", value: "₹" + fmt(subtotal) },
            ...(isIGST
              ? [{ label: "IGST", value: "₹" + fmt(totalGST) }]
              : [{ label: "CGST", value: "₹" + fmt(totalGST/2) }, { label: "SGST", value: "₹" + fmt(totalGST/2) }]
            ),
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>{r.label}</span>
              <span style={{ fontSize: 13, color: "#1E293B", fontWeight: 600 }}>{r.value}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px" }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1E293B" }}>GRAND TOTAL</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#059669" }}>₹{fmt(grandTotal)}</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748B", fontStyle: "italic", marginTop: 4 }}>{toWords(Math.round(grandTotal))}</div>
        </div>
      </div>

      {/* Notes */}
      <div style={S.card}>
        <p style={S.sectionTitle}>NOTES & TERMS</p>
        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>NOTES</label>
          <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" }} value={meta.notes} onChange={e => setMeta(m => ({...m, notes: e.target.value}))} />
        </div>
        <div>
          <label style={S.label}>TERMS & CONDITIONS</label>
          <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" }} value={meta.terms} onChange={e => setMeta(m => ({...m, terms: e.target.value}))} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button style={{ ...S.btn("#10B981"), flex: 1, padding: "14px 20px", fontSize: 14 }} onClick={() => { if (!client.name) { alert("Client ka naam daalo!"); return; } if (items.some(i => !i.desc || !i.qty || !i.rate)) { alert("Saare items complete karo!"); return; } setShowPreview(true); }}>
          👁️ Preview Invoice
        </button>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 200, overflowY: "auto", padding: 16 }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button style={S.btn("#3B82F6")} onClick={handlePrint}>🖨️ Print / Save PDF</button>
              <button style={{ ...S.btn("#10B981") }} onClick={() => { saveInvoice(); setShowPreview(false); }}>💾 Save Invoice</button>
              <button style={S.btnOutline} onClick={() => setShowPreview(false)}>✕ Close</button>
            </div>
            {renderInvoicePrint({ meta, client, items, biz, grandTotal, subtotal, totalGST, isIGST, computed })}
          </div>
        </div>
      )}
    </div>
  );

  // ── INVOICE LIST ──────────────────────────────────────────
  const invoiceListView = (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ ...S.sectionTitle, margin: 0 }}>📋 All Invoices ({invoices.length})</p>
        <button style={S.btn()} onClick={() => setScreen("New Invoice")}>+ New</button>
      </div>
      {invoices.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
          <p style={{ color: "#64748B", fontSize: 14 }}>Koi invoice nahi abhi tak</p>
          <button style={{ ...S.btn(), marginTop: 12 }} onClick={() => setScreen("New Invoice")}>Pehla Invoice Banao</button>
        </div>
      ) : invoices.map(inv => (
        <div key={inv.id} style={{ ...S.card, cursor: "pointer", marginBottom: 10 }} onClick={() => { setPreviewInv(inv); setScreen("preview"); }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1E293B", marginBottom: 4 }}>{inv.meta.invoiceNo}</div>
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 3 }}>{inv.client.name || "—"}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "inherit" }}>{inv.meta.date}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#059669" }}>₹{fmt(inv.grandTotal)}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{inv.items.length} item{inv.items.length !== 1 ? "s" : ""}</div>
              <div style={{ fontSize: 11, color: "#2563EB", marginTop: 4, fontWeight: 600 }}>Tap to view →</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── SETTINGS ──────────────────────────────────────────────
  const settingsView = (
    <div>
      <p style={{ ...S.sectionTitle, fontSize: 13, marginBottom: 16 }}>⚙️ BUSINESS SETUP</p>
      <div style={S.card}>
        <p style={S.sectionTitle}>BUSINESS INFORMATION</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={S.label}>BUSINESS NAME *</label>
            <input style={S.input} placeholder="Sharma Enterprises" value={biz.name} onChange={e => setBiz(b => ({...b, name: e.target.value}))} />
          </div>
          <div>
            <label style={S.label}>GSTIN *</label>
            <input style={S.input} placeholder="27AABCS1429B1ZB" value={biz.gstin} onChange={e => setBiz(b => ({...b, gstin: e.target.value.toUpperCase()}))} />
          </div>
          <div>
            <label style={S.label}>ADDRESS</label>
            <input style={S.input} placeholder="Shop no, Street, Area" value={biz.address} onChange={e => setBiz(b => ({...b, address: e.target.value}))} />
          </div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>CITY</label>
              <input style={S.input} placeholder="Mumbai" value={biz.city} onChange={e => setBiz(b => ({...b, city: e.target.value}))} />
            </div>
            <div>
              <label style={S.label}>STATE</label>
              <select style={S.select} value={biz.state} onChange={e => setBiz(b => ({...b, state: e.target.value}))}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>PIN CODE</label>
              <input style={S.input} placeholder="400001" value={biz.pin} onChange={e => setBiz(b => ({...b, pin: e.target.value}))} />
            </div>
            <div>
              <label style={S.label}>PHONE</label>
              <input style={S.input} placeholder="9876543210" value={biz.phone} onChange={e => setBiz(b => ({...b, phone: e.target.value}))} />
            </div>
          </div>
          <div>
            <label style={S.label}>EMAIL</label>
            <input style={S.input} placeholder="business@email.com" value={biz.email} onChange={e => setBiz(b => ({...b, email: e.target.value}))} />
          </div>
        </div>
      </div>

      <div style={S.card}>
        <p style={S.sectionTitle}>BANK DETAILS (For Invoice)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={S.label}>BANK NAME</label>
            <input style={S.input} placeholder="State Bank of India" value={biz.bank} onChange={e => setBiz(b => ({...b, bank: e.target.value}))} />
          </div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>ACCOUNT NUMBER</label>
              <input style={S.input} placeholder="1234567890" value={biz.account} onChange={e => setBiz(b => ({...b, account: e.target.value}))} />
            </div>
            <div>
              <label style={S.label}>IFSC CODE</label>
              <input style={S.input} placeholder="SBIN0001234" value={biz.ifsc} onChange={e => setBiz(b => ({...b, ifsc: e.target.value.toUpperCase()}))} />
            </div>
          </div>
        </div>
      </div>

      <button style={{ ...S.btn("#10B981"), width: "100%", padding: 14, fontSize: 14 }} onClick={() => { if (!biz.name || !biz.gstin) { alert("Business naam aur GSTIN zaroori hai!"); return; } set(ref(db, "business"), biz); setBizSaved(true); setScreen("Dashboard"); alert("✅ Business details save ho gayi!"); }}>
        💾 Save Business Details
      </button>
    </div>
  );


  // ── PREVIEW SCREEN ────────────────────────────────────────
  const previewScreenView = (() => {
    if (!previewInv) return null;
    const inv = { ...previewInv, computed: previewInv.items.map(calcItem) };
    return (
      <div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <button style={S.btn()} onClick={handlePrint}>🖨️ Print / PDF</button>
          <button style={S.btnOutline} onClick={() => setScreen("My Invoices")}>← Back</button>
        </div>
        {renderInvoicePrint(inv)}
      </div>
    );
  })();

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={S.app}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus, textarea:focus { border-color: #3B82F6 !important; box-shadow: 0 0 0 3px #3B82F622; }
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; top: 0; left: 0; width: 100%; }
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }

        /* ── Mobile responsiveness ── */
        @media (max-width: 560px) {
          .app-header { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; padding: 14px 16px !important; }
          .app-nav { width: 100% !important; }
          .app-nav-btn { padding: 8px 10px !important; font-size: 11px !important; }
          .app-nav-label { display: inline; }
        }
        @media (max-width: 380px) {
          .app-subtitle { display: none; }
          .app-nav-btn { padding: 7px 8px !important; font-size: 10px !important; }
        }
        .invoice-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .invoice-table-wrap table { min-width: 640px; }
        .scroll-hint { display: none; }
        @media (max-width: 700px) {
          .scroll-hint { display: block; text-align: center; font-size: 10px; color: #94A3B8; padding: 6px; background: #F8FAFC; }
        }
      `}</style>

      {/* Header */}
      <div style={S.header} className="app-header">
        <div style={S.logo}>
          <div style={S.logoBox}>₹</div>
          <div>
            <div style={S.logoText}>GST Invoice</div>
            <div style={{ fontSize: 9, color: "#64748B", fontFamily: "inherit", letterSpacing: 1.5 }} className="app-subtitle">PROFESSIONAL TOOL</div>
          </div>
        </div>
        <div style={S.nav} className="app-nav">
          {SCREENS.map(s => (
            <button key={s} style={S.navBtn(screen === s)} onClick={() => setScreen(s)} className="app-nav-btn">
              {s === "Dashboard" ? "🏠" : s === "New Invoice" ? "➕" : s === "My Invoices" ? "📋" : "⚙️"} <span className="app-nav-label">{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={S.body}>
        {screen === "Dashboard" && dashboardView}
        {screen === "New Invoice" && newInvoiceView}
        {screen === "My Invoices" && invoiceListView}
        {screen === "Settings" && settingsView}
        {screen === "preview" && previewScreenView}
      </div>
    </div>
  );
}