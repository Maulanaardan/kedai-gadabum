"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    console.log("TOKEN:", token); // 🔥 taruh di sini


    const res = await fetch("http://localhost:5000/orders/paid", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "kitchen") {
    router.push("/login");
    return;
  }

  setLoading(false);

  fetchOrders();

  const interval = setInterval(fetchOrders, 3000);
  return () => clearInterval(interval);
}, []);

  const handleComplete = async (id: number) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });

    fetchOrders();
  };

  const getMinutes = (date: string) => {
    return Math.floor(
      (Date.now() - new Date(date).getTime()) / 60000
    );
  };

  if (loading) return <div>Loading dashboard...</div>;
  const OrderCard = ({ order }: any) => {
    const minutes = getMinutes(order.createdAt);
    return (
      <div className="bg-zinc-900 rounded-2xl p-5 shadow-lg border border-zinc-800 hover:scale-[1.02] transition">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            🍽️ Meja {order.table_id}
          </h2>
          <span className="text-xs text-gray-400">
            {order.order_code}
          </span>
        </div>

        {/* TIMER */}
        <p
          className={`mt-2 text-sm ${
            minutes > 10 ? "text-red-400" : "text-yellow-400"
          }`}
        >
          ⏱️ {minutes} menit
        </p>

        {/* ITEMS */}
        <div className="mt-3 space-y-1">
          {order.items?.map((i: any) => (
            <p key={i.id} className="text-sm">
              {i.menu?.name} x{i.quantity}
            </p>
          ))}
        </div>

        {/* ACTION */}
        {order.status === "processing" && (
          <button
            onClick={() => handleComplete(order.id)}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 transition text-white py-2 rounded-xl font-semibold"
          >
            ✅ Selesai
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">
        👨‍🍳 Kitchen Display
      </h1>

      <div className="grid grid-cols-2 gap-6">
        {/* PROCESSING */}
        <div>
          <h2 className="text-xl mb-4 text-blue-400">
            🔥 Sedang Dimasak
          </h2>

          <div className="space-y-4">
            {orders
              .filter((o) => o.status?.toLowerCase().trim() === "processing")
              .map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
          </div>
        </div>

        {/* COMPLETED */}
        <div>
          <h2 className="text-xl mb-4 text-green-400">
            ✅ Siap Diambil
          </h2>

          <div className="space-y-4">
            {orders
              .filter((o) => o.status?.toLowerCase().trim() === "completed")
              .map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}