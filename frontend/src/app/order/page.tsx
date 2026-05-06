"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import toast from "react-hot-toast";

type Menu = {
  id: number;
  name: string;
  price: number;
};
type Order = {
  id: number;
};
type CartItem = Menu & {
  qty: number;
};

export default function OrderPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showQR, setShowQR] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const prevCountRef = useRef(0);
  const [cart, setCart] = useState<CartItem[]>([]);

  const searchParams = useSearchParams();
  const table = searchParams.get("table");
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

    const fetchMenus = async () => {
      try {
        const res = await fetch("http://localhost:5000/menus");
        const data = await res.json();
        setMenus(data);
      } catch (err) {
        console.error(err);
      }
    };

  const addToCart = (menu: Menu) => {
    const existing = cart.find((item) => item.id === menu.id);

    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === menu.id
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...menu, qty: 1 }]);
    }
  };
  const decreaseQty = (id: number) => {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? { ...item, qty: item.qty - 1 }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handleCheckout = async () => {
  if (!table) {
    alert("Table tidak ada!");
    return;
  }

  if (cart.length === 0) {
    alert("Keranjang kosong!");
    return;
  }

  const formattedItems = cart.map((item) => ({
    menu_id: item.id,
    quantity: item.qty,
  }));

  const res = await fetch("http://localhost:5000/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tableNumber: Number(table),
      item: formattedItems, // 🔥 INI YANG BENER
      total,
      payment_method: paymentMethod,
    }),
  });

  const data = await res.json();
  console.log("RESPONSE:", data);

  if (!res.ok) {
    alert(data.error);
    return;
  }

  if (paymentMethod === "qris") {
    setCurrentOrder(data.order);
    setShowQR(true);
  } else {
    alert("Order berhasil!");
    setCart([]);
  }
};

  useEffect(() => {
    // fetch menu sekali saat load
    fetchMenus();
  }, []);

  const handleConfirmPayment = async () => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/orders/${currentOrder.id}/pay`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    alert("Pembayaran berhasil!");

    setShowQR(false);
    setCart([]);
  };

  return (
    <>
      <div style={{ display: "flex", padding: 20, gap: 40 }}>

        <div style={{ flex: 2 }}>
          <h1>Order - Table {table}</h1>

          <h2>Menu</h2>
          {menus.map((menu) => (
            <div
              key={menu.id}
              style={{
                border: "1px solid #ccc",
                padding: 10,
                marginBottom: 10,
                borderRadius: 8,
              }}
            >
              <h3>{menu.name}</h3>
              <p>Rp {menu.price}</p>
              <button onClick={() => addToCart(menu)}>
                Tambah
              </button>
            </div>
          ))}
        </div>

        {/* 🔥 CART */}
        <div style={{ flex: 1 }}>
          <h2>Keranjang</h2>

          {cart.length === 0 && <p>Belum ada pesanan</p>}

          {cart.map((item) => (
            <div
              key={item.id}
              style={{
                borderBottom: "1px solid #ddd",
                paddingBottom: 10,
                marginBottom: 10,
              }}
            >
              <p>
                {item.name} - Rp {item.price}
              </p>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => decreaseQty(item.id)}>
                  -
                </button>
                <span>{item.qty}</span>
                <button onClick={() => addToCart(item)}>
                  +
                </button>
              </div>
            </div>
          ))}

          <h3>Total: Rp {total}</h3>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ marginTop: 10 }}
          >
            <option value="cash">Bayar di Kasir</option>
            <option value="qris">QRIS</option>
          </select>
          <button
            onClick={handleCheckout}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              backgroundColor: "green",
              color: "white",
              border: "none",
              borderRadius: 5,
            }}
          >
            Checkout
          </button>
        </div>
      </div>

      {showQR && currentOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            <h2>Scan QR untuk bayar</h2>

            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ORDER123"
              alt="QR"
            />

            <p>Total: Rp {currentOrder.total_price}</p>

            <button
              onClick={handleConfirmPayment}
              style={{
                marginTop: 10,
                background: "green",
                color: "#fff",
                padding: "8px 14px",
                border: "none",
                borderRadius: 8,
              }}
            >
              Sudah Bayar
            </button>
          </div>
        </div>
      )}
    </>
  );
}