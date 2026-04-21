"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/LogoutButton";

type Order = {
  id: number;
  status: string;
  total_price: string;
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const chartData = orders.reduce((acc: any, order: any) => {
    const date = new Date(order.createdAt).toLocaleDateString();

    const existing = acc.find((item: any) => item.date === date);

    if (existing) {
        existing.total += Number(order.total_price);
        existing.count += 1;
    } else {
        acc.push({
        date,
        total: Number(order.total_price),
        count: 1,
        });
    }

    return acc;
    }, []);

  const fetchOrders = async () => {
    const res = await fetch("http://localhost:5000/orders");
    const data = await res.json();
    setOrders(data);
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");

    if (!isAdmin) {
      router.push("/login");
    } else {
      setCheckingAuth(false);
    }
  }, []);

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
  if (checkingAuth) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>
        📊 Dashboard
      </h1>
      <LogoutButton />

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

        <div style={{ marginTop: 40 }}>
            <h2>📈 Revenue per Hari</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#4ade80" />
                    </LineChart>
                </ResponsiveContainer>
        </div>

        <div style={{ marginTop: 40 }}>
            <h2>📦 Order per Hari</h2>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#60a5fa" />
                </LineChart>
            </ResponsiveContainer>
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