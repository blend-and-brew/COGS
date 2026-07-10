import React, { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Coffee, Car, Fuel, Users, ShieldCheck, Plus, Trash2, RotateCcw, FileText
} from "lucide-react";

const C = {
  bg: "#FAFAF7",
  card: "#FFFFFF",
  bookingCard: "#F3E9D2",
  border: "#E7E2D6",
  bookingBorder: "#DCC79A",
  ink: "#211C15",
  sub: "#7A7264",
  accent: "#B8823D",
  rust: "#BD5A34",
  sage: "#4F7A5B",
  panel: "#211C15",
  panelCard: "#33291B",
  panelSub: "#C9BFA8",
  partner1: "#B8823D",
  partner2: "#3B2A1D",
};

const CHART_COLORS = [C.accent, C.rust, "#8A7A5E", C.sage, "#C99B5B", "#6B5B44"];
const STORAGE_KEY = "blend-and-brew-dashboard-v4";

const defaultState = {
  beanPricePerKg: 40,
  doseG: 20,
  milkPricePerL: 2.5,
  milkMlPerCoffee: 200,
  milkWastagePct: 15,
  cupLidCostEach: 0.22,
  sundriesCostEach: 0.08,
  coffeeCap: 100,

  travelOn: true,
  travelKm: 40,
  travelRate: 0.88,
  useGenerator: false,
  generatorHours: 3,
  generatorFuelLPerHour: 1.0,
  fuelPricePerL: 2.2,

  barista1Name: "Marianna",
  barista1Pct: 50,
  barista2Name: "Simon",

  overheadsOn: true,
  insurance: 15,
  servicingDepreciation: 20,
  permits: 10,
  cardFeePct: 1.7,

  customCostsOn: true,
  customFields: [
    { id: "c1", label: "", amount: 0 },
    { id: "c2", label: "", amount: 0 },
    { id: "c3", label: "", amount: 0 },
  ],
  bookingPrice: 1000,
};

function currency(n) {
  const v = isFinite(n) ? n : 0;
  return v.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 });
}

function Field({ label, value, onChange, prefix, suffix, step = "0.01", disabled }) {
  return (
    <label className="flex flex-col gap-1">
      <span style={{ fontSize: "11.5px", color: C.sub, fontWeight: 500 }}>{label}</span>
      <div className="flex items-center gap-1 rounded" style={{ border: `1px solid ${C.border}`, background: disabled ? "#F0EEE7" : C.bg, padding: "7px 10px" }}>
        {prefix && <span style={{ color: C.sub, fontSize: "13px" }}>{prefix}</span>}
        <input
          type="number" step={step} min="0" value={value} disabled={disabled}
          onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
          style={{ background: "transparent", color: C.ink, width: "100%", fontSize: "14.5px", outline: "none", fontFamily: "'IBM Plex Mono', monospace" }}
        />
        {suffix && <span style={{ color: C.sub, fontSize: "12px" }}>{suffix}</span>}
      </div>
    </label>
  );
}

function ToggleSwitch({ checked, onChange, label, small }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      {label && <span style={{ fontSize: "13px", color: C.ink }}>{label}</span>}
      <div onClick={() => onChange(!checked)}
        style={{ width: small ? "34px" : "40px", height: small ? "19px" : "22px", borderRadius: "999px", background: checked ? C.accent : "#DCD6C6", position: "relative", transition: "background 0.2s ease", flexShrink: 0 }}>
        <div style={{ width: small ? "14px" : "16px", height: small ? "14px" : "16px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2.5px", left: checked ? (small ? "17px" : "21px") : "3px", transition: "left 0.2s ease", boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }} />
      </div>
    </label>
  );
}

function Card({ title, icon, children, toggle, bg, border }) {
  const off = toggle && !toggle.checked;
  return (
    <div style={{ background: bg || C.card, border: `1px solid ${border || C.border}`, borderRadius: "10px", padding: "20px", opacity: off ? 0.55 : 1, transition: "opacity 0.15s ease" }} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: "16.5px", color: C.ink }}>{title}</h3>
        </div>
        {toggle && <ToggleSwitch checked={toggle.checked} onChange={toggle.onChange} small />}
      </div>
      <div style={{ pointerEvents: off ? "none" : "auto" }} className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function SplitSlider({ name1, name2, pct1, onChange }) {
  const pct2 = 100 - pct1;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: "13px", fontWeight: 600, color: C.partner1 }}>{name1 || "Partner 1"} · {pct1}%</span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: C.partner2 }}>{name2 || "Partner 2"} · {pct2}%</span>
      </div>
      <input
        type="range" min="0" max="100" step="1" value={pct1}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="bb-split-range"
        style={{
          width: "100%", height: "12px", borderRadius: "999px", outline: "none", WebkitAppearance: "none", appearance: "none",
          background: `linear-gradient(to right, ${C.partner1} 0%, ${C.partner1} ${pct1}%, ${C.partner2} ${pct1}%, ${C.partner2} 100%)`,
        }}
      />
      <p style={{ fontSize: "12px", color: C.sub }}>Drag to set the split of gross profit between partners.</p>
    </div>
  );
}

export default function BlendAndBrewDashboard() {
  const [s, setS] = useState(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) setS({ ...defaultState, ...JSON.parse(res.value) });
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("Saving…");
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await window.storage.set(STORAGE_KEY, JSON.stringify(s), false);
        setSaveStatus(res ? "Saved" : "Save failed");
      } catch (e) { setSaveStatus("Save failed"); }
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [s, loaded]);

  const set = (key) => (val) => setS((prev) => ({ ...prev, [key]: val }));

  const addCustomField = () => setS((p) => ({ ...p, customFields: [...p.customFields, { id: Date.now().toString(), label: "", amount: 0 }] }));
  const updateCustomField = (id, key, val) => setS((p) => ({ ...p, customFields: p.customFields.map((f) => (f.id === id ? { ...f, [key]: val } : f)) }));
  const removeCustomField = (id) => setS((p) => ({ ...p, customFields: p.customFields.filter((f) => f.id !== id) }));

  const resetAll = async () => {
    setS(defaultState);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(defaultState), false); } catch (e) {}
  };

  const coffees = Math.max(0, s.coffeeCap);
  const beansCost = (s.doseG * coffees / 1000) * s.beanPricePerKg;
  const milkLitres = (s.milkMlPerCoffee * coffees / 1000) * (1 + s.milkWastagePct / 100);
  const milkCost = milkLitres * s.milkPricePerL;
  const cupsCost = s.cupLidCostEach * coffees;
  const sundriesCost = s.sundriesCostEach * coffees;
  const consumablesTotal = beansCost + milkCost + cupsCost + sundriesCost;
  const costPerCoffee = coffees > 0 ? consumablesTotal / coffees : 0;

  const travelCost = s.travelOn ? s.travelKm * s.travelRate : 0;
  const generatorCost = s.travelOn && s.useGenerator ? s.generatorHours * s.generatorFuelLPerHour * s.fuelPricePerL : 0;
  const cardFeeCost = s.overheadsOn ? s.bookingPrice * (s.cardFeePct / 100) : 0;
  const customTotal = s.customCostsOn ? s.customFields.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0) : 0;
  const overheadsTotal = s.overheadsOn ? s.insurance + s.servicingDepreciation + s.permits : 0;

  const totalCosts = consumablesTotal + travelCost + generatorCost + cardFeeCost + overheadsTotal + customTotal;
  const grossProfit = s.bookingPrice - totalCosts;
  const marginPct = s.bookingPrice > 0 ? (grossProfit / s.bookingPrice) * 100 : 0;

  const pct1 = Math.min(100, Math.max(0, s.barista1Pct));
  const pct2 = 100 - pct1;
  const split1 = grossProfit * (pct1 / 100);
  const split2 = grossProfit * (pct2 / 100);

  const pieData = [
    { name: "Beans", value: beansCost },
    { name: "Milk", value: milkCost },
    { name: "Cups & sundries", value: cupsCost + sundriesCost },
    { name: "Travel", value: travelCost },
    { name: "Generator/fuel", value: generatorCost },
    { name: "Card fees", value: cardFeeCost },
    { name: "Overheads", value: overheadsTotal },
    { name: "Custom costs", value: customTotal },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ background: C.bg, height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .bb-grid { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .bb-left { padding: 20px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; }
        .bb-right { padding: 20px; border-top: 1px solid ${C.border}; overflow-y: auto; }
        @media (min-width: 1024px) {
          .bb-grid { display: grid; grid-template-columns: 1fr 760px; }
          .bb-right { border-top: none; border-left: 1px solid ${C.border}; }
        }
        .bb-split-range::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 3px solid ${C.ink}; box-shadow: 0 1px 3px rgba(0,0,0,0.4); cursor: pointer; }
        .bb-split-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 3px solid ${C.ink}; box-shadow: 0 1px 3px rgba(0,0,0,0.4); cursor: pointer; }
        .bb-split-range::-moz-range-track { background: transparent; }
      `}</style>

      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.card }} className="px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: C.sub }} className="uppercase mb-1">Blend &amp; Brew · Sydney NSW</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "23px", fontWeight: 700 }}>Event Costing &amp; Margin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "12px", color: C.sub }}>{saveStatus}</span>
          <button onClick={resetAll} style={{ border: `1px solid ${C.border}`, color: C.sub, borderRadius: "6px", padding: "6px 12px", fontSize: "12px" }} className="flex items-center gap-1">
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      <div className="bb-grid">
        {/* LEFT: scrollable inputs */}
        <div className="bb-left">
          <Card title="The Coffee Recipe" icon={<Coffee size={17} color={C.accent} />}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bean price" prefix="$" suffix="/kg" value={s.beanPricePerKg} onChange={set("beanPricePerKg")} />
              <Field label="Dose per coffee" suffix="g" value={s.doseG} onChange={set("doseG")} />
              <Field label="Milk price" prefix="$" suffix="/L" value={s.milkPricePerL} onChange={set("milkPricePerL")} />
              <Field label="Milk per coffee" suffix="ml" value={s.milkMlPerCoffee} onChange={set("milkMlPerCoffee")} />
              <Field label="Milk wastage" suffix="%" value={s.milkWastagePct} onChange={set("milkWastagePct")} />
              <Field label="Cup + lid" prefix="$" suffix="/ea" value={s.cupLidCostEach} onChange={set("cupLidCostEach")} />
              <Field label="Sugar/stirrers/napkins" prefix="$" suffix="/ea" value={s.sundriesCostEach} onChange={set("sundriesCostEach")} />
              <Field label="Coffee cap for event" suffix="cups" step="1" value={s.coffeeCap} onChange={set("coffeeCap")} />
            </div>
            <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: "10px" }} className="flex justify-between items-baseline">
              <span style={{ fontSize: "12px", color: C.sub }}>Cost per coffee</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: "18px", color: C.rust }}>{currency(costPerCoffee)}</span>
            </div>
          </Card>

          <Card title="Travel &amp; Generator" icon={<Car size={17} color={C.accent} />} toggle={{ checked: s.travelOn, onChange: set("travelOn") }}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Travel distance (round trip)" suffix="km" step="1" value={s.travelKm} onChange={set("travelKm")} />
              <Field label="ATO business travel rate" prefix="$" suffix="/km" value={s.travelRate} onChange={set("travelRate")} />
            </div>
            <ToggleSwitch checked={s.useGenerator} onChange={set("useGenerator")} label="Bringing the GENPOWER generator" />
            {s.useGenerator && (
              <div className="grid grid-cols-3 gap-4">
                <Field label="Run time" suffix="hrs" value={s.generatorHours} onChange={set("generatorHours")} />
                <Field label="Fuel use" suffix="L/hr" value={s.generatorFuelLPerHour} onChange={set("generatorFuelLPerHour")} />
                <Field label="Fuel price" prefix="$" suffix="/L" value={s.fuelPricePerL} onChange={set("fuelPricePerL")} />
              </div>
            )}
          </Card>

          <Card title="Profit Split" icon={<Users size={17} color={C.accent} />}>
            <SplitSlider name1={s.barista1Name} name2={s.barista2Name} pct1={pct1} onChange={set("barista1Pct")} />
          </Card>

          <Card title="Running Overheads" icon={<ShieldCheck size={17} color={C.accent} />} toggle={{ checked: s.overheadsOn, onChange: set("overheadsOn") }}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Insurance (per event)" prefix="$" value={s.insurance} onChange={set("insurance")} />
              <Field label="Servicing/depreciation" prefix="$" value={s.servicingDepreciation} onChange={set("servicingDepreciation")} />
              <Field label="Permits/council fees" prefix="$" value={s.permits} onChange={set("permits")} />
              <Field label="Card/EFTPOS fees" suffix="%" value={s.cardFeePct} onChange={set("cardFeePct")} />
            </div>
          </Card>

          <Card title="Add Your Own Costs" icon={<FileText size={17} color={C.accent} />} toggle={{ checked: s.customCostsOn, onChange: set("customCostsOn") }}>
            <div className="flex flex-col gap-2">
              {s.customFields.map((f) => (
                <div key={f.id} className="flex items-center gap-2">
                  <input placeholder="Description" value={f.label} onChange={(e) => updateCustomField(f.id, "label", e.target.value)}
                    style={{ border: `1px solid ${C.border}`, borderRadius: "4px", padding: "6px 8px", flex: 1, fontSize: "13.5px", background: C.bg }} />
                  <input type="number" placeholder="0" value={f.amount || ""} onChange={(e) => updateCustomField(f.id, "amount", parseFloat(e.target.value) || 0)}
                    style={{ border: `1px solid ${C.border}`, borderRadius: "4px", padding: "6px 8px", width: "90px", fontFamily: "'IBM Plex Mono', monospace", background: C.bg }} />
                  <button onClick={() => removeCustomField(f.id)} style={{ color: C.rust }}><Trash2 size={16} /></button>
                </div>
              ))}
              <button onClick={addCustomField} style={{ border: `1px dashed ${C.border}`, color: C.sub, borderRadius: "6px", padding: "8px", fontSize: "12.5px" }} className="flex items-center justify-center gap-1">
                <Plus size={14} /> Add another line
              </button>
            </div>
          </Card>

          <Card title="The Booking" icon={<Fuel size={17} color={C.accentDeep} />} bg={C.bookingCard} border={C.bookingBorder}>
            <Field label="Package / booking price" prefix="$" value={s.bookingPrice} onChange={set("bookingPrice")} />
            <p style={{ fontSize: "12px", color: C.sub }}>Price charged for the {coffees || 0}-coffee package above.</p>
          </Card>
        </div>

        {/* RIGHT: static summary + pie, double width */}
        <div className="bb-right flex flex-col gap-4">
          <div style={{ background: C.panel, borderRadius: "10px", padding: "18px" }}>
            <div style={{ fontSize: "11px", color: C.panelSub, letterSpacing: "0.08em" }} className="uppercase mb-3">This booking</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                ["Cost / coffee", currency(costPerCoffee)],
                ["Total costs", currency(totalCosts)],
                ["Gross profit", currency(grossProfit)],
                ["Margin", `${marginPct.toFixed(1)}%`],
              ].map(([label, val]) => (
                <div key={label} style={{ borderLeft: `2px solid ${C.accent}`, paddingLeft: "10px" }}>
                  <div style={{ fontSize: "10.5px", color: C.panelSub }} className="uppercase mb-0.5">{label}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "16px", fontWeight: 600, color: "#fff" }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <div style={{ background: C.panelCard, borderRadius: "6px", padding: "10px 12px", borderLeft: `3px solid ${C.partner1}` }} className="flex items-center justify-between">
                <span style={{ fontSize: "13px", color: C.panelSub }}>{s.barista1Name || "Partner 1"} · {pct1}%</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "15px", fontWeight: 600, color: "#fff" }}>{currency(split1)}</span>
              </div>
              <div style={{ background: C.panelCard, borderRadius: "6px", padding: "10px 12px", borderLeft: `3px solid ${C.partner2}` }} className="flex items-center justify-between">
                <span style={{ fontSize: "13px", color: C.panelSub }}>{s.barista2Name || "Partner 2"} · {pct2}%</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "15px", fontWeight: 600, color: "#fff" }}>{currency(split2)}</span>
              </div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px", flex: 1 }}>
            <div style={{ fontSize: "11px", color: C.sub, letterSpacing: "0.06em" }} className="uppercase mb-2">Cost breakdown</div>
            <ResponsiveContainer width="100%" height={420}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={80} outerRadius={140} paddingAngle={2}>
                  {pieData.map((entry, i) => <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => currency(v)} contentStyle={{ border: `1px solid ${C.border}`, borderRadius: "6px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
