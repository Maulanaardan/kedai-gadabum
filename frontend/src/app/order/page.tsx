"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function OrderPage() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table");

  const [menus, setMenus] = useState<any[]>([]);

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
          <p>{menu.name}</p>
          <p>{menu.price}</p>
        </div>
      ))}
    </div>
  );
}