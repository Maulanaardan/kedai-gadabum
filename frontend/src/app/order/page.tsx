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
    <div>
      <h1>Order Page</h1>
      <p>Table: {table}</p>

      <h2>Menu:</h2>
      {menus.map((menu) => (
        <div key={menu.id}>
          {menu.name} - Rp {menu.price}
          <button onClick={() => addToCart(menu)}>
            Tambah
          </button>
        </div>
      ))}

      <h2>Keranjang:</h2>

      {cart.map((item) => (
        <div key={item.id}>
          {item.name} - Rp {item.price} x {item.qty}

          <button onClick={() => addToCart(item)}>+</button>
          <button onClick={() => decreaseQty(item.id)}>-</button>
        </div>
      ))}
    
      <h3>Total: Rp {total}</h3>
      <button onClick={handleCheckout}>
        Checkout
      </button>
    </div>
  );
}