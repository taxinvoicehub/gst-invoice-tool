import { useState, useRef, useEffect } from "react";
import { ref, onValue, set } from "firebase/database";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth, googleProvider } from "./firebase";

// ── helpers ──────────────────────────────────────────────
const GST_RATES = [0, 5, 12, 18, 28];

// HSN Code → { gst, desc } database (common items)
const HSN_DB = {
  // 0% - Essentials
  "0101": { gst: 0, desc: "Live horses/asses/mules" },
  "0201": { gst: 0, desc: "Fresh/chilled meat" },
  "0401": { gst: 0, desc: "Fresh milk" },
  "0701": { gst: 0, desc: "Fresh vegetables" },
  "0801": { gst: 0, desc: "Fresh fruits" },
  "1001": { gst: 0, desc: "Wheat/meslin" },
  "1006": { gst: 0, desc: "Rice" },
  "1101": { gst: 0, desc: "Wheat/meslin flour" },
  "2501": { gst: 0, desc: "Salt (common/table)" },
  "4901": { gst: 0, desc: "Printed books/newspapers" },
  "4902": { gst: 0, desc: "Newspapers/journals" },
  // 5%
  "0902": { gst: 5, desc: "Tea (green/black)" },
  "0901": { gst: 5, desc: "Coffee (roasted/not)" },
  "1211": { gst: 5, desc: "Plants/spices/seeds" },
  "1701": { gst: 5, desc: "Cane/beet sugar" },
  "1902": { gst: 5, desc: "Pasta/noodles" },
  "2106": { gst: 5, desc: "Food preparations" },
  "2202": { gst: 5, desc: "Mineral water (packaged)" },
  "2710": { gst: 5, desc: "Petroleum oils/kerosene" },
  "3002": { gst: 5, desc: "Vaccines/blood/medicines" },
  "3004": { gst: 5, desc: "Medicaments/medicines" },
  "6101": { gst: 5, desc: "Woollen overcoats/clothing" },
  "6201": { gst: 5, desc: "Men's overcoats (cotton)" },
  "9985": { gst: 5, desc: "Transport services" },
  "9954": { gst: 5, desc: "Construction services (affordable housing)" },
  // 12%
  "3926": { gst: 12, desc: "Plastic articles" },
  "4002": { gst: 12, desc: "Rubber (synthetic)" },
  "4811": { gst: 12, desc: "Paper/paperboard coated" },
  "6006": { gst: 12, desc: "Fabrics (woven/knitted)" },
  "6403": { gst: 12, desc: "Footwear (leather)" },
  "6801": { gst: 12, desc: "Worked slate/stone (mosaic)" },
  "7010": { gst: 12, desc: "Glass bottles/containers" },
  "8443": { gst: 12, desc: "Printing machinery" },
  "8471": { gst: 12, desc: "Computers/laptops" },
  "8517": { gst: 12, desc: "Telephone/mobile phones" },
  "8528": { gst: 12, desc: "TV monitors/projectors" },
  "9018": { gst: 12, desc: "Medical instruments" },
  "9403": { gst: 12, desc: "Furniture (other)" },
  "9992": { gst: 12, desc: "Education services" },
  // 18% - Most common
  "2401": { gst: 18, desc: "Tobacco (unmanufactured)" },
  "2804": { gst: 18, desc: "Industrial gases (oxygen etc)" },
  "3208": { gst: 18, desc: "Paints/varnishes" },
  "3209": { gst: 18, desc: "Water-based paints" },
  "3214": { gst: 18, desc: "Glaziers putty/sealants" },
  "3301": { gst: 18, desc: "Essential oils/perfumes" },
  "3401": { gst: 18, desc: "Soap/washing products" },
  "3808": { gst: 18, desc: "Insecticides/pesticides" },
  "3901": { gst: 18, desc: "Polymers/polyethylene" },
  "3917": { gst: 18, desc: "PVC pipes/tubes" },
  "3922": { gst: 18, desc: "Baths/showers/sinks (plastic)" },
  "4008": { gst: 18, desc: "Rubber plates/sheets" },
  "4016": { gst: 18, desc: "Rubber articles" },
  "4407": { gst: 18, desc: "Wood sawn/chipped" },
  "4412": { gst: 18, desc: "Plywood/veneer panels" },
  "4418": { gst: 18, desc: "Builders' joinery (wood)" },
  "4421": { gst: 18, desc: "WPC/wood articles" },
  "4802": { gst: 18, desc: "Uncoated paper/writing paper" },
  "5402": { gst: 18, desc: "Synthetic yarn/filament" },
  "5603": { gst: 18, desc: "Nonwovens fabric" },
  "6802": { gst: 18, desc: "Granite/marble (worked)" },
  "6901": { gst: 18, desc: "Bricks/tiles/ceramic" },
  "6904": { gst: 18, desc: "Ceramic building bricks" },
  "7002": { gst: 18, desc: "Glass (in balls/rods)" },
  "7201": { gst: 18, desc: "Pig iron/cast iron" },
  "7204": { gst: 18, desc: "Ferrous waste/scrap" },
  "7207": { gst: 18, desc: "Semi-finished iron/steel" },
  "7208": { gst: 18, desc: "Iron/steel flat-rolled" },
  "7210": { gst: 18, desc: "Flat-rolled iron coated" },
  "7213": { gst: 18, desc: "Iron/steel bars/rods (wire)" },
  "7214": { gst: 18, desc: "Iron/steel bars (forged)" },
  "7215": { gst: 18, desc: "Steel bars/rods (other)" },
  "7216": { gst: 18, desc: "Iron/steel angles/shapes" },
  "7217": { gst: 18, desc: "Iron/steel wire" },
  "7219": { gst: 18, desc: "Stainless steel flat-rolled" },
  "7220": { gst: 18, desc: "Stainless steel (narrow)" },
  "7222": { gst: 18, desc: "Stainless steel bars/rods" },
  "7225": { gst: 18, desc: "Flat-rolled alloy steel" },
  "7228": { gst: 18, desc: "Other alloy steel bars" },
  "7229": { gst: 18, desc: "Alloy steel wire" },
  "7301": { gst: 18, desc: "Sheet piling iron/steel" },
  "7304": { gst: 18, desc: "Tubes/pipes (seamless steel)" },
  "7308": { gst: 18, desc: "Structures (iron/steel)" },
  "7312": { gst: 18, desc: "Stranded wire/cables (iron)" },
  "7314": { gst: 18, desc: "Cloth/grill (iron/steel wire)" },
  "7317": { gst: 18, desc: "Nails/tacks/staples (steel)" },
  "7318": { gst: 18, desc: "Screws/bolts/nuts (steel)" },
  "7323": { gst: 18, desc: "Table/kitchen iron articles" },
  "7326": { gst: 18, desc: "Iron/steel articles (other)" },
  "7408": { gst: 18, desc: "Copper wire" },
  "7606": { gst: 18, desc: "Aluminium plates/sheets" },
  "7610": { gst: 18, desc: "Aluminium structures" },
  "8301": { gst: 18, desc: "Padlocks/locks (metal)" },
  "8302": { gst: 18, desc: "Hinges/handles/fittings" },
  "8311": { gst: 18, desc: "Wire/rods (welding)" },
  "8413": { gst: 18, desc: "Pumps for liquids" },
  "8414": { gst: 18, desc: "Air pumps/compressors/fans" },
  "8415": { gst: 18, desc: "Air conditioning machines" },
  "8418": { gst: 18, desc: "Refrigerators/freezers" },
  "8421": { gst: 18, desc: "Centrifuges/filters" },
  "8422": { gst: 18, desc: "Dish washing machines" },
  "8450": { gst: 18, desc: "Washing machines" },
  "8467": { gst: 18, desc: "Hand tools (pneumatic)" },
  "8481": { gst: 18, desc: "Taps/valves/fittings (pipes)" },
  "8501": { gst: 18, desc: "Electric motors/generators" },
  "8504": { gst: 18, desc: "Transformers/converters" },
  "8507": { gst: 18, desc: "Electric batteries" },
  "8536": { gst: 18, desc: "Electrical switches/boards" },
  "8544": { gst: 18, desc: "Electric wire/cable" },
  "8702": { gst: 18, desc: "Motor vehicles (10+ persons)" },
  "9405": { gst: 18, desc: "Lamps/lighting fittings" },
  "9506": { gst: 18, desc: "Sports equipment" },
  "9983": { gst: 18, desc: "IT/software services" },
  "9987": { gst: 18, desc: "Repair/maintenance services" },
  "9997": { gst: 18, desc: "Other services" },
  "9998": { gst: 18, desc: "Professional services (CA/legal)" },
  "9999": { gst: 18, desc: "Consulting/freelance services" },
  // 28%
  "2402": { gst: 28, desc: "Cigars/cigarettes/tobacco" },
  "2403": { gst: 28, desc: "Tobacco products" },
  "2523": { gst: 28, desc: "Portland cement/clinker" },
  "2523": { gst: 28, desc: "Portland cement" },
  "3303": { gst: 28, desc: "Perfumes/toilet waters" },
  "3304": { gst: 28, desc: "Beauty/makeup preparations" },
  "3305": { gst: 28, desc: "Hair preparations/shampoo" },
  "8703": { gst: 28, desc: "Motor cars/vehicles" },
  "8711": { gst: 28, desc: "Motorcycles/mopeds" },
  "8901": { gst: 28, desc: "Cruise ships/vessels" },
  "9504": { gst: 28, desc: "Video games/gaming consoles" },
};

// HSN lookup function
const lookupHSN = (code) => {
  if (!code || code.length < 4) return null;
  // Try exact match first, then 4-digit prefix
  return HSN_DB[code] || HSN_DB[code.substring(0, 4)] || null;
};
const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Lakshadweep","Puducherry"];

function calcItem(item) {
  const base = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
  const discAmt = base * (parseFloat(item.discount) || 0) / 100;
  const taxable = base - discAmt;
  const gstAmt = taxable * (parseFloat(item.gst) || 0) / 100;
  return { base, discAmt, taxable, gstAmt, total: taxable + gstAmt };
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
const newItem = () => ({ id: Date.now(), desc: "", hsn: "", qty: "", rate: "", gst: 18, unit: "Nos", size: "", discount: 0 });

const UNITS = ["Nos","Kg","Ltr","Mtr","Box","Set","Pair","Hrs","Days","Pcs","SQF","SFT","RFT","CFT","MT","Ton","Bag","Roll","Sheet","Bundle","Dozen"];

// ── initial state ─────────────────────────────────────────
const initBiz = { name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", phone: "", email: "", bank: "", ifsc: "", account: "", cin: "" };
const initClient = { name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", phone: "", email: "", shipName: "", shipAddress: "", shipCity: "", shipState: "Maharashtra", shipPin: "" };
const initMeta = { invoiceNo: "INV-001", date: today(), dueDate: "", placeOfSupply: "Maharashtra", notes: "Thank you for your business!", terms: "1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if payment is not made within stipulated time.\n3. Subject to local jurisdiction only.", reverseCharge: "N", copyType: "Original", poNumber: "" };

// ── SCREENS ───────────────────────────────────────────────
const SCREENS = ["Dashboard", "New Invoice", "My Invoices", "Settings"];

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
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

  // ── Auth listener + per-user data load ───────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        // load this user's business details
        const bizRef = ref(db, `users/${u.uid}/business`);
        onValue(bizRef, (snap) => {
          const data = snap.val();
          if (data) { setBiz(data); setBizSaved(true); }
          else { setBiz(initBiz); setBizSaved(false); }
        });
        // load this user's invoices
        const invRef = ref(db, `users/${u.uid}/invoices`);
        onValue(invRef, (snap) => {
          const data = snap.val();
          if (data) setInvoices(Object.values(data).sort((a, b) => b.id - a.id));
          else setInvoices([]);
        });
      }
    });
    return () => unsub();
  }, []);

  // ── compute totals ──────────────────────────────────────
  const computed = items.map(calcItem);
  const subtotal = computed.reduce((s, c) => s + c.taxable, 0);
  const totalGST = computed.reduce((s, c) => s + c.gstAmt, 0);
  const totalDiscount = computed.reduce((s, c) => s + c.discAmt, 0);
  const grandTotal = subtotal + totalGST;
  const isIGST = biz.state !== meta.placeOfSupply;

  // ── item helpers ────────────────────────────────────────
  const addItem = () => setItems(p => [...p, newItem()]);
  const removeItem = id => setItems(p => p.filter(i => i.id !== id));
  const updateItem = (id, key, val) => setItems(p => p.map(i => i.id === id ? { ...i, [key]: val } : i));

  // ── save invoice ────────────────────────────────────────
  const saveInvoice = () => {
    const inv = { id: Date.now(), meta: { ...meta }, client: { ...client }, items: [...items], biz: { ...biz }, grandTotal, subtotal, totalGST, isIGST };
    if (user) set(ref(db, `users/${user.uid}/invoices/${inv.id}`), inv);
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
    const invComputed = computed || items.map(calcItem);
    const invSubtotal = invComputed.reduce((s,c) => s + c.taxable, 0);
    const invTotalGST = invComputed.reduce((s,c) => s + c.gstAmt, 0);
    const invDiscount = invComputed.reduce((s,c) => s + c.discAmt, 0);
    const invGrand = invSubtotal + invTotalGST;

    // Tax rate-wise breakup
    const taxBreakup = {};
    items.forEach((item, i) => {
      const c = invComputed[i];
      const rate = item.gst;
      if (!taxBreakup[rate]) taxBreakup[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
      taxBreakup[rate].taxable += c.taxable;
      if (isIGST) taxBreakup[rate].igst += c.gstAmt;
      else { taxBreakup[rate].cgst += c.gstAmt/2; taxBreakup[rate].sgst += c.gstAmt/2; }
    });

    const ps = { background: "#fff", color: "#111", borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px #00000044", fontFamily: "Arial, sans-serif", fontSize: 12 };
    return (
      <div ref={printRef} id="print-area" style={ps}>
        <style>{`@media print { body { margin: 0; } }`}</style>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)", padding: "20px 24px", color: "#fff", position: "relative" }}>
          {/* Original Copy badge */}
          <div style={{ position: "absolute", top: 12, right: 12, background: "#ffffff22", border: "1px solid #ffffff44", borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{(meta.copyType || "Original").toUpperCase()} COPY</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 2 }}>{biz.name || "Your Business Name"}</div>
              {biz.cin && <div style={{ fontSize: 10, opacity: 0.7 }}>CIN: {biz.cin}</div>}
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>{biz.address}{biz.city ? ", " + biz.city : ""}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>{biz.state}{biz.pin ? " - " + biz.pin : ""}</div>
              {biz.phone && <div style={{ fontSize: 11, opacity: 0.85 }}>📞 {biz.phone}</div>}
              {biz.email && <div style={{ fontSize: 11, opacity: 0.85 }}>✉ {biz.email}</div>}
              {biz.gstin && <div style={{ fontSize: 11, marginTop: 6, background: "#ffffff22", padding: "3px 10px", borderRadius: 99, display: "inline-block" }}>GSTIN: {biz.gstin}</div>}
            </div>
            <div style={{ textAlign: "right", marginTop: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>TAX INVOICE</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>#{meta.invoiceNo}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Date: {meta.date}</div>
              {meta.dueDate && <div style={{ fontSize: 11, opacity: 0.7 }}>Due: {meta.dueDate}</div>}
              {meta.poNumber && <div style={{ fontSize: 11, opacity: 0.7 }}>PO: {meta.poNumber}</div>}
              <div style={{ fontSize: 11, opacity: 0.7 }}>Reverse Charge: {meta.reverseCharge || "N"}</div>
            </div>
          </div>
        </div>

        {/* Bill To + Ship To + Invoice Info */}
        <div style={{ display: "grid", gridTemplateColumns: client.shipAddress ? "1fr 1fr 1fr" : "1fr 1fr", gap: 0, borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ padding: "14px 20px", borderRight: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>BILL TO</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>{client.name || "—"}</div>
            {client.gstin && <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>GSTIN: {client.gstin}</div>}
            {client.address && <div style={{ fontSize: 10, color: "#374151", marginTop: 3 }}>{client.address}</div>}
            {client.city && <div style={{ fontSize: 10, color: "#374151" }}>{client.city}, {client.state} {client.pin}</div>}
            {client.phone && <div style={{ fontSize: 10, color: "#374151", marginTop: 2 }}>📞 {client.phone}</div>}
          </div>
          {client.shipAddress && (
            <div style={{ padding: "14px 20px", borderRight: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>SHIP TO</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>{client.shipName || client.name}</div>
              <div style={{ fontSize: 10, color: "#374151", marginTop: 3 }}>{client.shipAddress}</div>
              {client.shipCity && <div style={{ fontSize: 10, color: "#374151" }}>{client.shipCity}, {client.shipState} {client.shipPin}</div>}
            </div>
          )}
          <div style={{ padding: "14px 20px" }}>
            <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>INVOICE INFO</div>
            {[
              ["Invoice No", meta.invoiceNo],
              ["Date", meta.date],
              ["Due Date", meta.dueDate || "—"],
              ["Place of Supply", meta.placeOfSupply],
              ["GST Type", isIGST ? "IGST" : "CGST + SGST"],
              ["Reverse Charge", meta.reverseCharge || "N"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: "#6B7280", fontSize: 10 }}>{k}:</span>
                <span style={{ fontWeight: 600, fontSize: 10 }}>{v}</span>
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
                {["S.N.", "Description of Goods", "HSN/SAC", "Qty", "Unit", "Price", "Disc%", "CGST Rate", "CGST Amt", "SGST Rate", "SGST Amt", "Amount"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: ["Price","CGST Amt","SGST Amt","Amount"].includes(h) ? "right" : ["CGST Rate","SGST Rate","Disc%"].includes(h) ? "center" : "left", fontSize: 9, color: "#6B7280", fontWeight: 700, letterSpacing: 0.5, borderBottom: "2px solid #E5E7EB", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const c = invComputed[i];
                const halfGST = item.gst / 2;
                return (
                  <tr key={item.id || i} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "8px 10px", textAlign: "center", color: "#9CA3AF", fontSize: 10 }}>{i + 1}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 600, color: "#111", fontSize: 11 }}>
                      {item.desc}
                      {item.size && <div style={{ fontSize: 9, color: "#6B7280", marginTop: 2 }}>{item.size}</div>}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#6B7280", fontSize: 10 }}>{item.hsn || "—"}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center", fontSize: 10 }}>{item.qty}</td>
                    <td style={{ padding: "8px 10px", color: "#6B7280", fontSize: 10 }}>{item.unit}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 10 }}>₹{fmt(item.rate)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center", color: "#6B7280", fontSize: 10 }}>{item.discount > 0 ? item.discount + "%" : "—"}</td>
                    {isIGST ? (
                      <>
                        <td style={{ padding: "8px 10px", textAlign: "center", fontSize: 10 }} colSpan={2}>IGST {item.gst}%</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 10 }} colSpan={2}>₹{fmt(c.gstAmt)}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "8px 10px", textAlign: "center", fontSize: 10 }}>{halfGST}%</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 10 }}>₹{fmt(c.gstAmt/2)}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", fontSize: 10 }}>{halfGST}%</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 10 }}>₹{fmt(c.gstAmt/2)}</td>
                      </>
                    )}
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#1D4ED8", fontSize: 11 }}>₹{fmt(c.total)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#F8FAFC", fontWeight: 700 }}>
                <td colSpan={3} style={{ padding: "8px 10px", fontSize: 10, color: "#374151" }}>Grand Total: {items.reduce((s,i)=>(parseFloat(i.qty)||0)+s,0)} items</td>
                <td colSpan={9} style={{ padding: "8px 10px", textAlign: "right", fontSize: 12, color: "#1D4ED8" }}>₹{fmt(invGrand || grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Tax Summary Table */}
        <div style={{ borderTop: "1px solid #E5E7EB", padding: "12px 20px", background: "#F8FAFC" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 6 }}>TAX SUMMARY</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr>
                {["Tax Rate", "Taxable Amt", ...(isIGST ? ["IGST Amt"] : ["CGST Amt", "SGST Amt"]), "Total Tax"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "#6B7280", fontWeight: 700, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(taxBreakup).map(([rate, t]) => (
                <tr key={rate}>
                  <td style={{ padding: "4px 8px" }}>{rate}%</td>
                  <td style={{ padding: "4px 8px" }}>₹{fmt(t.taxable)}</td>
                  {isIGST ? <td style={{ padding: "4px 8px" }}>₹{fmt(t.igst)}</td> : <><td style={{ padding: "4px 8px" }}>₹{fmt(t.cgst)}</td><td style={{ padding: "4px 8px" }}>₹{fmt(t.sgst)}</td></>}
                  <td style={{ padding: "4px 8px", fontWeight: 700 }}>₹{fmt(t.cgst + t.sgst + t.igst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "2px solid #E5E7EB" }}>
          <div style={{ padding: "16px 20px" }}>
            {biz.bank && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: 1.5, marginBottom: 4, fontWeight: 700 }}>BANK DETAILS</div>
                <div style={{ fontSize: 10, color: "#374151" }}>Bank: {biz.bank}</div>
                <div style={{ fontSize: 10, color: "#374151" }}>A/C: {biz.account}</div>
                <div style={{ fontSize: 10, color: "#374151" }}>IFSC: {biz.ifsc}</div>
              </div>
            )}
            {meta.notes && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#6B7280", letterSpacing: 1.5, marginBottom: 4, fontWeight: 700 }}>NOTES</div>
                <div style={{ fontSize: 10, color: "#374151" }}>{meta.notes}</div>
              </div>
            )}
          </div>
          <div style={{ padding: "16px 20px", background: "#F8FAFC", borderLeft: "1px solid #E5E7EB" }}>
            {[
              ["Gross Total", "₹" + fmt(invComputed.reduce((s,c)=>s+c.base,0))],
              ...(invDiscount > 0 ? [["Discount", "- ₹" + fmt(invDiscount)]] : []),
              ["Taxable Amount", "₹" + fmt(invSubtotal || subtotal)],
              ...(isIGST ? [["IGST", "₹" + fmt(invTotalGST || totalGST)]] : [["CGST", "₹" + fmt((invTotalGST||totalGST)/2)], ["SGST", "₹" + fmt((invTotalGST||totalGST)/2)]]),
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #E5E7EB", fontSize: 11 }}>
                <span style={{ color: "#6B7280" }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 2px", marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>TOTAL</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#1D4ED8" }}>₹{fmt(invGrand || grandTotal)}</span>
            </div>
            <div style={{ fontSize: 9, color: "#9CA3AF", fontStyle: "italic", marginTop: 3 }}>{toWords(Math.round(invGrand || grandTotal))}</div>
          </div>
        </div>

        {/* Terms + Authorised Signatory */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid #E5E7EB" }}>
          <div style={{ padding: "12px 20px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 4 }}>TERMS & CONDITIONS</div>
            <div style={{ fontSize: 9, color: "#6B7280", whiteSpace: "pre-line" }}>{meta.terms}</div>
            <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 8 }}>E. & O.E.</div>
          </div>
          <div style={{ padding: "12px 20px", borderLeft: "1px solid #E5E7EB", textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 4 }}>For {biz.name || "Your Business"}</div>
            <div style={{ height: 40 }}></div>
            <div style={{ fontSize: 10, color: "#374151", borderTop: "1px solid #374151", paddingTop: 4, display: "inline-block", minWidth: 120 }}>Authorised Signatory</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#1E3A5F", padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#93C5FD", fontSize: 10 }}>This is a computer generated invoice</div>
          <div style={{ color: "#93C5FD", fontSize: 10, opacity: 0.7 }}>GST Invoice Tool</div>
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
          <div>
            <label style={S.label}>REVERSE CHARGE</label>
            <select style={S.select} value={meta.reverseCharge} onChange={e => setMeta(m => ({...m, reverseCharge: e.target.value}))}>
              <option value="N">N — No</option>
              <option value="Y">Y — Yes</option>
            </select>
          </div>
          <div>
            <label style={S.label}>INVOICE COPY TYPE</label>
            <select style={S.select} value={meta.copyType} onChange={e => setMeta(m => ({...m, copyType: e.target.value}))}>
              {["Original","Duplicate","Triplicate"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>PO / ORDER NO. <span style={{color:"#94A3B8",fontWeight:400}}>(optional)</span></label>
            <input style={S.input} placeholder="PO-12345" value={meta.poNumber} onChange={e => setMeta(m => ({...m, poNumber: e.target.value}))} />
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

      {/* Shipped To */}
      <div style={S.card}>
        <p style={S.sectionTitle}>SHIP TO <span style={{color:"#94A3B8",fontWeight:400,fontSize:10}}>(optional — if different from Bill To)</span></p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>NAME</label>
              <input style={S.input} placeholder="Same as Bill To" value={client.shipName} onChange={e => setClient(c => ({...c, shipName: e.target.value}))} />
            </div>
            <div>
              <label style={S.label}>CITY</label>
              <input style={S.input} placeholder="City" value={client.shipCity} onChange={e => setClient(c => ({...c, shipCity: e.target.value}))} />
            </div>
          </div>
          <div>
            <label style={S.label}>ADDRESS</label>
            <input style={S.input} placeholder="Delivery address" value={client.shipAddress} onChange={e => setClient(c => ({...c, shipAddress: e.target.value}))} />
          </div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>STATE</label>
              <select style={S.select} value={client.shipState} onChange={e => setClient(c => ({...c, shipState: e.target.value}))}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>PIN</label>
              <input style={S.input} placeholder="400001" value={client.shipPin} onChange={e => setClient(c => ({...c, shipPin: e.target.value}))} />
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
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>SIZE / SPECIFICATION <span style={{color:"#94A3B8",fontWeight:400}}>(optional)</span></label>
                <input style={S.input} placeholder="e.g. 15.6X47.4, 8x4 ft, 2mm thick" value={item.size} onChange={e => updateItem(item.id, "size", e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={S.label}>HSN/SAC CODE <span style={{color:"#94A3B8",fontWeight:400}}>(optional)</span></label>
                  <input style={S.input} placeholder="e.g. 7213" value={item.hsn}
                    onChange={e => {
                      const code = e.target.value.replace(/\D/g,"");
                      const found = lookupHSN(code);
                      updateItem(item.id, "hsn", code);
                      if (found) updateItem(item.id, "gst", found.gst);
                    }}
                  />
                  {item.hsn && (() => {
                    const found = lookupHSN(item.hsn);
                    if (found) return (
                      <div style={{ fontSize: 11, marginTop: 4, color: "#059669", fontWeight: 600 }}>
                        ✅ {found.desc} — GST {found.gst}% auto-set
                      </div>
                    );
                    if (item.hsn.length >= 4) return (
                      <div style={{ fontSize: 11, marginTop: 4, color: "#D97706" }}>
                        ⚠️ HSN not found — manually select GST rate
                      </div>
                    );
                    return null;
                  })()}
                </div>
                <div>
                  <label style={S.label}>UNIT</label>
                  <select style={S.select} value={item.unit} onChange={e => updateItem(item.id, "unit", e.target.value)}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
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
                  <label style={S.label}>DISCOUNT % <span style={{color:"#94A3B8",fontWeight:400}}>(optional)</span></label>
                  <input type="number" style={S.input} placeholder="0" value={item.discount} onChange={e => updateItem(item.id, "discount", e.target.value)} />
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
            { label: "Gross Total", value: "₹" + fmt(computed.reduce((s,c)=>s+c.base,0)) },
            ...(totalDiscount > 0 ? [{ label: "Discount", value: "- ₹" + fmt(totalDiscount), color: "#DC2626" }] : []),
            { label: "Taxable Amount", value: "₹" + fmt(subtotal) },
            ...(isIGST
              ? [{ label: "IGST", value: "₹" + fmt(totalGST) }]
              : [{ label: "CGST", value: "₹" + fmt(totalGST/2) }, { label: "SGST", value: "₹" + fmt(totalGST/2) }]
            ),
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: 13, color: "#64748B" }}>{r.label}</span>
              <span style={{ fontSize: 13, color: r.color || "#1E293B", fontWeight: 600 }}>{r.value}</span>
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
        <button style={{ ...S.btn("#059669"), flex: 1, padding: "14px 20px", fontSize: 14 }} onClick={() => { if (!client.name) { alert("Client ka naam daalo!"); return; } if (items.some(i => !i.desc || !i.qty || !i.rate)) { alert("Saare items complete karo!"); return; } setShowPreview(true); }}>
          👁️ Preview Invoice
        </button>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 200, overflowY: "auto", padding: 16 }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <button style={S.btn("#2563EB")} onClick={handlePrint}>🖨️ Print / Save PDF</button>
              <button style={S.btn("#059669")} onClick={() => { saveInvoice(); setShowPreview(false); }}>💾 Save Invoice</button>
              <button style={S.btn("#25D366")} onClick={() => { const msg = `GST Invoice ${meta.invoiceNo}\nClient: ${client.name}\nAmount: ₹${fmt(grandTotal)}\nDate: ${meta.date}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`); }}>📱 WhatsApp Share</button>
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

      <button style={{ ...S.btn("#059669"), width: "100%", padding: 14, fontSize: 14 }} onClick={() => { if (!biz.name || !biz.gstin) { alert("Business naam aur GSTIN zaroori hai!"); return; } if (user) set(ref(db, `users/${user.uid}/business`), biz); setBizSaved(true); setScreen("Dashboard"); alert("✅ Business details save ho gayi!"); }}>
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

  // Loading screen
  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 auto 16px" }}>₹</div>
        <p style={{ color: "#64748B", fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );

  // Login screen
  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, maxWidth: 380, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(15,23,42,0.08)", border: "1px solid #E2E8F0" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 auto 20px" }}>₹</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>GST Invoice Tool</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 8 }}>Professional GST invoicing for Indian businesses</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          {["✅ Free to use", "🔒 Secure", "📱 Mobile friendly"].map(t => (
            <span key={t} style={{ fontSize: 11, background: "#EFF6FF", color: "#2563EB", padding: "4px 10px", borderRadius: 99, fontWeight: 600 }}>{t}</span>
          ))}
        </div>
        <button onClick={() => signInWithPopup(auth, googleProvider).catch(e => alert("Login failed: " + e.message))}
          style={{ width: "100%", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#1E293B", boxShadow: "0 1px 3px rgba(15,23,42,0.08)" }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.9 6.1C12.6 13 17.9 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.8-2.1 5.2-4.5 6.8l7.1 5.5c4.1-3.8 6.5-9.4 6.5-16.3z"/><path fill="#FBBC05" d="M10.6 28.6A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.1-6.2z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.1-5.5c-2 1.4-4.6 2.2-8.1 2.2-6.1 0-11.3-4.1-13.2-9.6l-8 6.2C6.6 42.6 14.7 48 24 48z"/></svg>
          Sign in with Google
        </button>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 16 }}>Apna Google account use karo — bilkul free</p>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus, textarea:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px #2563EB22; }
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={S.nav} className="app-nav">
            {SCREENS.map(s => (
              <button key={s} style={S.navBtn(screen === s)} onClick={() => setScreen(s)} className="app-nav-btn">
                {s === "Dashboard" ? "🏠" : s === "New Invoice" ? "➕" : s === "My Invoices" ? "📋" : "⚙️"} <span className="app-nav-label">{s}</span>
              </button>
            ))}
          </div>
          <button onClick={() => signOut(auth)} title="Sign out" style={{ background: "transparent", border: "1px solid #334155", borderRadius: 8, padding: "7px 10px", color: "#94A3B8", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
            👤 {user.displayName?.split(" ")[0] || "User"} ↩
          </button>
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