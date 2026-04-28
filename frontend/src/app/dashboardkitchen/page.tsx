"use client";

import { useEffect, useState } from "react";

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = async () => {
    const res = await fetch("http://localhost:5000/orders/paid");
    const data = await res.json();
    setOrders(data);
  };

  const handleComplete = async (id: number) => {
    await fetch(`http://localhost:5000/orders/${id}/complete`, {
        method: "PUT",
    });

    fetchOrders(); // refresh data
   };

   const OrderCard = ({ order }: any) => {
    return (
        <div
        style={{
            background: "#111",
            borderRadius: 16,
            padding: 20,
            marginBottom: 15,
            color: "#fff",
            borderLeft: "6px solid #3b82f6",
        }}
        >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2>Meja {order.table_id}</h2>
            <span style={{ opacity: 0.7 }}>{order.order_code}</span>
        </div>

        {/* ITEMS */}
        <div style={{ marginTop: 10 }}>
            {order.item?.map((i: any) => (
            <p key={i.id}>
                🍽️ {i.menu?.name} x{i.quantity}
            </p>
            ))}
        </div>

        {/* ACTION */}
        {order.status === "processing" && (
            <button
            style={{
                marginTop: 15,
                background: "#22c55e",
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
            }}
            onClick={() => handleComplete(order.id)}
            >
            ✅ Selesai
            </button>
        )}
        </div>
    );
};
   
  useEffect(() => {
    fetchOrders();

    const interval = setInterval(fetchOrders, 3000); // 🔥 realtime
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 20 }}>
        <h1 style={{ marginBottom: 20 }}>👨‍🍳 Kitchen Display</h1>

        <div
            style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            }}
        >
            {/* PROCESSING */}
            <div>
            <h2>🔥 Sedang Dimasak</h2>
            {orders
                .filter((o) => o.status === "processing")
                .map((order) => (
                <OrderCard key={order.id} order={order} />
                ))}
            </div>

            {/* COMPLETED */}
            <div>
            <h2>✅ Siap Diambil</h2>
            {orders
                .filter((o) => o.status === "completed")
                .map((order) => (
                <OrderCard key={order.id} order={order} />
                ))}
            </div>
        </div>
    </div>
  );
}