"use client";
import toast from "react-hot-toast";
import { useRef, useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/api";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/LogoutButton";

type OrderStatus = "pending" | "processing" | "completed" | "canceled";

type Menu = {
  id: number;
  name: string;
  price: number;
};

type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: string;
  sub_total: string;
  menu?: Menu;
};

type Order = {
  id: number;
  table_id: number;
  status: OrderStatus;
  total_price: string;
  order_code: string | null;
  items: OrderItem[];
  createdAt?: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const prevCountRef = useRef(0);
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      const res = await fetchWithAuth("http://localhost:5000/orders/cashier");
      const data = await res.json();
      if (prevCountRef.current !== 0 && data.length > prevCountRef.current) {
        toast.success("🚨 Order baru masuk!");
      }
      if (!res.ok) { console.error(data); setOrders([]); return; }
      prevCountRef.current = data.length;
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const roles = JSON.parse(sessionStorage.getItem("roles") || "[]");
    if (!token || !roles.includes("cashier")) { router.push("/login"); return; }
    setLoading(false);
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: number, status: OrderStatus) => {
    const token = sessionStorage.getItem("token");
    await fetch(`http://localhost:5000/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const handlePrint = (order: Order) => {
    const itemsHtml = order.items.map((item) => `
      <div style="display:flex;justify-content:space-between;">
        <span>${item.menu?.name ?? "Menu"}</span>
        <span>${item.quantity} x ${item.price}</span>
      </div>`).join("");
    const content = `
      <div style="font-family:monospace;width:250px;">
        <hr style="border-top:1px dashed #000;"/>
        <h3 style="text-align:center;">Kedai Gadabum</h3>
        <hr/>
        <p>Order: ${order.order_code}</p>
        <p>Table: ${order.table_id}</p>
        <p>${order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</p>
        <hr/>${itemsHtml}<hr/>
        <h4>Total: Rp ${Number(order.total_price).toLocaleString("id-ID")}</h4>
        <hr/><p style="text-align:center;">Terima kasih 🙏</p>
      </div>`;
    const win = window.open("", "", "width=300,height=500");
    win?.document.write(content);
    win?.document.close();
    win?.print();
  };

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  if (loading) {
    return (
      <>
        <style>{`
          body{margin:0;background:#F7F5F2;}
          .r-loading{min-height:100vh;display:flex;align-items:center;justify-content:center;
            font-family:Inter,sans-serif;color:#9E9488;font-size:13px;letter-spacing:0.1em;}
        `}</style>
        <div className="r-loading">Memuat data...</div>
      </>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchStatus = filter === "all" || order.status === filter;
    const matchSearch = order.order_code?.toLowerCase().includes(search.toLowerCase()) || String(order.table_id).includes(search);
    const matchTable  = tableFilter === "all" || String(order.table_id) === tableFilter;
    return matchStatus && matchSearch && matchTable;
  });

  const pendingCount    = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter((o) => o.status === "processing").length;
  const completedCount  = orders.filter((o) => o.status === "completed").length;
  const canceledCount   = orders.filter((o) => o.status === "canceled").length;

  const STATUS_FILTERS = [
    { key: "all",        label: "Semua" },
    { key: "pending",    label: "Pending" },
    { key: "processing", label: "Diproses" },
    { key: "completed",  label: "Selesai" },
    { key: "canceled",   label: "Dibatal" },
  ];

  const STAT_CARDS = [
    { label: "Pending",   count: pendingCount,    icon: "⏳", iconBg: "#FEF9C3", iconColor: "#B45309", subLabel: "Menunggu diproses" },
    { label: "Diproses",  count: processingCount, icon: "🔥", iconBg: "#DBEAFE", iconColor: "#1D4ED8", subLabel: "Sedang disiapkan" },
    { label: "Selesai",   count: completedCount,  icon: "✅", iconBg: "#DCFCE7", iconColor: "#166534", subLabel: "Order hari ini" },
    { label: "Dibatal",   count: canceledCount,   icon: "❌", iconBg: "#FEE2E2", iconColor: "#991B1B", subLabel: "Order dibatalkan" },
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

  const statusLabel = (status: string) =>
    ({ pending: "Pending", processing: "Diproses", completed: "Selesai", canceled: "Dibatal" }[status] ?? status);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F7F5F2; font-family: 'Inter', sans-serif; }

        .r-app { display: flex; min-height: 100vh; background: #F7F5F2; }

        /* ── SIDEBAR ── */
        .r-sidebar {
          width: 64px; background: #1A1814; display: flex; flex-direction: column;
          align-items: center; padding: 20px 0; gap: 6px;
          position: fixed; top: 0; left: 0; height: 100vh; z-index: 30;
        }
        .r-logo {
          width: 38px; height: 38px; background: #C9A840; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; font-weight: 700; color: #1A1814; margin-bottom: 18px;
          flex-shrink: 0;
        }
        .r-nav-item {
          width: 46px; height: 46px; border-radius: 10px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 3px; cursor: pointer; transition: background 0.15s;
        }
        .r-nav-item:hover { background: #2A2620; }
        .r-nav-item.active { background: #2A2620; }
        .r-nav-icon { font-size: 19px; line-height: 1; }
        .r-nav-label { font-size: 8px; color: #6B6459; letter-spacing: 0.04em; }
        .r-nav-item.active .r-nav-label { color: #C9A840; }
        .r-sidebar-spacer { flex: 1; }

        /* ── MAIN ── */
        .r-main { flex: 1; margin-left: 64px; display: flex; flex-direction: column; }

        /* ── TOPBAR ── */
        .r-topbar {
          background: #FFFFFF; border-bottom: 1px solid #E8E4DF;
          padding: 0 28px; height: 58px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 20;
        }
        .r-topbar-left { display: flex; align-items: center; gap: 14px; }
        .r-topbar-title { font-size: 15px; font-weight: 600; color: #1A1814; }
        .r-live-badge {
          display: flex; align-items: center; gap: 6px;
          background: #F0FDF4; border: 1px solid #BBF7D0;
          border-radius: 20px; padding: 4px 12px;
          font-size: 11px; font-weight: 500; color: #16A34A;
        }
        .r-live-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #22C55E;
          animation: r-pulse 1.5s infinite;
        }
        @keyframes r-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .r-topbar-right { display: flex; align-items: center; gap: 10px; }
        .r-search {
          display: flex; align-items: center; gap: 8px;
          background: #F7F5F2; border: 1px solid #E8E4DF;
          border-radius: 8px; padding: 7px 13px;
          font-size: 13px; color: #6B6459; width: 220px;
        }
        .r-search input {
          border: none; background: transparent; outline: none;
          font-family: 'Inter', sans-serif; font-size: 13px; color: #1A1814;
          width: 100%;
        }
        .r-search input::placeholder { color: #9E9488; }
        .r-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: #FDF6E3; border: 1.5px solid #E8C97A;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: #C9A840;
        }

        /* ── BODY ── */
        .r-body { flex: 1; padding: 24px 28px; display: flex; flex-direction: column; gap: 18px; }

        /* ── STAT CARDS ── */
        .r-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
        }
        .r-stat {
          background: #FFFFFF; border: 1px solid #E8E4DF; border-radius: 12px;
          padding: 16px 18px; transition: border-color 0.15s, transform 0.15s; cursor: default;
        }
        .r-stat:hover { border-color: #E8C97A; transform: translateY(-1px); }
        .r-stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .r-stat-icon {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
        .r-stat-label { font-size: 11px; font-weight: 500; color: #9E9488; letter-spacing: 0.05em; text-transform: uppercase; }
        .r-stat-count { font-size: 30px; font-weight: 600; color: #1A1814; line-height: 1; }
        .r-stat-sub { font-size: 11px; color: #9E9488; margin-top: 4px; }

        /* ── CONTROLS ── */
        .r-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .r-filter-tabs {
          display: flex; gap: 3px;
          background: #FFFFFF; border: 1px solid #E8E4DF;
          border-radius: 10px; padding: 4px;
        }
        .r-filter-tab {
          padding: 6px 15px; border-radius: 7px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
          color: #9E9488; cursor: pointer; transition: all 0.15s;
          border: none; background: transparent; white-space: nowrap;
        }
        .r-filter-tab:hover { color: #1A1814; background: #F7F5F2; }
        .r-filter-tab.active { background: #1A1814; color: #FFFFFF; }
        .r-spacer { flex: 1; }
        .r-table-select {
          padding: 8px 14px; background: #FFFFFF;
          border: 1px solid #E8E4DF; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 12px; color: #6B6459;
          outline: none; cursor: pointer; appearance: none;
        }
        .r-table-select:focus { border-color: #E8C97A; }

        /* ── ORDER CARDS ── */
        .r-orders { display: flex; flex-direction: column; gap: 10px; }
        .r-order-card {
          background: #FFFFFF; border: 1px solid #E8E4DF; border-radius: 14px;
          overflow: hidden; transition: border-color 0.15s;
          cursor: pointer;
        }
        .r-order-card:hover { border-color: #E8C97A; }
        .r-order-card.expanded { border-color: #E8C97A; }

        .r-card-header {
          display: flex; align-items: center; gap: 12px; padding: 14px 20px;
        }
        .r-order-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: #F7F5F2; border: 1px solid #E8E4DF;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .r-order-info { flex: 1; min-width: 0; }
        .r-order-code { font-size: 14px; font-weight: 600; color: #1A1814; }
        .r-order-meta { font-size: 12px; color: #9E9488; margin-top: 2px; }
        .r-card-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .r-order-total { font-size: 15px; font-weight: 600; color: #1A1814; }
        .r-status-badge {
          padding: 4px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.03em;
          white-space: nowrap;
        }
        .r-chevron {
          font-size: 14px; color: #9E9488; transition: transform 0.2s; user-select: none;
        }
        .r-order-card.expanded .r-chevron { transform: rotate(180deg); }

        /* ── CARD BODY ── */
        .r-card-body {
          border-top: 1px solid #F7F5F2; padding: 14px 20px 18px;
        }
        .r-items-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #9E9488; margin-bottom: 8px;
        }
        .r-item-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 7px 0; border-bottom: 1px solid #F7F5F2; font-size: 13px;
        }
        .r-item-row:last-of-type { border-bottom: none; }
        .r-item-name { color: #6B6459; }
        .r-item-qty { color: #9E9488; font-size: 12px; margin: 0 8px; }
        .r-item-price { font-weight: 600; color: #1A1814; }
        .r-items-empty { font-size: 13px; color: #9E9488; padding: 8px 0; }
        .r-divider { height: 1px; background: #F0EDE8; margin: 12px 0; }

        /* ── ACTIONS ── */
        .r-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .r-btn {
          padding: 8px 16px; border-radius: 8px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 6px;
          border: 1px solid transparent;
        }
        .r-btn:active { transform: scale(0.97); }
        .r-btn-process { background: #EFF6FF; color: #1D4ED8; border-color: #BFDBFE; }
        .r-btn-process:hover { background: #DBEAFE; }
        .r-btn-complete { background: #F0FDF4; color: #166534; border-color: #86EFAC; }
        .r-btn-complete:hover { background: #DCFCE7; }
        .r-btn-cancel { background: #FFF5F5; color: #C53030; border-color: #FEB2B2; }
        .r-btn-cancel:hover { background: #FED7D7; }
        .r-btn-print {
          background: #1A1814; color: #FFFFFF; margin-left: auto;
        }
        .r-btn-print:hover { background: #2A2620; }
        .r-done-text { font-size: 12px; font-weight: 600; color: #16A34A; display: flex; align-items: center; gap: 6px; }
        .r-cancel-text { font-size: 12px; font-weight: 600; color: #DC2626; display: flex; align-items: center; gap: 6px; }

        /* ── EMPTY ── */
        .r-empty {
          text-align: center; padding: 80px 20px;
          color: #C8C3BB; font-size: 13px; letter-spacing: 0.08em;
        }
        .r-empty-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.4; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #E8E4DF; border-radius: 4px; }
      `}</style>

      <div className="r-app">
        {/* ── SIDEBAR ── */}
        <nav className="r-sidebar">
          <div className="r-logo">K</div>
          <div className="r-nav-item active" title="Order">
            <span className="r-nav-icon">🧾</span>
            <span className="r-nav-label">Order</span>
          </div>
          <div className="r-nav-item" title="Meja">
            <span className="r-nav-icon">🪑</span>
            <span className="r-nav-label">Meja</span>
          </div>
          <div className="r-nav-item" title="Menu">
            <span className="r-nav-icon">🍽️</span>
            <span className="r-nav-label">Menu</span>
          </div>
          <div className="r-nav-item" title="Histori">
            <span className="r-nav-icon">🕐</span>
            <span className="r-nav-label">Histori</span>
          </div>
          <div className="r-nav-item" title="Laporan">
            <span className="r-nav-icon">📊</span>
            <span className="r-nav-label">Laporan</span>
          </div>
          <div className="r-sidebar-spacer" />
          <div className="r-nav-item" title="Logout" style={{ marginBottom: 8 }}>
            <LogoutButton iconOnly />
          </div>
        </nav>

        <div className="r-main">
          {/* ── TOPBAR ── */}
          <header className="r-topbar">
            <div className="r-topbar-left">
              <span className="r-topbar-title">Manajemen Order</span>
              <div className="r-live-badge">
                <div className="r-live-dot" />
                Live
              </div>
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
              <div className="r-avatar">K</div>
            </div>
          </header>

          <div className="r-body">
            {/* ── STAT CARDS ── */}
            <div className="r-stats">
              {STAT_CARDS.map((s) => (
                <div className="r-stat" key={s.label}>
                  <div className="r-stat-top">
                    <div className="r-stat-icon" style={{ background: s.iconBg }}>
                      {s.icon}
                    </div>
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
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="r-spacer" />
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
                  <div className="r-empty-icon">📋</div>
                  <div>Tidak ada order ditemukan</div>
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
                      {/* HEADER ROW */}
                      <div className="r-card-header">
                        <div className="r-order-icon">🧾</div>
                        <div className="r-order-info">
                          <div className="r-order-code">{order.order_code || "No Code"}</div>
                          <div className="r-order-meta">
                            🪑 Meja {order.table_id} &middot; {order.items.length} item
                          </div>
                        </div>
                        <div className="r-card-right">
                          <span className="r-order-total">
                            Rp {Number(order.total_price).toLocaleString("id-ID")}
                          </span>
                          <span
                            className="r-status-badge"
                            style={statusBadgeStyle(order.status)}
                          >
                            {statusLabel(order.status)}
                          </span>
                          <span className="r-chevron">▾</span>
                        </div>
                      </div>

                      {/* EXPANDED BODY */}
                      {isExpanded && (
                        <div
                          className="r-card-body"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="r-items-label">Rincian Pesanan</div>
                          {order.items?.length === 0 ? (
                            <div className="r-items-empty">Tidak ada item</div>
                          ) : (
                            order.items.map((item) => (
                              <div key={item.id} className="r-item-row">
                                <span className="r-item-name">{item.menu?.name ?? "Unknown"}</span>
                                <span className="r-item-qty">× {item.quantity}</span>
                                <span className="r-item-price">
                                  Rp {(Number(item.price) * item.quantity).toLocaleString("id-ID")}
                                </span>
                              </div>
                            ))
                          )}

                          <div className="r-divider" />

                          <div className="r-actions">
                            {order.status === "pending" && (
                              <>
                                <button
                                  className="r-btn r-btn-process"
                                  onClick={() => updateStatus(order.id, "processing")}
                                >
                                  ▶ Proses
                                </button>
                                <button
                                  className="r-btn r-btn-cancel"
                                  onClick={() => updateStatus(order.id, "canceled")}
                                >
                                  ✕ Batal
                                </button>
                              </>
                            )}
                            {order.status === "processing" && (
                              <>
                                <button
                                  className="r-btn r-btn-complete"
                                  onClick={() => updateStatus(order.id, "completed")}
                                >
                                  ✓ Selesai
                                </button>
                                <button
                                  className="r-btn r-btn-cancel"
                                  onClick={() => updateStatus(order.id, "canceled")}
                                >
                                  ✕ Batal
                                </button>
                              </>
                            )}
                            {order.status === "completed" && (
                              <span className="r-done-text">✓ Order selesai</span>
                            )}
                            {order.status === "canceled" && (
                              <span className="r-cancel-text">✕ Order dibatalkan</span>
                            )}
                            <button
                              className="r-btn r-btn-print"
                              onClick={() => handlePrint(order)}
                            >
                              🧾 Print
                            </button>
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