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
  Bar,
  BarChart
} from "recharts";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/LogoutButton";

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  menu?: {
    name: string;
  };
};
type Order = {
  id: number;
  table_id: number;
  status: string;
  total_price: string;
  createdAt: string;
  order_code: string;
  item: OrderItem[];
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
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (order) =>
      new Date(order.createdAt).toDateString() === today
  );
  const latestOrders = [...orders]
  .sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  )
  .slice(0, 5);

  const todayOrderCount = todayOrders.length;

  const todayRevenue = todayOrders.reduce(
    (sum, order) => sum + Number(order.total_price),
    0
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#facc15"; // kuning
      case "processing":
        return "#60a5fa"; // biru
      case "completed":
        return "#4ade80"; // hijau
      case "canceled":
        return "#f87171"; // merah
      default:
        return "#9ca3af";
    }
  };

  const menuStats = orders.reduce((acc: any, order) => {
    order.item.forEach((item: any) => {
      const name = item.menu?.name ?? "Unknown";

      if (!acc[name]) {
        acc[name] = 0;
      }

      acc[name] += item.quantity;
    });

    return acc;
  }, {});

  const topMenus = Object.entries(menuStats)
  .map(([name, qty]) => ({ name, qty }))
  .sort((a: any, b: any) => b.qty - a.qty)
  .slice(0, 3);

  const menuChartData = topMenus.map((menu: any) => ({
    name: menu.name,
    total: menu.qty,
  }));

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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 15,
            marginTop: 20,
          }}
        >
          <div
            style={{
              background: "#111827",
              padding: 20,
              borderRadius: 16,
              color: "#fff",
            }}
          >
            <h3>Total Order Hari Ini</h3>
            <h1>{todayOrderCount}</h1>
          </div>

          <div
            style={{
              background: "#16a34a",
              padding: 20,
              borderRadius: 16,
              color: "#fff",
            }}
          >
            <h3>Omzet Hari Ini</h3>
            <h1>Rp {todayRevenue.toLocaleString("id-ID")}</h1>
          </div>
        </div>

        <div
          style={{
            marginTop: 30,
            background: "#111827",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginBottom: 20 }}>🧾 Order Terbaru</h2>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #374151" }}>
                <th style={{ padding: 10 }}>Order Code</th>
                <th style={{ padding: 10 }}>Table</th>
                <th style={{ padding: 10 }}>Total</th>
                <th style={{ padding: 10 }}>Status</th>
                <th style={{ padding: 10 }}>Tanggal</th>
              </tr>
            </thead>

            <tbody>
              {latestOrders.map((order) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: "1px solid #1f2937" }}
                >
                  <td style={{ padding: 10 }}>{order.order_code}</td>
                  <td style={{ padding: 10 }}>Table {order.table_id}</td>
                  <td style={{ padding: 10 }}>
                    Rp {Number(order.total_price).toLocaleString("id-ID")}
                  </td>
                  <td style={{ padding: 10 }}>
                    <span
                      style={{
                        background: getStatusColor(order.status),
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: "bold",
                        color: "#fff",
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 20,
            background: "#111827",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h2 style={{ marginBottom: 20 }}>📊 Chart Menu Terlaris</h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={menuChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#60a5fa" />
            </BarChart>
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