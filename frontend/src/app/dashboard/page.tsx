"use client";

import { useEffect, useState } from "react";

type Order = {
  id: number;
  status: string;
  total_price: string;
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    const res = await fetch("http://localhost:5000/orders");
    const data = await res.json();
    setOrders(data);
  };

    useEffect(() => {
        fetchOrders();

        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, []);

  // 📊 HITUNG DATA
  const totalOrders = orders.length;

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total_price),
    0
  );

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>
        📊 Dashboard
      </h1>

      {/* CARD */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 20,
        marginTop: 20
      }}>
        
        <Card title="Total Orders" value={totalOrders} />
        <Card title="Revenue" value={`Rp ${totalRevenue}`} />
        <Card title="Pending" value={pendingOrders} />
        <Card title="Completed" value={completedOrders} />

      </div>
    </div>
  );
}

// 🔥 COMPONENT CARD
function Card({ title, value }: { title: string; value: any }) {
  return (
    <div style={{
      background: "#023644",
      padding: 20,
      borderRadius: 16,
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      color: "white"
    }}>
      <h3 style={{ fontSize: 14, opacity: 0.7 }}>{title}</h3>
      <p style={{ fontSize: 24, fontWeight: "bold" }}>{value}</p>
    </div>
  );
}