"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Menu = {
  id: number;
  name: string;
  price: number;
};
type CartItem = Menu & {
  qty: number;
};

export default function OrderPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const searchParams = useSearchParams();
  const table = searchParams.get("table");
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  useEffect(() => {
  fetch("http://localhost:5000/menus")
    .then((res) => {
      console.log("RES:", res);
      return res.json();
    })
    .then((data) => {
      console.log("DATA:", data);
      setMenus(data);
    })
    .catch((err) => console.error("ERROR:", err));
}, []);

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
    try {
      const res = await fetch("http://localhost:5000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableNumber: Number(table),
          items: cart,
          total,
        }),
      });

      const data = await res.json();
      console.log(data);

      alert("Order berhasil!");
      setCart([]); // reset cart
    } catch (err) {
      console.error(err);
      alert("Gagal order");
    }
  };

  return (
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
  );
}