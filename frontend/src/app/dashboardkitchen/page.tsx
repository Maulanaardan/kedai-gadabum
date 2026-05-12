"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/LogoutButton";

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = async () => {
    const token = sessionStorage.getItem("token");
    console.log("TOKEN:", token);

    const res = await fetch("http://localhost:5000/orders/paid", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const roles = JSON.parse(sessionStorage.getItem("roles") || "[]");

    if (!token || !roles.includes("kitchen")) {
      router.push("/login");
      return;
    }

    setLoading(false);
    fetchOrders();

    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleComplete = async (id: number) => {
    const token = sessionStorage.getItem("token");

    await fetch(`http://localhost:5000/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "completed" }),
    });

    fetchOrders();
  };

  const getMinutes = (date: string) => {
    return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  };

  if (loading)
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
          body { margin: 0; background: #0f0e0c; }
          .kp-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0f0e0c;
            font-family: 'DM Sans', sans-serif;
            color: #e8c97a;
            font-size: 13px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }
        `}</style>
        <div className="kp-loading">Loading dashboard...</div>
      </>
    );

  const OrderCard = ({ order }: any) => {
    const minutes = getMinutes(order.createdAt);
    const isUrgent = minutes > 10;
    const isCompleted = order.status?.toLowerCase().trim() === "completed";

    return (
      <div className={`kp-card ${isCompleted ? "kp-card--done" : ""} ${isUrgent && !isCompleted ? "kp-card--urgent" : ""}`}>
        {!isCompleted && (
          <div
            className="kp-accent-bar"
            style={{
              width: `${Math.min(minutes * 8, 100)}%`,
              background: isUrgent
                ? "linear-gradient(90deg,#c9401a,#e85a1a)"
                : "linear-gradient(90deg,#c9a840,#e8c97a)",
            }}
          />
        )}

        <div className="kp-card-head">
          <div>
            <div className="kp-table-label">MEJA</div>
            <div className="kp-table-num">{order.table_id}</div>
          </div>
          <span className="kp-order-code">{order.order_code}</span>
        </div>

        <div className={`kp-timer ${isUrgent ? "kp-timer--urgent" : ""}`}>
          ◷ {minutes} menit
        </div>

        <div className="kp-divider" />

        <div className="kp-items">
          {order.items?.map((i: any) => (
            <div key={i.id} className="kp-item-row">
              <span className="kp-item-name">{i.menu?.name}</span>
              <span className="kp-item-qty">×{i.quantity}</span>
            </div>
          ))}
        </div>

        {order.status === "processing" && (
          <button className="kp-done-btn" onClick={() => handleComplete(order.id)}>
            Selesai
          </button>
        )}

        {isCompleted && (
          <div className="kp-ready-tag">✓ Siap Diambil</div>
        )}
      </div>
    );
  };

  const processing = orders.filter((o) => o.status?.toLowerCase().trim() === "processing");
  const completed  = orders.filter((o) => o.status?.toLowerCase().trim() === "completed");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0e0c; }

        .kp-root {
          min-height: 100vh;
          background: #0f0e0c;
          color: #f0ece3;
          font-family: 'DM Sans', sans-serif;
        }

        /* HEADER */
        .kp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 36px;
          border-bottom: 1px solid #2a2825;
          position: sticky;
          top: 0;
          background: #0f0e0c;
          z-index: 10;
        }
        .kp-brand {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #e8c97a;
        }
        .kp-live-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #1e1c19;
          border: 1px solid #2e2c29;
          border-radius: 50px;
          padding: 8px 18px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7a7260;
        }
        .kp-live-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #e8c97a;
          animation: glow 1.6s infinite;
        }
        @keyframes glow {
          0%,100% { opacity: 1; box-shadow: 0 0 0 0 #e8c97a55; }
          50%      { opacity: .7; box-shadow: 0 0 0 5px transparent; }
        }

        /* BODY */
        .kp-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: calc(100vh - 65px);
        }

        /* COLUMN */
        .kp-col {
          padding: 32px 36px;
          border-right: 1px solid #1e1c19;
        }
        .kp-col:last-child { border-right: none; }
        .kp-col-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }
        .kp-col-title {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .kp-col-title--process { color: #e8c97a; }
        .kp-col-title--done    { color: #8aaa8a; }
        .kp-col-count {
          margin-left: auto;
          background: #1e1c19;
          border: 1px solid #2a2825;
          border-radius: 50px;
          padding: 3px 11px;
          font-size: 11px;
          color: #5c5848;
        }

        /* CARD */
        .kp-card {
          background: #161410;
          border: 1px solid #232017;
          border-radius: 12px;
          padding: 22px 20px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.15s;
        }
        .kp-card:hover { border-color: #e8c97a33; transform: translateY(-2px); }
        .kp-card--urgent { border-color: #c9401a33; }
        .kp-card--done   { opacity: 0.65; }

        .kp-accent-bar {
          position: absolute;
          top: 0; left: 0;
          height: 2px;
          border-radius: 0 2px 0 0;
          transition: width 0.6s ease;
        }

        /* CARD HEAD */
        .kp-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .kp-table-label {
          font-size: 9px;
          letter-spacing: 0.2em;
          color: #5c5848;
          margin-bottom: 2px;
        }
        .kp-table-num {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          color: #e8c97a;
          line-height: 1;
        }
        .kp-order-code {
          font-size: 10px;
          color: #3a3628;
          letter-spacing: 0.08em;
          margin-top: 4px;
        }

        /* TIMER */
        .kp-timer {
          display: inline-block;
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #c9a840;
          background: #c9a84010;
          border: 1px solid #c9a84022;
          border-radius: 50px;
          padding: 4px 12px;
          margin-bottom: 16px;
        }
        .kp-timer--urgent {
          color: #e85a1a;
          background: #e85a1a10;
          border-color: #e85a1a22;
        }

        /* DIVIDER */
        .kp-divider {
          height: 1px;
          background: #1e1c19;
          margin-bottom: 14px;
        }

        /* ITEMS */
        .kp-items { margin-bottom: 18px; }
        .kp-item-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 6px 0;
          border-bottom: 1px solid #1a1814;
        }
        .kp-item-row:last-child { border-bottom: none; }
        .kp-item-name { font-size: 13px; color: #c0b8a8; }
        .kp-item-qty  { font-size: 13px; font-weight: 600; color: #e8c97a; }

        /* DONE BTN */
        .kp-done-btn {
          width: 100%;
          padding: 11px;
          background: linear-gradient(135deg,#e8c97a,#c9a840);
          color: #0f0e0c;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }
        .kp-done-btn:hover  { opacity: 0.9; }
        .kp-done-btn:active { transform: scale(0.98); }

        /* READY TAG */
        .kp-ready-tag {
          text-align: center;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #8aaa8a;
          background: #8aaa8a10;
          border: 1px solid #8aaa8a22;
          border-radius: 8px;
          padding: 9px;
        }

        /* EMPTY */
        .kp-empty {
          text-align: center;
          padding: 60px 20px;
          color: #2a2820;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .kp-empty-icon { font-size: 30px; margin-bottom: 12px; opacity: 0.2; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2825; border-radius: 4px; }
      `}</style>

      <header className="kp-header">
        <div className="kp-brand">Kitchen Display</div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="kp-live-pill">
            <div className="kp-live-dot" />
            Live
          </div>
          <LogoutButton />
        </div>
      </header>

        <div className="kp-body">
          {/* PROCESSING */}
          <div className="kp-col">
            <div className="kp-col-header">
              <span className="kp-col-title kp-col-title--process">Sedang Dimasak</span>
              <span className="kp-col-count">{processing.length}</span>
            </div>
            {processing.length === 0 ? (
              <div className="kp-empty">
                <div className="kp-empty-icon">🍳</div>
                <div>Tidak ada pesanan</div>
              </div>
            ) : (
              processing.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </div>

          {/* COMPLETED */}
          <div className="kp-col">
            <div className="kp-col-header">
              <span className="kp-col-title kp-col-title--done">Siap Diambil</span>
              <span className="kp-col-count">{completed.length}</span>
            </div>
            {completed.length === 0 ? (
              <div className="kp-empty">
                <div className="kp-empty-icon">✓</div>
                <div>Belum ada yang selesai</div>
              </div>
            ) : (
              completed.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        </div>
    </>
  );
}