import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { fetchWithAuth, API_URL } from "@/utils/api";

export type OrderStatus = "pending" | "processing" | "completed" | "canceled";

type Menu = { id: number; name: string; price: number };

export type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: string;
  sub_total: string;
  menu?: Menu;
};

export type Order = {
  id: number;
  table_id: number;
  status: OrderStatus;
  total_price: string;
  order_code: string | null;
  order_type?: "dine_in" | "take_away";
  items: OrderItem[];
  createdAt?: string;
};

export function useOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const prevCountRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/orders/cashier`);
      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        setOrders([]);
        return;
      }

      if (prevCountRef.current !== 0 && data.length > prevCountRef.current) {
        toast.success("🚨 Order baru masuk!");
      }

      prevCountRef.current = data.length;
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const updateStatus = useCallback(async (id: number, status: OrderStatus) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        toast.error("Gagal update status order");
        return;
      }

      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (err) {
      console.error(err);
      toast.error("Gagal update status order");
    }
  }, []);

 useEffect(() => {
  const token = sessionStorage.getItem("token");
  const roles = JSON.parse(sessionStorage.getItem("roles") || "[]");
  if (!token || !roles.includes("cashier")) {
    router.push("/login");
    return; // authorized tetap false, loading tetap true → blank screen
  }
  setAuthorized(true);
  setLoading(false);
  fetchOrders();
  const interval = setInterval(fetchOrders, 3000);
  return () => clearInterval(interval);
}, [fetchOrders]);

  return { orders, loading, authorized, updateStatus };
}