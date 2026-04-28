"use client";
import toast from "react-hot-toast";
import { useRef } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/LogoutButton";

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
    const router = useRouter();
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tableFilter, setTableFilter] = useState("all");

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
      const fetchOrders = () => {
        fetch("http://localhost:5000/orders")
          .then((res) => res.json())
          .then((data) => {
            console.log("DATA:", data);

            if (Array.isArray(data)) {
              setOrders(data);
            } else {
              setOrders([]);
            }

            setLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setLoading(false);
          });
      };

      fetchOrders();

      const interval = setInterval(() => {
        fetchOrders();
      }, 5000);

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

    // 🔥 update state langsung
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status } : order
      )
    );
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

  if (loading) {
    return <div>Loading...</div>;
  }

  const filteredOrders = orders.filter((order) => {
    const matchStatus =
      filter === "all" || order.status === filter;

    const matchSearch =
      order.order_code?.toLowerCase().includes(search.toLowerCase()) ||
      String(order.table_id).includes(search);

    const matchTable =
      tableFilter === "all" ||
      String(order.table_id) === tableFilter;

    return matchStatus && matchSearch && matchTable;
  });

  const pendingCount = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const processingCount = orders.filter(
    (order) => order.status === "processing"
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const canceledCount = orders.filter(
    (order) => order.status === "canceled"
  ).length;

  const handlePrint = (order: any) => {
    const itemsHtml = order.item
      .map(
        (item: any) => `
          <div style="display:flex; justify-content:space-between;">
            <span>${item.menu?.name ?? "Menu"}</span>
            <span>${item.quantity} x ${item.price}</span>
          </div>
        `
      )
      .join("");

    const content = `
      <div style="font-family: monospace; width: 250px;">
        <hr style="border-top:1px dashed #000;" />
        <h3 style="text-align:center;">Kedai Gadabum</h3>
        <hr/>
        <p>Order: ${order.order_code}</p>
        <p>Table: ${order.table_id}</p>
        <p>${new Date(order.createdAt).toLocaleString()}</p>
        <hr/>
        ${itemsHtml}
        <hr/>
        <h4>Total: Rp ${Number(order.total_price).toLocaleString("id-ID")}</h4>
        <hr/>
        <p style="text-align:center;">Terima kasih 🙏</p>
      </div>
    `;

    const win = window.open("", "", "width=300,height=500");
    win?.document.write(content);
    win?.document.close();
    win?.print();
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      <LogoutButton />
      <button onClick={() => setFilter("all")}>All</button>
      <button onClick={() => setFilter("pending")} 
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          background: filter === "pending" ? "#facc15" : "#e5e7eb",
      }}>Pending</button>
      <button onClick={() => setFilter("processing")}
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          background: filter === "processing" ? "#facc15" : "#e5e7eb"
      }}>Processing</button>
      <button onClick={() => setFilter("completed")}
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          background: filter === "completed" ? "#facc15" : "#e5e7eb"
      }}>Completed</button>
      <button onClick={() => setFilter("canceled")}
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          background: filter === "cancelled" ? "#facc15" : "#e5e7eb"
      }}>Canceled</button>
    </div>
      <h1>📋 Daftar Order</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 15,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: "#facc15",
            color: "#000",
            padding: 15,
            borderRadius: 12,
            fontWeight: "bold",
          }}
        >
          Pending: {pendingCount}
        </div>

        <div
          style={{
            background: "#60a5fa",
            color: "#fff",
            padding: 15,
            borderRadius: 12,
            fontWeight: "bold",
          }}
        >
          Processing: {processingCount}
        </div>

        <div
          style={{
            background: "#4ade80",
            color: "#fff",
            padding: 15,
            borderRadius: 12,
            fontWeight: "bold",
          }}
        >
          Completed: {completedCount}
        </div>

        <div
          style={{
            background: "#f87171",
            color: "#fff",
            padding: 15,
            borderRadius: 12,
            fontWeight: "bold",
          }}
        >
          Canceled: {canceledCount}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          marginTop: 20,
        }}
      >
        <input
          type="text"
          placeholder="Cari order code / meja..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />

        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        >
          <option value="all">Semua Meja</option>
          <option value="1">Table 1</option>
          <option value="2">Table 2</option>
          <option value="3">Table 3</option>
          <option value="4">Table 4</option>
        </select>
      </div>

      {filteredOrders.map((order) => (
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
          <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
            {order.status === "pending" && (
              <>
                <button
                  onClick={() => updateStatus(order.id, "processing")}
                  style={{
                    background: "#60a5fa",
                    color: "#fff",
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Proses
                </button>

                <button
                  onClick={() => updateStatus(order.id, "canceled")}
                  style={{
                    background: "#f87171",
                    color: "#fff",
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
              </>
            )}

            {order.status === "processing" && (
              <>
                <button
                  onClick={() => updateStatus(order.id, "canceled")}
                  style={{
                    background: "#f87171",
                    color: "#fff",
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
              </>
            )}

            {order.status === "completed" && (
              <span style={{ color: "#4ade80", fontWeight: "bold" }}>
                ✅ Order selesai
              </span>
            )}

            {order.status === "canceled" && (
              <span style={{ color: "#f87171", fontWeight: "bold" }}>
                ❌ Order dibatalkan
              </span>
            )}

            <button
              onClick={() => handlePrint(order)}
              style={{
                background: "#facc15",
                color: "#000",
                padding: "8px 14px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              🧾 Print
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}