"use client";

import { useEffect, useState } from "react";

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([]);

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

  const handleComplete = async (id: number) => {
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
          {order.item?.map((i: any) => (
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
              .filter((o) => o.status === "processing")
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
              .filter((o) => o.status === "completed")
              .map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}