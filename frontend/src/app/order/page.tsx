"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import s from "./OrderPage.module.css";

type Menu = { id: number; name: string; price: number; category?: string; stock?: number };
type CartItem = Menu & { qty: number };

const CATEGORIES = ["Semua", "food", "drink", "snack"];

const CAT_LABELS: Record<string, string> = {
  Semua: "Semua",
  food: "Makanan",
  drink: "Minuman",
  snack: "Snack",
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

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const tax = Math.round(total * 0.1);
  const grandTotal = total + tax;

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
        order_type: dineIn ? "dine_in" : "take_away",
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

  const OrderItems = () => (
    <div className={s.orderItems}>
      {cart.length === 0 ? (
        <div className={s.orderEmpty}>
          <div className={s.orderEmptyIcon}>🛒</div>
          <span>Belum ada pesanan</span>
        </div>
      ) : (
        cart.map((item) => (
          <div key={item.id} className={s.orderRow}>
            <div className={s.orderImg}>{FOOD_EMOJIS[item.category ?? "default"] ?? "🍽️"}</div>
            <div className={s.orderInfo}>
              <div className={s.orderItemName}>{item.name}</div>
              <div className={s.orderItemPrice}>Rp {(item.price * item.qty).toLocaleString("id-ID")}</div>
            </div>
            <div className={s.qtyCtrl}>
              <button className={s.qtyBtn} onClick={() => decreaseQty(item.id)}>−</button>
              <span className={s.qtyNum}>{item.qty}</span>
              <button className={s.qtyBtn} onClick={() => addToCart(item)}>+</button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const OrderFooter = () => (
    <div className={s.orderFooter}>
      <div className={s.summaryRow}>
        <span>Subtotal ({cartCount} item)</span>
        <span>Rp {total.toLocaleString("id-ID")}</span>
      </div>
      <div className={s.summaryRow}>
        <span>Pajak (10%)</span>
        <span>Rp {tax.toLocaleString("id-ID")}</span>
      </div>
      <div className={s.summaryRowTotal}>
        <span>Total</span>
        <span className={s.summaryTotalAmount}>Rp {grandTotal.toLocaleString("id-ID")}</span>
      </div>
      <p className={s.paymentLabel}>Metode Pembayaran</p>
      <select className={s.paymentSelect} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
        <option value="cash">Bayar di Kasir</option>
        <option value="qris">QRIS</option>
      </select>
      <button className={s.checkoutBtn} onClick={handleCheckout} disabled={cart.length === 0}>
        Checkout →
      </button>
    </div>
  );

  const OrderHead = () => (
    <div className={s.orderHead}>
      <div className={s.orderMeta}>
        <div>
          <div className={s.orderLabel}>Pesanan Saat Ini</div>
          <div className={s.orderCode}>#907653</div>
        </div>
        <div>
          <div className={s.orderLabel} style={{ textAlign: "center" }}>Meja</div>
          <div className={s.orderTableNum}>T{table ?? "1"}</div>
        </div>
      </div>
      <div className={s.dineTabs}>
        <button className={`${s.dineTab} ${dineIn ? s.dineTabActive : ""}`} onClick={() => setDineIn(true)}>Makan di Sini</button>
        <button className={`${s.dineTab} ${!dineIn ? s.dineTabActive : ""}`} onClick={() => setDineIn(false)}>Bawa Pulang</button>
      </div>
    </div>
  );

  return (
    <div className={s.root}>
      <header className={s.header}>
        <div className={s.logo}>kedai<span>gadabum</span></div>
        <div className={s.headerCenter}>
          <img src="/logo.png" alt="Logo" style={{ height: "63px", objectFit: "contain" }} />
        </div>
        <div className={s.tableBadge}>
          <span className={s.tableBadgeIcon}>🪑</span>
          Meja {table ?? "—"}
        </div>
      </header>

      <div className={s.pgBody}>
        <main className={s.menuPanel}>
          <div className={s.searchRow}>
            <div className={s.searchBox}>
              <span className={s.searchIcon}>🔍</span>
              <input
                className={s.searchInput}
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={s.catTabs}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`${s.catTab} ${activeCategory === cat ? s.catTabActive : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {FOOD_EMOJIS[cat] ?? "🍽️"} {CAT_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>

          <div className={s.sectionHead}>
            <h2 className={s.sectionTitle}>
              {activeCategory === "Semua" ? "Semua Menu" : CAT_LABELS[activeCategory] ?? activeCategory}
            </h2>
            <span className={s.sectionCount}>{filteredMenus.length} item tersedia</span>
          </div>

          <div className={s.menuGrid}>
            {filteredMenus.map((menu) => {
              const inCart = cart.find((i) => i.id === menu.id);
              const outOfStock = (menu.stock ?? 1) <= 0;
              return (
                <div key={menu.id} className={s.menuCard}>
                  {inCart && <div className={s.menuInCart}>{inCart.qty}</div>}
                  <div className={s.menuImg}>
                    {FOOD_EMOJIS[menu.category ?? "default"] ?? "🍽️"}
                  </div>
                  <div className={s.menuBody}>
                    <div className={s.menuName}>{menu.name}</div>
                    <div className={s.menuAvail}>
                      {outOfStock ? <span className={s.menuAvailOut}>Habis</span> : <b>Tersedia</b>}
                    </div>
                    <div className={s.menuFooter}>
                      <div className={s.menuPrice}>Rp {menu.price.toLocaleString("id-ID")}</div>
                      <button
                        className={`${s.menuAddBtn} ${outOfStock ? s.menuAddBtnDisabled : ""}`}
                        onClick={() => !outOfStock && addToCart(menu)}
                        disabled={outOfStock}
                      >+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <aside className={s.orderPanel}>
          <OrderHead />
          <OrderItems />
          <OrderFooter />
        </aside>
      </div>

      {/* MOBILE CART FAB */}
      <button className={s.cartFab} onClick={() => setShowCart(true)}>
        🛒
        <span>Lihat Pesanan</span>
        {cartCount > 0 && <span className={s.cartFabBadge}>{cartCount}</span>}
        {cartCount > 0 && <span>· Rp {grandTotal.toLocaleString("id-ID")}</span>}
      </button>

      {/* MOBILE BOTTOM SHEET */}
      {showCart && (
        <>
          <div className={s.sheetOverlay} onClick={() => setShowCart(false)} />
          <div className={s.sheet}>
            <div className={s.sheetHandleRow}>
              <span className={s.sheetTitle}>Pesanan</span>
              <div className={s.sheetHandle} />
              <button className={s.sheetClose} onClick={() => setShowCart(false)}>✕</button>
            </div>
            <OrderHead />
            <OrderItems />
            <OrderFooter />
          </div>
        </>
      )}

      {/* QR MODAL */}
      {showQR && currentOrder && (
        <div className={s.modalOverlay}>
          <div className={s.modalBox}>
            <h2 className={s.modalTitle}>Scan & Bayar</h2>
            <p className={s.modalSub}>QRIS · {currentOrder.order_code}</p>
            {qrUrl && payStatus === "waiting" && (
              <div className={s.qrWrapper}>
                <img src={qrUrl} alt="QRIS" width={200} height={200} />
              </div>
            )}
            <div className={s.modalTotal}>
              Total: <b>Rp {Number(currentOrder.total_price).toLocaleString("id-ID")}</b>
            </div>
            {payStatus === "waiting" && (
              <div className={s.payWaiting}>
                <div className={s.paySpinner} />
                Menunggu pembayaran...
              </div>
            )}
            {payStatus === "paid" && <div className={s.paySuccess}>✓ Pembayaran berhasil!</div>}
            {payStatus === "failed" && <div className={s.payFailed}>✕ Pembayaran gagal / expired</div>}
            {payStatus === "waiting" && (
              <>
                <div className={s.divider} />
                <button className={s.confirmBtn} onClick={handleConfirmPayment}>
                  Sudah Bayar (Manual)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}