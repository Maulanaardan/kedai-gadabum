"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/LogoutButton";
import { getPaidOrders, completeOrder } from "../../services/orderService";
import { getToken, getRoles } from "../../services/authService";
import styles from "./kitchenPage.module.css";

// ─── helpers ────────────────────────────────────────────────────────────────

const getMinutes = (date: string) =>
  Math.floor((Date.now() - new Date(date).getTime()) / 60000);

// ─── types ───────────────────────────────────────────────────────────────────

interface OrderItem {
  id: number;
  quantity: number;
  menu?: { name: string };
}

interface Order {
  id: number;
  table_id: number | string;
  order_code: string;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

// ─── OrderCard (di luar KitchenPage biar gak re-create tiap render) ──────────

interface OrderCardProps {
  order: Order;
  onComplete: (id: number) => void;
}

function OrderCard({ order, onComplete }: OrderCardProps) {
  const minutes = getMinutes(order.createdAt);
  const isUrgent = minutes > 10;
  const isCompleted = order.status?.toLowerCase().trim() === "completed";

  const cardClass = [
    styles.card,
    isCompleted  ? styles.cardDone   : "",
    isUrgent && !isCompleted ? styles.cardUrgent : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      {!isCompleted && (
        <div
          className={styles.accentBar}
          style={{
            width: `${Math.min(minutes * 8, 100)}%`,
            background: isUrgent
              ? "linear-gradient(90deg,#c9401a,#e85a1a)"
              : "linear-gradient(90deg,#c9a840,#e8c97a)",
          }}
        />
      )}

      <div className={styles.cardHead}>
        <div>
          <div className={styles.tableLabel}>MEJA</div>
          <div className={styles.tableNum}>{order.table_id}</div>
        </div>
        <span className={styles.orderCode}>{order.order_code}</span>
      </div>

      <div className={`${styles.timer} ${isUrgent ? styles.timerUrgent : ""}`}>
        ◷ {minutes} menit
      </div>

      <div className={styles.divider} />

      <div className={styles.items}>
        {order.items?.map((i) => (
          <div key={i.id} className={styles.itemRow}>
            <span className={styles.itemName}>{i.menu?.name}</span>
            <span className={styles.itemQty}>×{i.quantity}</span>
          </div>
        ))}
      </div>

      {order.status === "processing" && (
        <button className={styles.doneBtn} onClick={() => onComplete(order.id)}>
          Selesai
        </button>
      )}

      {isCompleted && (
        <div className={styles.readyTag}>✓ Siap Diambil</div>
      )}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div>{text}</div>
    </div>
  );
}

// ─── KitchenPage ─────────────────────────────────────────────────────────────

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const data = await getPaidOrders(token);

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    const roles = getRoles();

    if (!token || !roles.includes("kitchen")) {
      router.push("/login");
      return;
    }

    setLoading(false);
    fetchOrders();

    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleComplete = useCallback(async (id: number) => {
    const token = getToken();
    if (!token) return;
    await completeOrder(id, token);
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  const processing = orders.filter((o) => o.status?.toLowerCase().trim() === "processing");
  const completed  = orders.filter((o) => o.status?.toLowerCase().trim() === "completed");

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brand}>Kitchen Display</div>
        <div className={styles.headerRight}>
          <div className={styles.livePill}>
            <div className={styles.liveDot} />
            Live
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className={styles.body}>
        {/* PROCESSING */}
        <div className={styles.col}>
          <div className={styles.colHeader}>
            <span className={`${styles.colTitle} ${styles.colTitleProcess}`}>
              Sedang Dimasak
            </span>
            <span className={styles.colCount}>{processing.length}</span>
          </div>
          {processing.length === 0 ? (
            <EmptyState icon="🍳" text="Tidak ada pesanan" />
          ) : (
            processing.map((order) => (
              <OrderCard key={order.id} order={order} onComplete={handleComplete} />
            ))
          )}
        </div>

        {/* COMPLETED */}
        <div className={styles.col}>
          <div className={styles.colHeader}>
            <span className={`${styles.colTitle} ${styles.colTitleDone}`}>
              Siap Diambil
            </span>
            <span className={styles.colCount}>{completed.length}</span>
          </div>
          {completed.length === 0 ? (
            <EmptyState icon="✓" text="Belum ada yang selesai" />
          ) : (
            completed.map((order) => (
              <OrderCard key={order.id} order={order} onComplete={handleComplete} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}