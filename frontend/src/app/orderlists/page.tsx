"use client";
import toast from "react-hot-toast";
import { useRef, useState, useEffect, useCallback } from "react";
import { fetchWithAuth, API_URL } from "@/utils/api";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/LogoutButton";

type OrderStatus = "pending" | "processing" | "completed" | "canceled";

type Menu = { id: number; name: string; price: number; };

type OrderItem = {
  id: number; order_id: number; menu_item_id: number;
  quantity: number; price: string; sub_total: string; menu?: Menu;
};

type Order = {
  id: number; table_id: number; status: OrderStatus;
  total_price: string; order_code: string | null;
  order_type?: "dine_in" | "take_away";
  items: OrderItem[]; createdAt?: string;
};

const NAV_ITEMS = [
  { icon: "🧾", label: "Order",   view: "today"   as const },
  { icon: "🕐", label: "Histori", view: "history" as const },
];

export default function OrdersPage() {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const prevCountRef                  = useRef(0);
  const router                        = useRouter();
  const [filter, setFilter]           = useState("all");
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [view, setView]               = useState<"today" | "history">("today");
  const [dateFilter, setDateFilter]   = useState("");

// ✅ wrap dengan useCallback
const fetchOrders = useCallback(async () => {
  try {
    const res  = await fetchWithAuth(`${API_URL}/orders/cashier`);
    const data = await res.json();
    if (prevCountRef.current !== 0 && data.length > prevCountRef.current) {
      toast.success("🚨 Order baru masuk!");
    }
    if (!res.ok) { console.error(data); setOrders([]); return; }
    prevCountRef.current = data.length;
    setOrders(data);
  } catch (err) { console.error(err); }
}, []); // kosong karena gak ada dependency external

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const roles = JSON.parse(sessionStorage.getItem("roles") || "[]");
    if (!token || !roles.includes("cashier")) { router.push("/login"); return; }
    setLoading(false);
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

 const updateStatus = async (id: number, status: OrderStatus) => {
  await fetchWithAuth(`${API_URL}/orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
};

  const handlePrint = (order: Order) => {
    const itemsHtml = order.items.map((item) => `
      <div style="display:flex;justify-content:space-between;">
        <span>${item.menu?.name ?? "Menu"}</span>
        <span>${item.quantity} x Rp ${Number(item.price).toLocaleString("id-ID")}</span>
      </div>`).join("");
    const content = `
      <div style="font-family:monospace;width:250px;">
        <hr style="border-top:1px dashed #000;"/>
        <h3 style="text-align:center;">Kedai Gadabum</h3>
        <hr/>
        <p>Order: ${order.order_code}</p>
        <p>Table: ${order.table_id}</p>
        <p>Tipe: ${order.order_type === "dine_in" ? "Makan di Sini" : "Bawa Pulang"}</p>
        <p>${order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</p>
        <hr/>${itemsHtml}<hr/>
        <h4>Total: Rp ${Number(order.total_price).toLocaleString("id-ID")}</h4>
        <hr/><p style="text-align:center;">Terima kasih 🙏</p>
      </div>`;
    const win = window.open("", "", "width=300,height=500");
    win?.document.write(content); win?.document.close(); win?.print();
  };

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  if (loading) {
    return (
      <>
        <style>{`body{margin:0;background:#F7F5F2;}.r-loading{min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;color:#9E9488;font-size:13px;}`}</style>
        <div className="r-loading">Memuat data...</div>
      </>
    );
  }

  // ── FILTER BERDASARKAN VIEW ──
  const todayStr = new Date().toLocaleDateString("en-CA");

  const displayOrders = view === "today"
    ? orders.filter((o) => o.createdAt?.slice(0, 10) === todayStr)
    : orders.filter((o) => {
        const d = o.createdAt?.slice(0, 10);
        if (!d || d >= todayStr) return false;
        if (dateFilter && d !== dateFilter) return false;
        return true;
      });

  const filteredOrders = displayOrders.filter((order) => {
    const matchStatus = filter === "all" || order.status === filter;
    const matchSearch =
      order.order_code?.toLowerCase().includes(search.toLowerCase()) ||
      order.order_code?.replace("ORD-", "").includes(search) ||
      String(order.table_id).includes(search);
    const matchTable = tableFilter === "all" || String(order.table_id) === tableFilter;
    return matchStatus && matchSearch && matchTable;
  });

  const pendingCount    = displayOrders.filter((o) => o.status === "pending").length;
  const processingCount = displayOrders.filter((o) => o.status === "processing").length;
  const completedCount  = displayOrders.filter((o) => o.status === "completed").length;
  const canceledCount   = displayOrders.filter((o) => o.status === "canceled").length;

  const STATUS_FILTERS = [
    { key: "all",        label: "Semua"    },
    { key: "pending",    label: "Pending"  },
    { key: "processing", label: "Diproses" },
    { key: "completed",  label: "Selesai"  },
    { key: "canceled",   label: "Dibatal"  },
  ];

  const STAT_CARDS = [
    { label: "Pending",  count: pendingCount,    icon: "⏳", iconBg: "#FEF9C3", subLabel: "Menunggu diproses" },
    { label: "Diproses", count: processingCount, icon: "🔥", iconBg: "#DBEAFE", subLabel: "Sedang disiapkan"  },
    { label: "Selesai",  count: completedCount,  icon: "✅", iconBg: "#DCFCE7", subLabel: view === "today" ? "Order hari ini" : "Total selesai" },
    { label: "Dibatal",  count: canceledCount,   icon: "❌", iconBg: "#FEE2E2", subLabel: "Order dibatalkan"  },
  ];

  const statusBadgeStyle = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      pending:    { background: "#FEF9C3", color: "#854D0E", border: "1px solid #FDE047" },
      processing: { background: "#DBEAFE", color: "#1E40AF", border: "1px solid #93C5FD" },
      completed:  { background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC" },
      canceled:   { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" },
    };
    return map[status] ?? { background: "#F3F4F6", color: "#374151" };
  };

  const statusLabel = (s: string) =>
    ({ pending: "Pending", processing: "Diproses", completed: "Selesai", canceled: "Dibatal" }[s] ?? s);

  const hasDateFilter = !!dateFilter;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F7F5F2; font-family: 'Inter', sans-serif; }
        html, body { height: 100%; overflow: hidden; }
        .r-app { display: flex; height: 100vh; background: #F7F5F2; overflow: hidden; }

        /* ── SIDEBAR ── */
        .r-sidebar {
          width: 64px; background: #1A1814; display: flex; flex-direction: column;
          align-items: center; padding: 20px 0; gap: 6px;
          position: fixed; top: 0; left: 0; height: 100vh; z-index: 30; flex-shrink: 0;
        }
        .r-logo {
          width: 56px; height: 56px; border-radius: 12px; overflow: hidden;
          margin-bottom: 6px; flex-shrink: 0; display:flex; align-items:center; justify-content:center;
        }
        .r-logo img { width: 100%; height: 100%; object-fit: contain; }
        .r-nav-item {
          width: 46px; height: 46px; border-radius: 10px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 3px; cursor: pointer; transition: background 0.15s; border: none; background: transparent;
        }
        .r-nav-item:hover { background: #2A2620; }
        .r-nav-item.active { background: #2A2620; }
        .r-nav-icon { font-size: 19px; line-height: 1; }
        .r-nav-label { font-size: 8px; color: #6B6459; letter-spacing: 0.04em; }
        .r-nav-item.active .r-nav-label { color: #C9A840; }
        .r-sidebar-spacer { flex: 1; }

        /* ── MAIN ── */
        .r-main { flex: 1; margin-left: 64px; display: flex; flex-direction: column; height: 100vh; min-height: 0; overflow: hidden; }

        /* ── TOPBAR ── */
        .r-topbar {
          background: #FFFFFF; border-bottom: 1px solid #E8E4DF;
          padding: 0 28px; height: 58px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; z-index: 20;
        }
        .r-topbar-left { display: flex; align-items: center; gap: 14px; }
        .r-topbar-title { font-size: 15px; font-weight: 600; color: #1A1814; }
        .r-live-badge {
          display: flex; align-items: center; gap: 6px;
          background: #F0FDF4; border: 1px solid #BBF7D0;
          border-radius: 20px; padding: 4px 12px;
          font-size: 11px; font-weight: 500; color: #16A34A;
        }
        .r-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #22C55E; animation: r-pulse 1.5s infinite; }
        .r-history-badge {
          display: flex; align-items: center; gap: 6px;
          background: #F5F3FF; border: 1px solid #DDD6FE;
          border-radius: 20px; padding: 4px 12px;
          font-size: 11px; font-weight: 500; color: #7C3AED;
        }
        @keyframes r-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .r-topbar-right { display: flex; align-items: center; gap: 10px; }
        .r-search {
          display: flex; align-items: center; gap: 8px;
          background: #F7F5F2; border: 1px solid #E8E4DF;
          border-radius: 8px; padding: 7px 13px; width: 220px;
        }
        .r-search input {
          border: none; background: transparent; outline: none;
          font-family: 'Inter', sans-serif; font-size: 13px; color: #1A1814; width: 100%;
        }
        .r-search input::placeholder { color: #9E9488; }
        .r-date-badge {
          font-size: 11px; color: #9E9488; background: #F7F5F2;
          border: 1px solid #E8E4DF; border-radius: 8px; padding: 6px 12px;
          white-space: nowrap;
        }

        /* ── BODY ── */
        .r-body { flex: 1; min-height: 0; padding: 24px 28px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; }

        /* ── STAT CARDS ── */
        .r-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; flex-shrink: 0; }
        .r-stat { background: #FFFFFF; border: 1px solid #E8E4DF; border-radius: 12px; padding: 16px 18px; transition: border-color 0.15s, transform 0.15s; }
        .r-stat:hover { border-color: #E8C97A; transform: translateY(-1px); }
        .r-stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .r-stat-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .r-stat-label { font-size: 11px; font-weight: 500; color: #9E9488; letter-spacing: 0.05em; text-transform: uppercase; }
        .r-stat-count { font-size: 30px; font-weight: 600; color: #1A1814; line-height: 1; }
        .r-stat-sub { font-size: 11px; color: #9E9488; margin-top: 4px; }

        /* ── CONTROLS ── */
        .r-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex-shrink: 0; }
        .r-filter-tabs { display: flex; gap: 3px; background: #FFFFFF; border: 1px solid #E8E4DF; border-radius: 10px; padding: 4px; }
        .r-filter-tab {
          padding: 6px 15px; border-radius: 7px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
          color: #9E9488; cursor: pointer; transition: all 0.15s; border: none; background: transparent; white-space: nowrap;
        }
        .r-filter-tab:hover { color: #1A1814; background: #F7F5F2; }
        .r-filter-tab.active { background: #1A1814; color: #FFFFFF; }
        .r-spacer { flex: 1; }
        .r-table-select {
          padding: 8px 14px; background: #FFFFFF; border: 1px solid #E8E4DF; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 12px; color: #6B6459; outline: none; cursor: pointer; appearance: none;
        }
        .r-table-select:focus { border-color: #E8C97A; }

        /* ── DATE FILTER ── */
        .r-date-filter {
          display: flex; align-items: center; gap: 8px;
          background: #FFFFFF; border: 1px solid #E8E4DF;
          border-radius: 10px; padding: 6px 12px;
        }
        .r-date-filter-label { font-size: 11px; color: #9E9488; font-weight: 500; white-space: nowrap; }
        .r-date-input {
          padding: 4px 8px; background: #F7F5F2; border: 1px solid #E8E4DF; border-radius: 6px;
          font-family: 'Inter', sans-serif; font-size: 12px; color: #1A1814; outline: none; cursor: pointer;
        }
        .r-date-input:focus { border-color: #E8C97A; }
        .r-date-sep { font-size: 11px; color: #C8C3BB; }
        .r-date-reset {
          display: flex; align-items: center; gap: 4px;
          padding: 4px 10px; border-radius: 6px; border: none;
          background: #FEE2E2; color: #DC2626;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600;
          cursor: pointer; transition: background 0.15s; white-space: nowrap;
        }
        .r-date-reset:hover { background: #FCA5A5; }
        .r-date-active-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: #EEF2FF; border: 1px solid #C7D2FE;
          border-radius: 20px; padding: 3px 10px;
          font-size: 11px; font-weight: 500; color: #4338CA;
          white-space: nowrap;
        }

        /* ── ORDER CARDS ── */
        .r-orders { display: flex; flex-direction: column; gap: 10px; }
        .r-order-card { background: #FFFFFF; border: 1px solid #E8E4DF; border-radius: 14px; overflow: hidden; transition: border-color 0.15s; cursor: pointer; }
        .r-order-card:hover { border-color: #E8C97A; }
        .r-order-card.expanded { border-color: #E8C97A; }
        .r-card-header { display: flex; align-items: center; gap: 12px; padding: 14px 20px; }
        .r-order-icon { width: 40px; height: 40px; border-radius: 10px; background: #F7F5F2; border: 1px solid #E8E4DF; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .r-order-info { flex: 1; min-width: 0; }
        .r-order-code { font-size: 14px; font-weight: 600; color: #1A1814; }
        .r-order-meta { font-size: 12px; color: #9E9488; margin-top: 4px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .r-order-type-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .r-order-type-dine { background: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE; }
        .r-order-type-take { background: #FEF9C3; color: #92400E; border: 1px solid #FDE68A; }
        .r-card-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .r-order-total { font-size: 15px; font-weight: 600; color: #1A1814; }
        .r-status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.03em; white-space: nowrap; }
        .r-chevron { font-size: 14px; color: #9E9488; transition: transform 0.2s; user-select: none; }
        .r-order-card.expanded .r-chevron { transform: rotate(180deg); }
        .r-order-date { font-size: 11px; color: #B8AFA6; margin-top: 2px; }

        /* ── CARD BODY ── */
        .r-card-body { border-top: 1px solid #F7F5F2; padding: 14px 20px 18px; }
        .r-items-label { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #9E9488; margin-bottom: 8px; }
        .r-item-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #F7F5F2; font-size: 13px; }
        .r-item-row:last-of-type { border-bottom: none; }
        .r-item-name { color: #6B6459; }
        .r-item-qty { color: #9E9488; font-size: 12px; margin: 0 8px; }
        .r-item-price { font-weight: 600; color: #1A1814; }
        .r-items-empty { font-size: 13px; color: #9E9488; padding: 8px 0; }
        .r-divider { height: 1px; background: #F0EDE8; margin: 12px 0; }

        /* ── ACTIONS ── */
        .r-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .r-btn { padding: 8px 16px; border-radius: 8px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px; border: 1px solid transparent; }
        .r-btn:active { transform: scale(0.97); }
        .r-btn-process { background: #EFF6FF; color: #1D4ED8; border-color: #BFDBFE; }
        .r-btn-process:hover { background: #DBEAFE; }
        .r-btn-complete { background: #F0FDF4; color: #166534; border-color: #86EFAC; }
        .r-btn-complete:hover { background: #DCFCE7; }
        .r-btn-cancel { background: #FFF5F5; color: #C53030; border-color: #FEB2B2; }
        .r-btn-cancel:hover { background: #FED7D7; }
        .r-btn-print { background: #1A1814; color: #FFFFFF; margin-left: auto; }
        .r-btn-print:hover { background: #2A2620; }
        .r-done-text { font-size: 12px; font-weight: 600; color: #16A34A; display: flex; align-items: center; gap: 6px; }
        .r-cancel-text { font-size: 12px; font-weight: 600; color: #DC2626; display: flex; align-items: center; gap: 6px; }

        /* ── EMPTY ── */
        .r-empty { text-align: center; padding: 80px 20px; color: #C8C3BB; font-size: 13px; letter-spacing: 0.08em; }
        .r-empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.4; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #E8E4DF; border-radius: 4px; }
      `}</style>

      <div className="r-app">
        {/* ── SIDEBAR ── */}
        <nav className="r-sidebar">
          <div className="r-logo">
            <img src="/logo.png" alt="Logo" />
          </div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              className={`r-nav-item${view === item.view ? " active" : ""}`}
              title={item.label}
              onClick={() => {
                setView(item.view);
                setFilter("all");
                setSearch("");
                setDateFilter("");
              }}
            >
              <span className="r-nav-icon">{item.icon}</span>
              <span className="r-nav-label">{item.label}</span>
            </button>
          ))}
          <div className="r-sidebar-spacer" />
          <div className="r-nav-item" title="Logout" style={{ marginBottom: 8 }}>
            <LogoutButton iconOnly />
          </div>
        </nav>

        <div className="r-main">
          {/* ── TOPBAR ── */}
          <header className="r-topbar">
            <div className="r-topbar-left">
              <span className="r-topbar-title">
                {view === "today" ? "Manajemen Order" : "Histori Order"}
              </span>
              {view === "today" ? (
                <div className="r-live-badge">
                  <div className="r-live-dot" />
                  Live
                </div>
              ) : (
                <div className="r-history-badge">🕐 Riwayat</div>
              )}
            </div>
            <div className="r-topbar-right">
              <div className="r-search">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Cari order / meja..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <span className="r-date-badge">
                📅 {new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </header>

          <div className="r-body">
            {/* ── STAT CARDS ── */}
            <div className="r-stats">
              {STAT_CARDS.map((s) => (
                <div className="r-stat" key={s.label}>
                  <div className="r-stat-top">
                    <div className="r-stat-icon" style={{ background: s.iconBg }}>{s.icon}</div>
                    <span className="r-stat-label">{s.label}</span>
                  </div>
                  <div className="r-stat-count">{s.count}</div>
                  <div className="r-stat-sub">{s.subLabel}</div>
                </div>
              ))}
            </div>

            {/* ── CONTROLS ── */}
            <div className="r-controls">
              <div className="r-filter-tabs">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    className={`r-filter-tab${filter === f.key ? " active" : ""}`}
                    onClick={() => setFilter(f.key)}
                  >{f.label}</button>
                ))}
              </div>

              <div className="r-spacer" />

              {view === "history" && (
                <div className="r-date-filter">
                  <span className="r-date-filter-label">📅 Tanggal</span>
                  <input
                    type="date"
                    className="r-date-input"
                    value={dateFilter}
                    max={todayStr}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                  {hasDateFilter && (
                    <button
                      className="r-date-reset"
                      onClick={() => setDateFilter("")}
                    >
                      ✕ Reset
                    </button>
                  )}
                </div>
              )}

              {view === "history" && hasDateFilter && (
                <span className="r-date-active-badge">
                  🔍 {dateFilter}
                </span>
              )}

              <select
                className="r-table-select"
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
              >
                <option value="all">Semua Meja</option>
                <option value="1">Table 1</option>
                <option value="2">Table 2</option>
                <option value="3">Table 3</option>
                <option value="4">Table 4</option>
              </select>
            </div>

            {/* ── ORDER LIST ── */}
            <div className="r-orders">
              {filteredOrders.length === 0 ? (
                <div className="r-empty">
                  <div className="r-empty-icon">{view === "today" ? "📋" : "🕐"}</div>
                  <div>
                    {view === "today"
                      ? "Tidak ada order hari ini"
                      : hasDateFilter
                        ? "Tidak ada order di rentang tanggal ini"
                        : "Tidak ada histori order"}
                  </div>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedId === order.id;
                  return (
                    <div
                      key={order.id}
                      className={`r-order-card${isExpanded ? " expanded" : ""}`}
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="r-card-header">
                        <div className="r-order-icon">{order.order_type === "take_away" ? "🥡" : "🧾"}</div>
                        <div className="r-order-info">
                          <div className="r-order-code">{order.order_code || "No Code"}</div>
                          <div className="r-order-meta">
                            <span>🪑 Meja {order.table_id} · {order.items.length} item</span>
                            {order.order_type ? (
                              <span className={`r-order-type-badge ${order.order_type === "dine_in" ? "r-order-type-dine" : "r-order-type-take"}`}>
                                {order.order_type === "dine_in" ? "🍽 Makan di Sini" : "🥡 Bawa Pulang"}
                              </span>
                            ) : null}
                          </div>
                          {view === "history" && order.createdAt && (
                            <div className="r-order-date">
                              📅 {new Date(order.createdAt).toLocaleDateString("id-ID", {
                                weekday: "short", day: "numeric", month: "short",
                                year: "numeric", hour: "2-digit", minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                        <div className="r-card-right">
                          <span className="r-order-total">Rp {Number(order.total_price).toLocaleString("id-ID")}</span>
                          <span className="r-status-badge" style={statusBadgeStyle(order.status)}>{statusLabel(order.status)}</span>
                          <span className="r-chevron">▾</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="r-card-body" onClick={(e) => e.stopPropagation()}>
                          <div className="r-items-label">Rincian Pesanan</div>
                          {order.items?.length === 0 ? (
                            <div className="r-items-empty">Tidak ada item</div>
                          ) : (
                            order.items.map((item) => (
                              <div key={item.id} className="r-item-row">
                                <span className="r-item-name">{item.menu?.name ?? "Unknown"}</span>
                                <span className="r-item-qty">× {item.quantity}</span>
                                <span className="r-item-price">Rp {(Number(item.price) * item.quantity).toLocaleString("id-ID")}</span>
                              </div>
                            ))
                          )}
                          <div className="r-divider" />
                          <div className="r-actions">
                            {view === "today" && order.status === "pending" && (
                              <>
                                <button className="r-btn r-btn-process" onClick={() => updateStatus(order.id, "processing")}>▶ Proses</button>
                                <button className="r-btn r-btn-cancel"  onClick={() => updateStatus(order.id, "canceled")}>✕ Batal</button>
                              </>
                            )}
                            {view === "today" && order.status === "processing" && (
                              <>
                                <button className="r-btn r-btn-complete" onClick={() => updateStatus(order.id, "completed")}>✓ Selesai</button>
                                <button className="r-btn r-btn-cancel"   onClick={() => updateStatus(order.id, "canceled")}>✕ Batal</button>
                              </>
                            )}
                            {order.status === "completed" && <span className="r-done-text">✓ Order selesai</span>}
                            {order.status === "canceled"  && <span className="r-cancel-text">✕ Order dibatalkan</span>}
                            <button className="r-btn r-btn-print" onClick={() => handlePrint(order)}>🧾 Print</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}