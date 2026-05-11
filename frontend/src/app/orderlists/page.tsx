"use client";
import toast from "react-hot-toast";
import { useRef } from "react";
import { fetchWithAuth } from "@/utils/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/LogoutButton";

type OrderStatus = "pending" | "processing" | "completed" | "canceled"

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
  menu?: Menu
};

type Order = {
  id: number;
  table_id: number;
  status: OrderStatus;
  total_price: string;
  order_code: string | null;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
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

      if (!res.ok) {
        console.error(data);
        setOrders([]);
        return;
      }

      prevCountRef.current = data.length;
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const roles = JSON.parse(sessionStorage.getItem("roles") || "[]");

    if (!token || !roles.includes("cashier")) {
      router.push("/login");
      return;
    }

    setLoading(false);
    fetchOrders();

    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  type OrderStatus = "pending" | "processing" | "completed" | "canceled";

  const updateStatus = async (id: number, status: OrderStatus) => {
    const token = sessionStorage.getItem("token");

    await fetch(`http://localhost:5000/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":     return "#facc15";
      case "processing":  return "#60a5fa";
      case "completed":   return "#4ade80";
      case "cancelled":   return "#f87171";
      default:            return "#ccc";
    }
  };

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
          body { margin: 0; background: #0f0e0c; }
          .cp-loading {
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: #0f0e0c; font-family: 'DM Sans', sans-serif;
            color: #e8c97a; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase;
          }
        `}</style>
        <div className="cp-loading">Loading...</div>
      </>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchStatus  = filter === "all" || order.status === filter;
    const matchSearch  = order.order_code?.toLowerCase().includes(search.toLowerCase()) || String(order.table_id).includes(search);
    const matchTable   = tableFilter === "all" || String(order.table_id) === tableFilter;
    return matchStatus && matchSearch && matchTable;
  });

  const pendingCount    = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter((o) => o.status === "processing").length;
  const completedCount  = orders.filter((o) => o.status === "completed").length;
  const canceledCount   = orders.filter((o) => o.status === "canceled").length;

  const handlePrint = (order: any) => {
    const itemsHtml = order.items.map((item: any) => `
      <div style="display:flex; justify-content:space-between;">
        <span>${item.menu?.name ?? "Menu"}</span>
        <span>${item.quantity} x ${item.price}</span>
      </div>
    `).join("");

    const content = `
      <div style="font-family: monospace; width: 250px;">
        <hr style="border-top:1px dashed #000;" />
        <h3 style="text-align:center;">Kedai Gadabum</h3>
        <hr/>
        <p>Order: ${order.order_code}</p>
        <p>Table: ${order.table_id}</p>
        <p>${new Date(order.createdAt).toLocaleString()}</p>
        <hr/>
        ${itemsHtml}
        <hr/>
        <h4>Total: Rp ${Number(order.total_price).toLocaleString("id-ID")}</h4>
        <hr/>
        <p style="text-align:center;">Terima kasih 🙏</p>
      </div>
    `;

    const win = window.open("", "", "width=300,height=500");
    win?.document.write(content);
    win?.document.close();
    win?.print();
  };

  const STATUS_FILTERS = [
    { key: "all",        label: "Semua" },
    { key: "pending",    label: "Pending" },
    { key: "processing", label: "Processing" },
    { key: "completed",  label: "Completed" },
    { key: "canceled",   label: "Canceled" },
  ];

  const STAT_CARDS = [
    { label: "Pending",    count: pendingCount,    color: "#c9a840", bg: "#c9a84015", border: "#c9a84030" },
    { label: "Processing", count: processingCount, color: "#60a5fa", bg: "#60a5fa15", border: "#60a5fa30" },
    { label: "Completed",  count: completedCount,  color: "#4ade80", bg: "#4ade8015", border: "#4ade8030" },
    { label: "Canceled",   count: canceledCount,   color: "#f87171", bg: "#f8717115", border: "#f8717130" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0e0c; }

        .cp-root {
          min-height: 100vh;
          background: #0f0e0c;
          color: #f0ece3;
          font-family: 'DM Sans', sans-serif;
        }

        /* HEADER */
        .cp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 36px;
          border-bottom: 1px solid #2a2825;
          position: sticky; top: 0;
          background: #0f0e0c;
          z-index: 20;
        }
        .cp-brand {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #e8c97a;
        }
        .cp-header-right { display: flex; align-items: center; gap: 12px; }
        .cp-live-pill {
          display: flex; align-items: center; gap: 8px;
          background: #1e1c19; border: 1px solid #2e2c29;
          border-radius: 50px; padding: 8px 18px;
          font-size: 11px; letter-spacing: 0.12em;
          text-transform: uppercase; color: #7a7260;
        }
        .cp-live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #e8c97a;
          animation: glow 1.6s infinite;
        }
        @keyframes glow {
          0%,100% { opacity:1; box-shadow:0 0 0 0 #e8c97a55; }
          50%      { opacity:.7; box-shadow:0 0 0 5px transparent; }
        }

        /* BODY */
        .cp-body { padding: 32px 36px; max-width: 1100px; margin: 0 auto; }

        /* STAT CARDS */
        .cp-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .cp-stat {
          border-radius: 12px;
          padding: 18px 20px;
          border: 1px solid;
        }
        .cp-stat-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 8px;
          opacity: 0.7;
        }
        .cp-stat-count {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          line-height: 1;
        }

        /* FILTER BAR */
        .cp-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .cp-filter-btn {
          padding: 8px 18px;
          border-radius: 50px;
          border: 1px solid #2a2825;
          background: #161410;
          color: #7a7260;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cp-filter-btn:hover { border-color: #e8c97a44; color: #c0b090; }
        .cp-filter-btn--active {
          background: linear-gradient(135deg, #e8c97a, #c9a840);
          color: #0f0e0c;
          border-color: transparent;
          font-weight: 700;
        }

        /* SEARCH ROW */
        .cp-search-row {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
        }
        .cp-search-input {
          flex: 1;
          padding: 10px 16px;
          background: #161410;
          border: 1px solid #2a2825;
          border-radius: 8px;
          color: #f0ece3;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .cp-search-input::placeholder { color: #3a3628; }
        .cp-search-input:focus { border-color: #e8c97a44; }
        .cp-table-select {
          padding: 10px 16px;
          background: #161410;
          border: 1px solid #2a2825;
          border-radius: 8px;
          color: #a09880;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          appearance: none;
          min-width: 140px;
          transition: border-color 0.2s;
        }
        .cp-table-select:focus { border-color: #e8c97a44; }

        /* ORDER CARD */
        .cp-order-card {
          background: #161410;
          border: 1px solid #232017;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 16px;
          transition: border-color 0.2s, transform 0.15s;
        }
        .cp-order-card:hover { border-color: #e8c97a22; transform: translateY(-1px); }

        .cp-order-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .cp-order-code {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #f0ece3;
        }
        .cp-status-pill {
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0f0e0c;
        }

        .cp-order-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 18px;
        }
        .cp-meta-item {
          font-size: 12px;
          color: #5c5848;
          letter-spacing: 0.06em;
        }
        .cp-meta-item span {
          color: #c0b090;
          font-weight: 500;
        }

        /* ITEMS TABLE */
        .cp-items-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #5c5848;
          margin-bottom: 10px;
        }
        .cp-item-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 7px 0;
          border-bottom: 1px solid #1e1c19;
          font-size: 13px;
        }
        .cp-item-row:last-child { border-bottom: none; }
        .cp-item-name { color: #c0b8a8; }
        .cp-item-price { color: #e8c97a; font-weight: 600; }
        .cp-items-empty { font-size: 13px; color: #5c5848; padding: 8px 0; }

        /* DIVIDER */
        .cp-divider { height: 1px; background: #1e1c19; margin: 18px 0; }

        /* ACTIONS */
        .cp-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .cp-action-btn {
          padding: 9px 18px;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }
        .cp-action-btn:hover  { opacity: 0.88; }
        .cp-action-btn:active { transform: scale(0.97); }
        .cp-btn-process { background: #60a5fa22; color: #60a5fa; border: 1px solid #60a5fa33; }
        .cp-btn-cancel  { background: #f8717122; color: #f87171; border: 1px solid #f8717133; }
        .cp-btn-print   {
          background: linear-gradient(135deg, #e8c97a, #c9a840);
          color: #0f0e0c;
          margin-left: auto;
        }
        .cp-status-done     { font-size: 12px; color: #4ade80; font-weight: 600; letter-spacing: 0.06em; }
        .cp-status-canceled { font-size: 12px; color: #f87171; font-weight: 600; letter-spacing: 0.06em; }

        /* EMPTY STATE */
        .cp-empty {
          text-align: center; padding: 80px 20px;
          color: #2a2820; font-size: 12px;
          letter-spacing: 0.16em; text-transform: uppercase;
        }
        .cp-empty-icon { font-size: 32px; margin-bottom: 14px; opacity: 0.2; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2825; border-radius: 4px; }
      `}</style>

      <div className="cp-root">
        {/* HEADER */}
        <header className="cp-header">
          <div className="cp-brand">Kasir</div>
          <div className="cp-header-right">
            <div className="cp-live-pill">
              <div className="cp-live-dot" />
              Live
            </div>
            <LogoutButton />
          </div>
        </header>

        <div className="cp-body">
          {/* STAT CARDS */}
          <div className="cp-stats">
            {STAT_CARDS.map((s) => (
              <div
                key={s.label}
                className="cp-stat"
                style={{ background: s.bg, borderColor: s.border, color: s.color }}
              >
                <div className="cp-stat-label">{s.label}</div>
                <div className="cp-stat-count">{s.count}</div>
              </div>
            ))}
          </div>

          {/* FILTER BUTTONS */}
          <div className="cp-filters">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`cp-filter-btn ${filter === f.key ? "cp-filter-btn--active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* SEARCH + TABLE FILTER */}
          <div className="cp-search-row">
            <input
              className="cp-search-input"
              type="text"
              placeholder="Cari order code / meja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="cp-table-select"
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

          {/* ORDER LIST */}
          {filteredOrders.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-icon">📋</div>
              <div>Tidak ada order ditemukan</div>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="cp-order-card">
                {/* HEAD */}
                <div className="cp-order-head">
                  <div className="cp-order-code">
                    {order.order_code || "No Code"}
                  </div>
                  <span
                    className="cp-status-pill"
                    style={{ background: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </span>
                </div>

                {/* META */}
                <div className="cp-order-meta">
                  <div className="cp-meta-item">
                    Meja <span>{order.table_id}</span>
                  </div>
                  <div className="cp-meta-item">
                    Total <span>Rp {Number(order.total_price).toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* ITEMS */}
                <div className="cp-items-label">Items</div>
                {order.items?.length === 0 ? (
                  <div className="cp-items-empty">Tidak ada item</div>
                ) : (
                  order.items.map((item) => (
                    <div key={item.id} className="cp-item-row">
                      <span className="cp-item-name">
                        {item.menu?.name ?? "Unknown"} × {item.quantity}
                      </span>
                      <span className="cp-item-price">
                        Rp {(Number(item.price) * item.quantity).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))
                )}

                <div className="cp-divider" />

                {/* ACTIONS */}
                <div className="cp-actions">
                  {order.status === "pending" && (
                    <>
                      <button
                        className="cp-action-btn cp-btn-process"
                        onClick={() => updateStatus(order.id, "processing")}
                      >
                        Proses
                      </button>
                      <button
                        className="cp-action-btn cp-btn-cancel"
                        onClick={() => updateStatus(order.id, "canceled")}
                      >
                        Batal
                      </button>
                    </>
                  )}

                  {order.status === "processing" && (
                    <button
                      className="cp-action-btn cp-btn-cancel"
                      onClick={() => updateStatus(order.id, "canceled")}
                    >
                      Batal
                    </button>
                  )}

                  {order.status === "completed" && (
                    <span className="cp-status-done">✓ Order selesai</span>
                  )}

                  {order.status === "canceled" && (
                    <span className="cp-status-canceled">✕ Order dibatalkan</span>
                  )}

                  <button
                    className="cp-action-btn cp-btn-print"
                    onClick={() => handlePrint(order)}
                  >
                    🧾 Print
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}