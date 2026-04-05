"use client";

import { useEffect, useState } from "react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>📋 Daftar Order</h1>

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: 10,
            padding: 15,
            marginBottom: 15,
          }}
        >
          <h3>{order.order_code || "No Code"}</h3>
          <p>Table: {order.table_id}</p>
          <p>Status: {order.status}</p>
          <p>Total: Rp {order.total_price}</p>

          <h4>Items:</h4>

          {order.item.length === 0 ? (
            <p style={{ color: "red" }}>Kosong ❌</p>
          ) : (
            order.item.map((item: any) => (
              <div key={item.id}>
                Menu ID: {item.menu_item_id} x {item.quantity}
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}