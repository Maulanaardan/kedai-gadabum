"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

type Menu = { id: number; name: string; price: number; category?: string; stock?: number};
type CartItem = Menu & { qty: number };

const CATEGORIES = ["Semua", "food", "drink", "snack"];

const CAT_LABELS: Record<string, string> = {
  Semua: "Semua",
  food: "Makanan",
  drink: "Minuman",
  snack: "Snack"
};

const FOOD_EMOJIS: Record<string, string> = {
  default: "🍽️",
  food: "🍛",
  drink: "🥤",
  snack: "🍟",
};

export default function OrderPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showQR, setShowQR] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [payStatus, setPayStatus] = useState<"waiting" | "paid" | "failed">("waiting");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [dineIn, setDineIn] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();
  const table = searchParams.get("table");

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = total;
  const tax = Math.round(total * 0.1);
  const grandTotal = subtotal + tax;

  const filteredMenus = menus
    .filter((m) => activeCategory === "Semua" || (m.category ?? "food") === activeCategory)
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const fetchMenus = async () => {
    try {
      const res = await fetch("http://localhost:5000/menus");
      const data = await res.json();
      setMenus(data);
    } catch {}
  };

  const addToCart = (menu: Menu) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === menu.id);
      return ex
        ? prev.map((i) => (i.id === menu.id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { ...menu, qty: 1 }];
    });
  };

  const decreaseQty = (id: number) =>
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0)
    );

  const startPolling = (orderId: number) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/orders/${orderId}/payment-status`);
        const data = await res.json();
        if (data.payment_status === "paid") {
          clearInterval(pollingRef.current!);
          setPayStatus("paid");
          setTimeout(() => { setShowQR(false); setCart([]); setPayStatus("waiting"); }, 2500);
        } else if (data.payment_status === "failed") {
          clearInterval(pollingRef.current!);
          setPayStatus("failed");
        }
      } catch {}
    }, 3000);
  };

  const stopPolling = () => { if (pollingRef.current) clearInterval(pollingRef.current); };

  const handleCheckout = async () => {
    if (!table) { alert("Table tidak ada!"); return; }
    if (cart.length === 0) { alert("Keranjang kosong!"); return; }
    const res = await fetch("http://localhost:5000/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: Number(table),
        item: cart.map((i) => ({ menu_id: i.id, quantity: i.qty })),
        total: grandTotal,
        payment_method: paymentMethod,
      }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    if (paymentMethod === "qris") {
      setCurrentOrder(data.order);
      setQrUrl(data.qr_url);
      setPayStatus("waiting");
      setShowQR(true);
      startPolling(data.order.id);
    } else {
      alert("Order berhasil!");
      setCart([]);
    }
  };

  const handleConfirmPayment = async () => {
    const token = sessionStorage.getItem("token");
    await fetch(`http://localhost:5000/orders/${currentOrder.id}/pay`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Pembayaran berhasil!");
    stopPolling();
    setShowQR(false);
    setCart([]);
  };

  useEffect(() => { fetchMenus(); return () => stopPolling(); }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Lora:wght@600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #f7f5f2;
          --surface: #ffffff;
          --border: #ece9e3;
          --accent: #f97316;
          --accent-light: #fff4ed;
          --accent-hover: #ea6b0d;
          --text-primary: #1a1714;
          --text-secondary: #6b6560;
          --text-muted: #b0ab a3;
          --gold: #f59e0b;
          --success: #22c55e;
          --danger: #ef4444;
          --radius-sm: 10px;
          --radius-md: 16px;
          --radius-lg: 24px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
          --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
        }

        body { background: var(--bg); overflow: hidden; }
        html { overflow: hidden; }

        .pg-root {
          height: 100vh;
          overflow: hidden;
          background: var(--bg);
          font-family: 'Sora', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ── HEADER ── */
        .pg-header {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 40;
          box-shadow: var(--shadow-sm);
        }
        .pg-logo {
          font-family: 'Lora', serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .pg-logo span { color: var(--accent); }
        .pg-header-center {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .pg-table-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: #fff;
          border-radius: 50px;
          padding: 7px 18px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .pg-table-badge-icon { font-size: 14px; }

        /* ── BODY ── */
        .pg-body {
          display: flex;
          flex: 1;
          gap: 0;
          height: calc(100vh - 64px);
          min-height: 0;
          overflow: hidden;
        }

        /* ── MENU PANEL ── */
        .pg-menu-panel {
          flex: 1;
          padding: 28px 32px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .pg-search-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pg-search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 16px;
          transition: border-color 0.2s;
        }
        .pg-search-box:focus-within { border-color: var(--accent); }
        .pg-search-icon { color: var(--text-secondary); font-size: 16px; }
        .pg-search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          color: var(--text-primary);
          outline: none;
        }
        .pg-search-input::placeholder { color: #c4bfb8; }

        .pg-cat-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pg-cat-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid var(--border);
          background: var(--surface);
          color: var(--text-secondary);
          transition: all 0.18s;
          white-space: nowrap;
          font-family: 'Sora', sans-serif;
        }
        .pg-cat-tab:hover { border-color: var(--accent); color: var(--accent); }
        .pg-cat-tab.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
          box-shadow: 0 4px 12px rgba(249,115,22,0.3);
        }

        .pg-section-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .pg-section-title {
          font-family: 'Lora', serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .pg-section-count {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .pg-menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }
        .pg-menu-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s;
          position: relative;
        }
        .pg-menu-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
          border-color: var(--accent);
        }
        .pg-menu-img {
          width: 100%;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
          background: linear-gradient(145deg, #fef9f5, #fdf0e6);
          border-bottom: 1px solid var(--border);
        }
        .pg-menu-body { padding: 14px; }
        .pg-menu-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
          line-height: 1.3;
        }
        .pg-menu-avail {
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }
        .pg-menu-avail b { color: var(--success); font-weight: 600; }
        .pg-menu-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pg-menu-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--accent);
        }
        .pg-menu-add-btn {
          width: 30px;
          height: 30px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, transform 0.1s;
          font-family: 'Sora', sans-serif;
          line-height: 1;
        }
        .pg-menu-add-btn:hover { background: var(--accent-hover); transform: scale(1.08); }
        .pg-menu-in-cart {
          position: absolute;
          top: 10px;
          right: 10px;
          background: var(--accent);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── ORDER PANEL ── */
        .pg-order-panel {
          width: 320px;
          flex-shrink: 0;
          background: var(--surface);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }
        .pg-order-head {
          padding: 24px 24px 16px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .pg-order-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .pg-order-label { font-size: 11px; color: var(--text-secondary); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; }
        .pg-order-code { font-size: 18px; font-weight: 700; color: var(--text-primary); font-family: 'Lora', serif; }
        .pg-order-table-num {
          background: var(--accent-light);
          border: 1px solid #fed7aa;
          color: var(--accent);
          font-weight: 700;
          font-size: 14px;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pg-dine-tabs {
          display: flex;
          gap: 8px;
        }
        .pg-dine-tab {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          border: 1.5px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          font-family: 'Sora', sans-serif;
          transition: all 0.15s;
        }
        .pg-dine-tab.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }

        .pg-order-items {
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px;
          min-height: 0;
        }
        .pg-order-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 10px;
          color: #c4bfb8;
          font-size: 13px;
        }
        .pg-order-empty-icon { font-size: 40px; opacity: 0.4; }
        .pg-order-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .pg-order-row:last-child { border-bottom: none; }
        .pg-order-img {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: linear-gradient(145deg, #fef9f5, #fdf0e6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          border: 1px solid var(--border);
        }
        .pg-order-info { flex: 1; min-width: 0; }
        .pg-order-item-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }
        .pg-order-item-sub { font-size: 11px; color: var(--text-secondary); }
        .pg-order-item-price {
          font-size: 13px;
          font-weight: 700;
          color: var(--accent);
          margin-top: 2px;
        }
        .pg-qty-ctrl {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 4px 8px;
          flex-shrink: 0;
        }
        .pg-qty-btn {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 16px;
          cursor: pointer;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          border-radius: 4px;
          transition: background 0.1s;
          font-family: 'Sora', sans-serif;
        }
        .pg-qty-btn:hover { background: var(--accent-light); }
        .pg-qty-num { font-size: 13px; font-weight: 700; color: var(--text-primary); min-width: 16px; text-align: center; }

        /* ── FOOTER ── */
        .pg-order-footer {
          padding: 20px 24px;
          border-top: 1px solid var(--border);
          background: var(--surface);
          flex-shrink: 0;
        }
        .pg-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .pg-summary-row.total {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 16px;
          padding-top: 8px;
          border-top: 1px dashed var(--border);
        }
        .pg-summary-row.total span:last-child { color: var(--accent); font-size: 17px; }
        .pg-payment-label { font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .pg-payment-select {
          width: 100%;
          padding: 10px 14px;
          background: var(--bg);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          color: var(--text-primary);
          margin-bottom: 12px;
          appearance: none;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }
        .pg-payment-select:focus { border-color: var(--accent); }
        .pg-checkout-btn {
          width: 100%;
          padding: 13px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Sora', sans-serif;
          letter-spacing: 0.02em;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(249,115,22,0.35);
        }
        .pg-checkout-btn:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(249,115,22,0.4); }
        .pg-checkout-btn:disabled { background: #d1cdc7; box-shadow: none; cursor: not-allowed; transform: none; }

        /* ── MODAL ── */
        .pg-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26,23,20,0.7);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .pg-modal-box {
          background: var(--surface);
          border-radius: var(--radius-lg);
          padding: 40px 36px;
          text-align: center;
          max-width: 360px;
          width: 90%;
          box-shadow: var(--shadow-lg);
        }
        .pg-modal-title { font-family: 'Lora', serif; font-size: 22px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
        .pg-modal-sub { font-size: 12px; color: var(--text-secondary); margin-bottom: 24px; letter-spacing: 0.06em; text-transform: uppercase; }
        .pg-qr-wrapper { display: inline-block; padding: 12px; background: #fff; border-radius: 12px; margin-bottom: 16px; border: 2px solid var(--border); }
        .pg-qr-wrapper img { display: block; border-radius: 4px; }
        .pg-modal-total { font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; }
        .pg-modal-total b { color: var(--accent); font-size: 20px; font-family: 'Lora', serif; }
        .pg-pay-waiting { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; color: var(--text-secondary); margin-bottom: 16px; letter-spacing: 0.06em; text-transform: uppercase; }
        .pg-pay-spinner { width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pg-pay-success { padding: 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; color: #16a34a; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; animation: pop 0.3s ease; }
        .pg-pay-failed { padding: 14px; background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 10px; color: #dc2626; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        @keyframes pop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        .pg-confirm-btn { width: 100%; padding: 12px; background: var(--bg); border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Sora', sans-serif; color: var(--text-secondary); margin-top: 12px; transition: all 0.15s; }
        .pg-confirm-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
        .pg-divider { height: 1px; background: var(--border); margin: 14px 0; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #d4cfc9; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          html, body { overflow: hidden; }

          .pg-header {
            padding: 0 16px;
            height: 56px;
          }
          .pg-logo { font-size: 18px; }

          .pg-body {
            flex-direction: column;
            height: calc(100vh - 56px);
          }

          .pg-menu-panel {
            flex: 1;
            padding: 16px;
            gap: 16px;
            overflow-y: auto;
            padding-bottom: 90px;
          }

          .pg-menu-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .pg-menu-img { font-size: 40px; }

          /* hide sidebar order panel on mobile */
          .pg-order-panel {
            display: none;
          }

          /* ── MOBILE CART FAB ── */
          .pg-cart-fab {
            display: flex;
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 50px;
            padding: 14px 28px;
            font-family: 'Sora', sans-serif;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            align-items: center;
            gap: 10px;
            box-shadow: 0 6px 24px rgba(249,115,22,0.4);
            z-index: 50;
            white-space: nowrap;
            transition: transform 0.15s, box-shadow 0.15s;
          }
          .pg-cart-fab:hover { transform: translateX(-50%) translateY(-2px); box-shadow: 0 8px 28px rgba(249,115,22,0.5); }
          .pg-cart-fab-badge {
            background: #fff;
            color: var(--accent);
            font-size: 12px;
            font-weight: 800;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* ── BOTTOM SHEET ── */
          .pg-sheet-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(26,23,20,0.5);
            z-index: 60;
            backdrop-filter: blur(2px);
          }
          .pg-sheet {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--surface);
            border-radius: 20px 20px 0 0;
            z-index: 70;
            flex-direction: column;
            max-height: 85vh;
            box-shadow: 0 -8px 32px rgba(0,0,0,0.15);
          }
          .pg-sheet-handle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px 0;
            flex-shrink: 0;
          }
          .pg-sheet-handle {
            width: 36px;
            height: 4px;
            background: var(--border);
            border-radius: 4px;
            margin: 0 auto 4px;
          }
          .pg-sheet-close {
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            color: var(--text-secondary);
          }
          .pg-sheet-title {
            font-family: 'Lora', serif;
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
          }
          .pg-sheet .pg-order-head {
            padding: 12px 20px 12px;
          }
          .pg-sheet .pg-order-items {
            flex: 1;
            overflow-y: auto;
            min-height: 0;
            padding: 12px 20px;
          }
          .pg-sheet .pg-order-footer {
            padding: 16px 20px;
          }
        }

        /* hide FAB and sheet on desktop */
        @media (min-width: 769px) {
          .pg-cart-fab { display: none; }
          .pg-sheet-overlay { display: none; }
          .pg-sheet { display: none; }
        }
      `}</style>

      <div className="pg-root">
        {/* HEADER */}
        <header className="pg-header">
          <div className="pg-logo">kedai<span>gadabum</span></div>
          <div className="pg-header-center">
              <img src="/logo.png" alt="Logo" style={{ height: "76px", objectFit: "contain" }} />
          </div>
          <div className="pg-table-badge">
            <span className="pg-table-badge-icon">🪑</span>
            Meja {table ?? "—"}
          </div>
        </header>

        <div className="pg-body">
          {/* MENU PANEL */}
          <main className="pg-menu-panel">
            {/* Search */}
            <div className="pg-search-row">
              <div className="pg-search-box">
                <span className="pg-search-icon">🔍</span>
                <input className="pg-search-input" placeholder="Cari menu..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="pg-cat-tabs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`pg-cat-tab${activeCategory === cat ? " active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {FOOD_EMOJIS[cat] ?? "🍽️"} {CAT_LABELS[cat] ?? cat}
                </button>
              ))}
            </div>

            {/* Section Head */}
            <div className="pg-section-head">
              <h2 className="pg-section-title">
                {activeCategory === "Semua" ? "Semua Menu" : CAT_LABELS[activeCategory] ?? activeCategory}
              </h2>
              <span className="pg-section-count">{filteredMenus.length} item tersedia</span>
            </div>

            {/* Menu Grid */}
            <div className="pg-menu-grid">
              {filteredMenus.map((menu) => {
                const inCart = cart.find((i) => i.id === menu.id);
                return (
                  <div key={menu.id} className="pg-menu-card">
                    {inCart && <div className="pg-menu-in-cart">{inCart.qty}</div>}
                    <div className="pg-menu-img">
                      {FOOD_EMOJIS[menu.category ?? "default"] ?? "🍽️"}
                    </div>
                    <div className="pg-menu-body">
                      <div className="pg-menu-name">{menu.name}</div>
                      <div className="pg-menu-avail">
                        {(menu.stock ?? 1) > 0
                          ? <b>Tersedia</b>
                          : <span style={{ color: "var(--danger)", fontWeight: 600 }}>Habis</span>
                        }
                      </div>
                      <div className="pg-menu-footer">
                        <div className="pg-menu-price">
                          Rp {menu.price.toLocaleString("id-ID")}
                        </div>
                        <button
                          className="pg-menu-add-btn"
                          onClick={() => addToCart(menu)}
                          disabled={(menu.stock ?? 1) <= 0}
                          style={(menu.stock ?? 1) <= 0 ? { background: "#d1cdc7", cursor: "not-allowed" } : {}}
                        >+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* ORDER PANEL */}
          <aside className="pg-order-panel">
            <div className="pg-order-head">
              <div className="pg-order-meta">
                <div>
                  <div className="pg-order-label">Pesanan Saat Ini</div>
                  <div className="pg-order-code">#907653</div>
                </div>
                <div>
                  <div className="pg-order-label" style={{ textAlign: "center" }}>Meja</div>
                  <div className="pg-order-table-num">T{table ?? "1"}</div>
                </div>
              </div>
              <div className="pg-dine-tabs">
                <button className={`pg-dine-tab${dineIn ? " active" : ""}`} onClick={() => setDineIn(true)}>Makan di Sini</button>
                <button className={`pg-dine-tab${!dineIn ? " active" : ""}`} onClick={() => setDineIn(false)}>Bawa Pulang</button>
              </div>
            </div>

            <div className="pg-order-items">
              {cart.length === 0 ? (
                <div className="pg-order-empty">
                  <div className="pg-order-empty-icon">🛒</div>
                  <span>Belum ada pesanan</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pg-order-row">
                    <div className="pg-order-img">
                      {FOOD_EMOJIS[item.category ?? "default"] ?? "🍽️"}
                    </div>
                    <div className="pg-order-info">
                      <div className="pg-order-item-name">{item.name}</div>
                      <div className="pg-order-item-price">
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="pg-qty-ctrl">
                      <button className="pg-qty-btn" onClick={() => decreaseQty(item.id)}>−</button>
                      <span className="pg-qty-num">{item.qty}</span>
                      <button className="pg-qty-btn" onClick={() => addToCart(item)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pg-order-footer">
              <div className="pg-summary-row">
                <span>Subtotal ({cartCount} item)</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="pg-summary-row">
                <span>Pajak (10%)</span>
                <span>Rp {tax.toLocaleString("id-ID")}</span>
              </div>
              <div className="pg-summary-row total">
                <span>Total</span>
                <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
              </div>
              <p className="pg-payment-label">Metode Pembayaran</p>
              <select
                className="pg-payment-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Bayar di Kasir</option>
                <option value="qris">QRIS</option>
              </select>
              <button
                className="pg-checkout-btn"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Checkout →
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* MOBILE CART FAB */}
      <button className="pg-cart-fab" onClick={() => setShowCart(true)}>
        🛒
        <span>Lihat Pesanan</span>
        {cartCount > 0 && <span className="pg-cart-fab-badge">{cartCount}</span>}
        {cartCount > 0 && <span>· Rp {grandTotal.toLocaleString("id-ID")}</span>}
      </button>

      {/* MOBILE BOTTOM SHEET */}
      {showCart && (
        <>
          <div className="pg-sheet-overlay" onClick={() => setShowCart(false)} />
          <div className="pg-sheet">
            <div className="pg-sheet-handle-row">
              <span className="pg-sheet-title">Pesanan</span>
              <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 4, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 10 }} />
              <button className="pg-sheet-close" onClick={() => setShowCart(false)}>✕</button>
            </div>
            <div className="pg-order-head">
              <div className="pg-order-meta">
                <div>
                  <div className="pg-order-label">Pesanan Saat Ini</div>
                  <div className="pg-order-code">#907653</div>
                </div>
                <div>
                  <div className="pg-order-label" style={{ textAlign: "center" }}>Meja</div>
                  <div className="pg-order-table-num">T{table ?? "1"}</div>
                </div>
              </div>
              <div className="pg-dine-tabs">
                <button className={`pg-dine-tab${dineIn ? " active" : ""}`} onClick={() => setDineIn(true)}>Makan di Sini</button>
                <button className={`pg-dine-tab${!dineIn ? " active" : ""}`} onClick={() => setDineIn(false)}>Bawa Pulang</button>
              </div>
            </div>
            <div className="pg-order-items">
              {cart.length === 0 ? (
                <div className="pg-order-empty">
                  <div className="pg-order-empty-icon">🛒</div>
                  <span>Belum ada pesanan</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pg-order-row">
                    <div className="pg-order-img">{FOOD_EMOJIS[item.category ?? "default"] ?? "🍽️"}</div>
                    <div className="pg-order-info">
                      <div className="pg-order-item-name">{item.name}</div>
                      <div className="pg-order-item-price">Rp {(item.price * item.qty).toLocaleString("id-ID")}</div>
                    </div>
                    <div className="pg-qty-ctrl">
                      <button className="pg-qty-btn" onClick={() => decreaseQty(item.id)}>−</button>
                      <span className="pg-qty-num">{item.qty}</span>
                      <button className="pg-qty-btn" onClick={() => addToCart(item)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="pg-order-footer">
              <div className="pg-summary-row">
                <span>Subtotal ({cartCount} item)</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="pg-summary-row">
                <span>Pajak (10%)</span>
                <span>Rp {tax.toLocaleString("id-ID")}</span>
              </div>
              <div className="pg-summary-row total">
                <span>Total</span>
                <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
              </div>
              <p className="pg-payment-label">Metode Pembayaran</p>
              <select className="pg-payment-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Bayar di Kasir</option>
                <option value="qris">QRIS</option>
              </select>
              <button className="pg-checkout-btn" onClick={handleCheckout} disabled={cart.length === 0}>
                Checkout →
              </button>
            </div>
          </div>
        </>
      )}

      {/* QR MODAL */}
      {showQR && currentOrder && (
        <div className="pg-modal-overlay">
          <div className="pg-modal-box">
            <h2 className="pg-modal-title">Scan & Bayar</h2>
            <p className="pg-modal-sub">QRIS · {currentOrder.order_code}</p>
            {qrUrl && payStatus === "waiting" && (
              <div className="pg-qr-wrapper">
                <img src={qrUrl} alt="QRIS" width={200} height={200} />
              </div>
            )}
            <div className="pg-modal-total">
              Total: <b>Rp {Number(currentOrder.total_price).toLocaleString("id-ID")}</b>
            </div>
            {payStatus === "waiting" && (
              <div className="pg-pay-waiting">
                <div className="pg-pay-spinner" />
                Menunggu pembayaran...
              </div>
            )}
            {payStatus === "paid" && <div className="pg-pay-success">✓ Pembayaran berhasil!</div>}
            {payStatus === "failed" && <div className="pg-pay-failed">✕ Pembayaran gagal / expired</div>}
            {payStatus === "waiting" && (
              <>
                <div className="pg-divider" />
                <button className="pg-confirm-btn" onClick={handleConfirmPayment}>
                  Sudah Bayar (Manual)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}