import React, { useState, useMemo } from "react";
import { Search, ChevronRight, Bed, X, User, Calendar, Stethoscope, Sparkles, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useIpd } from "../../context/IpdContext";

// ---- Style tokens (matched to existing MediCore HMS shell) ------------

const STATUS_META = {
  occupied: { label: "Occupied", dot: "#0d9488", bg: "#ecfdf5", text: "#0f766e", border: "#99f6e4" },
  vacant: { label: "Vacant", dot: "#22c55e", bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  reserved: { label: "Reserved", dot: "#eab308", bg: "#fefce8", text: "#a16207", border: "#fde68a" },
  cleaning: { label: "Cleaning", dot: "#94a3b8", bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
};

function Dot({ color }) {
  return <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: "inline-block", flexShrink: 0 }} />;
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e9ee", borderRadius: 10, padding: "14px 16px", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent || "#0f172a", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct }) {
  const color = pct >= 90 ? "#dc2626" : pct >= 75 ? "#d97706" : "#0d9488";
  return (
    <div style={{ height: 8, background: "#e5e9ee", borderRadius: 999, overflow: "hidden", marginTop: 10 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.4s ease" }} />
    </div>
  );
}

function WardCard({ ward, onOpen }) {
  const occupied = ward.beds.filter((b) => b.status === "occupied").length;
  const pct = ward.total ? Math.round((occupied / ward.total) * 100) : 0;

  return (
    <button
      onClick={() => onOpen(ward.id)}
      style={{
        background: "#fff",
        border: "1px solid #e5e9ee",
        borderRadius: 12,
        padding: "18px 20px",
        textAlign: "left",
        cursor: "pointer",
        flex: "1 1 280px",
        minWidth: 260,
        transition: "box-shadow 0.15s ease, transform 0.15s ease",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,23,42,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{ward.name}</span>
          {pct >= 90 && (
            <span title="Near capacity" style={{ display: "inline-flex", alignItems: "center", color: "#dc2626" }}>
              <AlertTriangle size={14} />
            </span>
          )}
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0d9488" }}>{ward.tag}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <span style={{ fontSize: 13.5, color: "#475569" }}>Beds: {occupied}/{ward.total} occupied</span>
      </div>
      <ProgressBar pct={pct} />

      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, fontSize: 12.5, color: "#0d9488", fontWeight: 600 }}>
        View bed grid <ChevronRight size={14} />
      </div>
    </button>
  );
}

function BedTile({ bed, onSelect }) {
  const meta = STATUS_META[bed.status] || STATUS_META.vacant;
  return (
    <button
      onClick={() => onSelect(bed)}
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        borderRadius: 10,
        padding: "10px 10px 9px",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        position: "relative",
        transition: "transform 0.1s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
        <Bed size={13} color={meta.text} />
        {bed.id}
      </div>
      <div style={{ fontSize: 11, color: meta.text, fontWeight: 600, marginTop: 4 }}>{meta.label}</div>
      {bed.status === "occupied" && bed.patient && (
        <div style={{ fontSize: 11, color: "#475569", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {bed.patient}
        </div>
      )}
    </button>
  );
}

function BedDetailPanel({ bed, wardName, wardId, onClose, onUpdateStatus }) {
  const [editing, setEditing] = useState(false);
  const [nextStatus, setNextStatus] = useState(bed?.status || "vacant");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setEditing(false);
    setNextStatus(bed?.status || "vacant");
  }, [bed]);

  if (!bed) return null;
  const meta = STATUS_META[bed.status] || STATUS_META.vacant;

  const handleSave = async () => {
    setSaving(true);
    await onUpdateStatus(wardId, bed.id, nextStatus);
    setSaving(false);
    setEditing(false);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.35)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 340,
          maxWidth: "90vw",
          background: "#fff",
          height: "100%",
          padding: "22px 22px",
          boxShadow: "-8px 0 24px rgba(15,23,42,0.12)",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{wardName}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>{bed.id}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f1f5f9", borderRadius: 8, padding: 6, cursor: "pointer" }}>
            <X size={16} color="#475569" />
          </button>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, padding: "4px 10px", borderRadius: 999, background: meta.bg, border: `1px solid ${meta.border}` }}>
          <Dot color={meta.dot} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: meta.text }}>{meta.label}</span>
        </div>

        {bed.status === "occupied" && bed.patient && (
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <InfoRow icon={<User size={15} />} label="Patient" value={`${bed.patient} · ${bed.pid || ''}`} />
            <InfoRow icon={<Calendar size={15} />} label="Admitted" value={bed.admitted || '—'} />
            <InfoRow icon={<Stethoscope size={15} />} label="Attending" value={bed.doctor || '—'} />
          </div>
        )}

        {bed.status === "vacant" && (
          <p style={{ marginTop: 20, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
            This bed is currently vacant and ready for a new admission (use Admission Form to allocate a patient here).
          </p>
        )}

        {bed.status === "cleaning" && (
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 13 }}>
            <Sparkles size={15} /> Housekeeping in progress
          </div>
        )}

        {bed.status === "reserved" && (
          <p style={{ marginTop: 20, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
            This bed is reserved and not yet allocated to a specific patient.
          </p>
        )}

        {/* ---- Edit bed status ---- */}
        <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid #eef0f3" }}>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              style={{
                width: "100%", border: "1px solid #0d9488", background: "#fff", color: "#0d9488",
                fontWeight: 600, fontSize: 13, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Edit bed status
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>New status</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "inherit" }}
              >
                {Object.keys(STATUS_META).map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex: 1, border: "none", background: "#0d9488", color: "#fff", fontWeight: 600, fontSize: 13,
                    padding: "9px 12px", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    flex: 1, border: "1px solid #e2e8f0", background: "#fff", color: "#334155", fontWeight: 600, fontSize: 13,
                    padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                Note: marking a bed "Occupied" here does not create an admission record — use the Admission Form for new patients.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ color: "#94a3b8", marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13.5, color: "#0f172a", fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

// ---- Main page ----------------------------------------------------------

export default function WardManagement() {
  const { wards, admissions, handleUpdateBedStatus } = useIpd();

  const [openWardId, setOpenWardId] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  // Build UI-shaped wards from real DB data: each ward's bedList (per-bed
  // status) cross-referenced with current (non-discharged) admissions so
  // occupied beds show the real patient.
  const uiWards = useMemo(() => {
    return (wards || []).map((w) => {
      const beds = (w.bedList && w.bedList.length > 0 ? w.bedList : []).map((b) => {
        const admission = admissions.find(
          (a) => a.ward === w.name && a.bed === b.bedNumber && a.status !== 'Discharged'
        );
        return {
          id: b.bedNumber,
          status: b.status,
          patient: admission?.patient,
          pid: admission?.admissionCode,
          admitted: admission?.admissionDate,
          doctor: admission?.doctor,
        };
      });
      return {
        id: w.id,
        name: w.name,
        tag: w.status || '',
        total: w.beds,
        beds,
      };
    });
  }, [wards, admissions]);

  const openWard = uiWards.find((w) => w.id === openWardId);

  const totals = useMemo(() => {
    const all = uiWards.flatMap((w) => w.beds);
    const total = all.length;
    const occupied = all.filter((b) => b.status === "occupied").length;
    const vacant = all.filter((b) => b.status === "vacant").length;
    return { total, occupied, vacant, pct: total ? Math.round((occupied / total) * 100) : 0 };
  }, [uiWards]);

  const filteredBeds = useMemo(() => {
    if (!openWard) return [];
    return openWard.beds.filter((b) => {
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      const matchesQuery =
        !query ||
        b.id.toLowerCase().includes(query.toLowerCase()) ||
        (b.patient && b.patient.toLowerCase().includes(query.toLowerCase()));
      return matchesStatus && matchesQuery;
    });
  }, [openWard, statusFilter, query]);

  if (!wards || wards.length === 0) {
    return (
      <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: "40px 28px", color: "#64748b", fontSize: 14 }}>
        Loading ward data…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: "#f4f6f8", minHeight: "100%", padding: "24px 28px" }}>
      {/* Header */}
      {!openWard ? (
        <>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>Ward Management</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Live bed occupancy across all wards, synced with the database.</p>
        </>
      ) : (
        <>
          <button
            onClick={() => { setOpenWardId(null); setStatusFilter("all"); setQuery(""); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#0d9488", fontWeight: 600, fontSize: 13.5, cursor: "pointer", padding: 0, marginBottom: 10, fontFamily: "inherit" }}
          >
            <ArrowLeft size={15} /> All wards
          </button>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>{openWard.name}</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>{openWard.tag} · {openWard.beds.filter(b=>b.status==='occupied').length}/{openWard.total} beds occupied</p>
        </>
      )}

      <div style={{ height: 1, background: "#e5e9ee", margin: "18px 0 22px" }} />

      {!openWard && (
        <>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
            <StatCard label="Total beds" value={totals.total} />
            <StatCard label="Occupied" value={totals.occupied} sub={`${totals.pct}% occupancy`} accent="#0d9488" />
            <StatCard label="Vacant" value={totals.vacant} accent="#15803d" />
          </div>

          {/* Ward cards */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {uiWards.map((w) => (
              <WardCard key={w.id} ward={w} onOpen={setOpenWardId} />
            ))}
          </div>
        </>
      )}

      {openWard && (
        <>
          {/* Toolbar: search + filter + legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 12px", minWidth: 200 }}>
                <Search size={15} color="#94a3b8" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bed or patient..."
                  style={{ border: "none", outline: "none", fontSize: 13, fontFamily: "inherit", width: "100%", background: "transparent" }}
                />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["all", "occupied", "vacant", "reserved", "cleaning"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      border: "1px solid " + (statusFilter === s ? "#0d9488" : "#e2e8f0"),
                      background: statusFilter === s ? "#0d9488" : "#fff",
                      color: statusFilter === s ? "#fff" : "#475569",
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: "6px 12px",
                      borderRadius: 999,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      fontFamily: "inherit",
                    }}
                  >
                    {s === "all" ? "All beds" : STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {Object.entries(STATUS_META).map(([key, m]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
                  <Dot color={m.dot} /> {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Bed grid */}
          {filteredBeds.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 13.5 }}>
              No beds match your filters.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
              {filteredBeds.map((bed) => (
                <BedTile key={bed.id} bed={bed} onSelect={setSelectedBed} />
              ))}
            </div>
          )}
        </>
      )}

      <BedDetailPanel
        bed={selectedBed}
        wardName={openWard?.name}
        wardId={openWard?.id}
        onClose={() => setSelectedBed(null)}
        onUpdateStatus={handleUpdateBedStatus}
      />
    </div>
  );
}
