"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Menu = {
  id: number;
  name: string;
  price: number;
};

export default function OrderPage() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table");

  const [menus, setMenus] = useState<Menu[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/menus")
      .then((res) => res.json())
      .then((data) => setMenus(data));
  }, []);

  return (
    <div>
      <h1>Order Page</h1>
      <p>Table: {table}</p>

      <h2>Menu:</h2>
      {menus.map((menu) => (
        <div key={menu.id}>
          {menu.name} - Rp {menu.price}
        </div>
      ))}
    </div>
  );
}