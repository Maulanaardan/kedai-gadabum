"use client";
import toast from "react-hot-toast";
import { useRef } from "react";
import { useEffect, useState } from "react";

type OrderStatus = "pending" | "processing" | "completed" | "canceled"

type Menu = {
  id: number;
  name: string;
  price: number;
};

type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: string;
  sub_total: string;
  menu?: Menu
};

type Order = {
  id: number;
  table_id: number;
  status: OrderStatus;
  total_price: string;
  order_code: string | null;
  item: OrderItem[];
};

  export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const prevCountRef = useRef(0);

    const fetchOrders = async () => {
      try {
        const res = await fetch("http://localhost:5000/orders");
        const data = await res.json();

        if (
          prevCountRef.current !== 0 &&
          data.length > prevCountRef.current
        ) {
          toast.success("🚨 Order baru masuk!");
        }

        prevCountRef.current = data.length;
        setOrders(data);
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => {
      fetchOrders();

      const interval = setInterval(fetchOrders, 3000);

      return () => clearInterval(interval);
    }, []);

  type OrderStatus = "pending" | "processing" | "completed" | "canceled";

  const updateStatus = async (id: number, status: OrderStatus) => {
    await fetch(`http://localhost:5000/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    fetchOrders();
  };

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
        return "#ccc";
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📋 Daftar Order</h1>

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            background: "#023644",
          }}
        >
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ fontWeight: "bold" }}>
              {order.order_code || "No Code"}
            </h3>

            <span
              style={{
                background: getStatusColor(order.status),
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {order.status}
            </span>
          </div>

          <p>Table: {order.table_id}</p>
          <p>Total: Rp {order.total_price}</p>

          {/* ITEMS */}
          <h4 style={{ marginTop: 15 }}>🧾 Items:</h4>

          {order.item.length === 0 ? (
            <p style={{ color: "red" }}>Kosong ❌</p>
          ) : (
            order.item.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px dashed #ddd",
                  padding: "4px 0",
                }}
              >
                <div key={item.id}>
                  🍽 {item.menu?.name?? "Unknown"}  
                  <br />
                  {item.quantity} x Rp {item.price}
                </div>
              </div>
            ))
          )}

           {/* ACTION BUTTON */}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button
              onClick={() => updateStatus(order.id, "processing")}
              style={{
                background: "#60a5fa",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: 8,
                cursor: order.status !== "pending" ? "not-allowed" : "pointer",
              }}
              disabled={order.status !== "pending"}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Proses
            </button>

            <button
              onClick={() => updateStatus(order.id, "completed")}
              style={{
                background: "#4ade80",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: 8,
                cursor: order.status !== "processing" ? "not-allowed" : "pointer"
              }}
              disabled={order.status !== "processing"}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Selesai
            </button>

            <button
              onClick={() => updateStatus(order.id, "canceled")}
              style={{
                background: "#f87171",
                color: "#fff",
                padding: "6px 12px",
                border: "none",
                borderRadius: 8,
                cursor: (order.status === "completed" || order.status === "canceled")
                      ? "not-allowed"
                      : "pointer"
              }}
              disabled={order.status === "completed" || order.status === "canceled"}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Batal
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}