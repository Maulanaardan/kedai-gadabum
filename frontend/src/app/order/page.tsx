"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Menu = {
  id: number;
  name: string;
  price: number;
};

export default function OrderPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [cart, setCart] = useState<Menu[]>([]);

  const searchParams = useSearchParams();
  const table = searchParams.get("table");
  const total = cart.reduce((sum, item) => sum + item.price, 0);

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
    setCart([...cart, menu]);
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
      {cart.map((item, index) => (
        <div key={index}>
          {item.name} - Rp {item.price}
        </div>
      ))}
      <h3>Total: Rp {total}</h3>
    </div>
  );
}