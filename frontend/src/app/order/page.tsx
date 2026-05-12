"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

type Menu = { id: number; name: string; price: number };
type CartItem = Menu & { qty: number };

export default function OrderPage() {
  const [menus, setMenus]               = useState<Menu[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showQR, setShowQR]             = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [qrUrl, setQrUrl]               = useState<string | null>(null);
  const [payStatus, setPayStatus]       = useState<"waiting" | "paid" | "failed">("waiting");
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const pollingRef                      = useRef<NodeJS.Timeout | null>(null);
  const prevCountRef                    = useRef(0);
  const [orders, setOrders]             = useState<any[]>([]);

  const searchParams = useSearchParams();
  const table  = searchParams.get("table");
  const total  = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const fetchMenus = async () => {
    try {
      const res  = await fetch("http://localhost:5000/menus");
      const data = await res.json();
      setMenus(data);
    } catch (err) { console.error(err); }
  };

  const addToCart = (menu: Menu) => {
    const existing = cart.find((item) => item.id === menu.id);
    if (existing) {
      setCart(cart.map((item) => item.id === menu.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...menu, qty: 1 }]);
    }
  };

  const decreaseQty = (id: number) => {
    setCart(
      cart.map((item) => item.id === id ? { ...item, qty: item.qty - 1 } : item)
          .filter((item) => item.qty > 0)
    );
  };

  // 🔥 Polling status pembayaran tiap 3 detik
  const startPolling = (orderId: number) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`http://localhost:5000/orders/${orderId}/payment-status`);
        const data = await res.json();

        if (data.payment_status === "paid") {
          clearInterval(pollingRef.current!);
          setPayStatus("paid");
          setTimeout(() => {
            setShowQR(false);
            setCart([]);
            setPayStatus("waiting");
          }, 2500);
        } else if (data.payment_status === "failed") {
          clearInterval(pollingRef.current!);
          setPayStatus("failed");
        }
      } catch (err) { console.error(err); }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  const handleCheckout = async () => {
    if (!table)          { alert("Table tidak ada!"); return; }
    if (cart.length === 0) { alert("Keranjang kosong!"); return; }

    const formattedItems = cart.map((item) => ({ menu_id: item.id, quantity: item.qty }));

    const res = await fetch("http://localhost:5000/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: Number(table),
        item: formattedItems,
        total,
        payment_method: paymentMethod,
      }),
    });

    const data = await res.json();
    console.log("RESPONSE:", data);

    if (!res.ok) { alert(data.error); return; }

    if (paymentMethod === "qris") {
      setCurrentOrder(data.order);
      setQrUrl(data.qr_url);      // 🔥 QR dari Midtrans
      setPayStatus("waiting");
      setShowQR(true);
      startPolling(data.order.id); // 🔥 mulai polling
    } else {
      alert("Order berhasil!");
      setCart([]);
    }
  };

  // handleConfirmPayment tetap ada (fallback manual, tidak dihapus)
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

  useEffect(() => {
    fetchMenus();
    return () => stopPolling(); // cleanup saat unmount
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .op-root {
          min-height: 100vh;
          background: #0f0e0c;
          color: #f0ece3;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
        }
        .op-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 36px; border-bottom: 1px solid #2a2825;
          background: #0f0e0c; position: sticky; top: 0; z-index: 50;
        }
        .op-header-brand { font-family:'Playfair Display',serif; font-size:22px; color:#e8c97a; }
        .op-header-table {
          display:flex; align-items:center; gap:10px; background:#1e1c19;
          border:1px solid #2e2c29; border-radius:50px; padding:8px 18px;
          font-size:13px; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; color:#a09880;
        }
        .op-header-table span { color:#e8c97a; font-weight:600; }
        .op-body { display:flex; flex:1; }
        .op-menu-panel { flex:2; padding:36px; overflow-y:auto; border-right:1px solid #1e1c19; }
        .op-section-label { font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:#5c5848; margin-bottom:20px; font-weight:500; }
        .op-menu-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
        .op-menu-card {
          background:#161410; border:1px solid #232017; border-radius:12px; padding:20px 18px;
          cursor:pointer; transition:border-color 0.2s, transform 0.15s, background 0.2s; position:relative; overflow:hidden;
        }
        .op-menu-card::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,#e8c97a08 0%,transparent 60%); opacity:0; transition:opacity 0.2s; pointer-events:none;
        }
        .op-menu-card:hover { border-color:#e8c97a44; transform:translateY(-2px); background:#1a1814; }
        .op-menu-card:hover::before { opacity:1; }
        .op-menu-name { font-size:15px; font-weight:500; color:#e8e0d0; margin-bottom:6px; line-height:1.3; }
        .op-menu-price { font-size:13px; color:#7a7260; margin-bottom:16px; }
        .op-menu-price b { color:#c9a84c; font-weight:500; }
        .op-add-btn {
          position:relative; z-index:2; width:100%; padding:9px;
          background:#e8c97a; color:#0f0e0c; border:none; border-radius:8px;
          font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif;
          letter-spacing:0.03em; transition:background 0.15s;
        }
        .op-add-btn:hover { background:#f5d980; }
        .op-cart-panel {
          flex:1; min-width:300px; max-width:360px; display:flex; flex-direction:column;
          background:#0d0c0a; padding:36px 28px; position:sticky; top:61px;
          height:calc(100vh - 61px); overflow-y:auto;
        }
        .op-cart-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
        .op-cart-title { font-family:'Playfair Display',serif; font-size:20px; color:#f0ece3; }
        .op-cart-badge {
          background:#e8c97a; color:#0f0e0c; font-size:11px; font-weight:700;
          width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center;
        }
        .op-cart-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:#3a3830; font-size:13px; }
        .op-cart-empty-icon { font-size:36px; opacity:0.3; }
        .op-cart-items { flex:1; }
        .op-cart-row { display:flex; align-items:center; justify-content:space-between; padding:14px 0; border-bottom:1px solid #1c1a16; gap:12px; }
        .op-cart-info { flex:1; min-width:0; }
        .op-cart-item-name { font-size:13px; font-weight:500; color:#d8d0c0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; }
        .op-cart-item-price { font-size:12px; color:#c9a84c; }
        .op-qty-ctrl { display:flex; align-items:center; gap:10px; background:#1a1814; border:1px solid #2a2820; border-radius:8px; padding:4px 10px; }
        .op-qty-btn { background:none; border:none; color:#a09070; font-size:16px; cursor:pointer; padding:0 2px; line-height:1; transition:color 0.15s; }
        .op-qty-btn:hover { color:#e8c97a; }
        .op-qty-num { font-size:13px; font-weight:600; color:#f0ece3; min-width:16px; text-align:center; }
        .op-cart-footer { margin-top:24px; border-top:1px solid #1c1a16; padding-top:20px; }
        .op-total-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:20px; }
        .op-total-label { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#5c5848; }
        .op-total-amount { font-family:'Playfair Display',serif; font-size:22px; color:#e8c97a; }
        .op-payment-label { font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#5c5848; margin-bottom:8px; }
        .op-payment-select {
          width:100%; padding:10px 14px; background:#161410; border:1px solid #2a2820;
          border-radius:8px; color:#d0c8b8; font-family:'DM Sans',sans-serif; font-size:13px;
          margin-bottom:14px; appearance:none; cursor:pointer; outline:none; transition:border-color 0.2s;
        }
        .op-payment-select:focus { border-color:#e8c97a66; }
        .op-checkout-btn {
          width:100%; padding:14px; background:linear-gradient(135deg,#e8c97a,#c9a840);
          color:#0f0e0c; border:none; border-radius:10px; font-size:14px; font-weight:700;
          cursor:pointer; font-family:'DM Sans',sans-serif; letter-spacing:0.04em;
          transition:opacity 0.15s, transform 0.15s; text-transform:uppercase;
        }
        .op-checkout-btn:hover { opacity:0.92; transform:translateY(-1px); }

        /* QR MODAL */
        .op-modal-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.85);
          backdrop-filter:blur(6px); display:flex; justify-content:center; align-items:center; z-index:100;
        }
        .op-modal-box {
          background:#0f0e0c; border:1px solid #2a2820; border-radius:20px;
          padding:40px 36px; text-align:center; max-width:360px; width:90%;
        }
        .op-modal-title { font-family:'Playfair Display',serif; font-size:22px; color:#f0ece3; margin-bottom:6px; }
        .op-modal-subtitle { font-size:11px; color:#5c5848; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:28px; }
        .op-qr-wrapper { display:inline-block; padding:12px; background:#fff; border-radius:12px; margin-bottom:20px; }
        .op-qr-wrapper img { display:block; border-radius:4px; }
        .op-modal-total { font-size:13px; color:#7a7260; margin-bottom:20px; }
        .op-modal-total b { color:#e8c97a; font-size:18px; font-family:'Playfair Display',serif; }

        /* STATUS STATES */
        .op-pay-waiting {
          display:flex; align-items:center; justify-content:center; gap:8px;
          font-size:12px; letter-spacing:0.1em; color:#7a7260; margin-bottom:16px; text-transform:uppercase;
        }
        .op-pay-spinner {
          width:14px; height:14px; border:2px solid #2a2820; border-top-color:#e8c97a;
          border-radius:50%; animation:spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        .op-pay-success {
          padding:14px; background:#4ade8022; border:1px solid #4ade8033;
          border-radius:10px; color:#4ade80; font-size:13px; font-weight:700;
          letter-spacing:0.08em; text-transform:uppercase; margin-bottom:0;
          animation: fadeIn 0.4s ease;
        }
        .op-pay-failed {
          padding:14px; background:#f8717122; border:1px solid #f8717133;
          border-radius:10px; color:#f87171; font-size:13px; font-weight:700;
          letter-spacing:0.08em; text-transform:uppercase;
        }
        @keyframes fadeIn { from{opacity:0; transform:scale(0.96)} to{opacity:1; transform:scale(1)} }

        .op-confirm-btn {
          width:100%; padding:13px; background:linear-gradient(135deg,#e8c97a,#c9a840);
          color:#0f0e0c; border:none; border-radius:10px; font-size:13px; font-weight:700;
          cursor:pointer; font-family:'DM Sans',sans-serif; letter-spacing:0.05em;
          text-transform:uppercase; transition:opacity 0.15s; margin-top:12px;
        }
        .op-confirm-btn:hover { opacity:0.9; }
        .op-divider { height:1px; background:#1e1c19; margin:16px 0; }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#2a2820; border-radius:4px; }
      `}</style>

      <div className="op-root">
        <header className="op-header">
          <div className="op-header-brand">Restoran</div>
          <div className="op-header-table">Meja <span>{table ?? "—"}</span></div>
        </header>

        <div className="op-body">
          <main className="op-menu-panel">
            <p className="op-section-label">Pilihan Menu</p>
            <div className="op-menu-grid">
              {menus.map((menu) => (
                <div key={menu.id} className="op-menu-card">
                  <div className="op-menu-name">{menu.name}</div>
                  <div className="op-menu-price">Rp <b>{menu.price.toLocaleString("id-ID")}</b></div>
                  <button className="op-add-btn" onClick={() => addToCart(menu)}>+ Tambah</button>
                </div>
              ))}
            </div>
          </main>

          <aside className="op-cart-panel">
            <div className="op-cart-header">
              <h2 className="op-cart-title">Pesanan</h2>
              {cartCount > 0 && <div className="op-cart-badge">{cartCount}</div>}
            </div>

            {cart.length === 0 ? (
              <div className="op-cart-empty">
                <div className="op-cart-empty-icon">🛒</div>
                <span>Belum ada pesanan</span>
              </div>
            ) : (
              <div className="op-cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="op-cart-row">
                    <div className="op-cart-info">
                      <div className="op-cart-item-name">{item.name}</div>
                      <div className="op-cart-item-price">Rp {(item.price * item.qty).toLocaleString("id-ID")}</div>
                    </div>
                    <div className="op-qty-ctrl">
                      <button className="op-qty-btn" onClick={() => decreaseQty(item.id)}>−</button>
                      <span className="op-qty-num">{item.qty}</span>
                      <button className="op-qty-btn" onClick={() => addToCart(item)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="op-cart-footer">
              <div className="op-total-row">
                <span className="op-total-label">Total</span>
                <span className="op-total-amount">Rp {total.toLocaleString("id-ID")}</span>
              </div>
              <p className="op-payment-label">Metode Pembayaran</p>
              <select className="op-payment-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Bayar di Kasir</option>
                <option value="qris">QRIS</option>
              </select>
              <button className="op-checkout-btn" onClick={handleCheckout}>Checkout</button>
            </div>
          </aside>
        </div>
      </div>

      {/* QR MODAL */}
      {showQR && currentOrder && (
        <div className="op-modal-overlay">
          <div className="op-modal-box">
            <h2 className="op-modal-title">Scan & Bayar</h2>
            <p className="op-modal-subtitle">QRIS · {currentOrder.order_code}</p>

            {/* 🔥 QR dari Midtrans */}
            {qrUrl && payStatus === "waiting" && (
              <div className="op-qr-wrapper">
                <img src={qrUrl} alt="QRIS" width={200} height={200} />
              </div>
            )}

            <div className="op-modal-total">
              Total: <b>Rp {Number(currentOrder.total_price).toLocaleString("id-ID")}</b>
            </div>

            {/* STATUS */}
            {payStatus === "waiting" && (
              <div className="op-pay-waiting">
                <div className="op-pay-spinner" />
                Menunggu pembayaran...
              </div>
            )}
            {payStatus === "paid" && (
              <div className="op-pay-success">✓ Pembayaran berhasil!</div>
            )}
            {payStatus === "failed" && (
              <div className="op-pay-failed">✕ Pembayaran gagal / expired</div>
            )}

            {/* Fallback tombol manual (tetap ada sesuai kode asal) */}
            {payStatus === "waiting" && (
              <>
                <div className="op-divider" />
                <button className="op-confirm-btn" onClick={handleConfirmPayment}>
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