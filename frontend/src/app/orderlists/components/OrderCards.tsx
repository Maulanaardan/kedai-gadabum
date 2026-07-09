import { type Order, type OrderStatus } from "../hooks/useOrders";
import styles from "./orderlists.module.css";

const statusBadgeStyle = (status: string): React.CSSProperties => {
  const map: Record<string, React.CSSProperties> = {
    pending:    { background: "#FEF9C3", color: "#854D0E", border: "1px solid #FDE047" },
    processing: { background: "#DBEAFE", color: "#1E40AF", border: "1px solid #93C5FD" },
    completed:  { background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC" },
    canceled:   { background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" },
  };
  return map[status] ?? { background: "#F3F4F6", color: "#374151" };
};

const statusLabel = (s: string) =>
  ({ pending: "Pending", processing: "Diproses", completed: "Selesai", canceled: "Dibatal" }[s] ?? s);

type OrderCardProps = {
  order: Order;
  isExpanded: boolean;
  view: "today" | "history";
  onToggle: (id: number) => void;
  onUpdateStatus: (id: number, status: OrderStatus) => void;
  onPrint: (order: Order) => void;
};

export function OrderCard({ order, isExpanded, view, onToggle, onUpdateStatus, onPrint }: OrderCardProps) {
  return (
    <div
      className={`${styles.orderCard}${isExpanded ? " " + styles.expanded : ""}`}
      onClick={() => onToggle(order.id)}
    >
      <div className={styles.cardHeader}>
        <div className={styles.orderIcon}>{order.order_type === "take_away" ? "🥡" : "🧾"}</div>
        <div className={styles.orderInfo}>
          <div className={styles.orderCode}>{order.order_code || "No Code"}</div>
          <div className={styles.orderMeta}>
            <span>🪑 Meja {order.table_id} · {order.items.length} item</span>
            {order.order_type ? (
              <span className={`${styles.orderTypeBadge} ${order.order_type === "dine_in" ? styles.orderTypeDine : styles.orderTypeTake}`}>
                {order.order_type === "dine_in" ? "🍽 Makan di Sini" : "🥡 Bawa Pulang"}
              </span>
            ) : null}
          </div>
          {view === "history" && order.createdAt && (
            <div className={styles.orderDate}>
              📅 {new Date(order.createdAt).toLocaleDateString("id-ID", {
                weekday: "short", day: "numeric", month: "short",
                year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </div>
          )}
        </div>
        <div className={styles.cardRight}>
          <span className={styles.orderTotal}>Rp {Number(order.total_price).toLocaleString("id-ID")}</span>
          <span className={styles.statusBadge} style={statusBadgeStyle(order.status)}>{statusLabel(order.status)}</span>
          <span className={styles.chevron}>▾</span>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.cardBody} onClick={(e) => e.stopPropagation()}>
          <div className={styles.itemsLabel}>Rincian Pesanan</div>
          {order.items?.length === 0 ? (
            <div className={styles.itemsEmpty}>Tidak ada item</div>
          ) : (
            order.items.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                <span className={styles.itemName}>{item.menu?.name ?? "Unknown"}</span>
                <span className={styles.itemQty}>× {item.quantity}</span>
                <span className={styles.itemPrice}>Rp {(Number(item.price) * item.quantity).toLocaleString("id-ID")}</span>
              </div>
            ))
          )}
          <div className={styles.divider} />
          <div className={styles.actions}>
            {view === "today" && order.status === "pending" && (
              <>
                <button className={`${styles.btn} ${styles.btnProcess}`} onClick={() => onUpdateStatus(order.id, "processing")}>▶ Proses</button>
                <button className={`${styles.btn} ${styles.btnCancel}`}  onClick={() => onUpdateStatus(order.id, "canceled")}>✕ Batal</button>
              </>
            )}
            {view === "today" && order.status === "processing" && (
              <>
                <button className={`${styles.btn} ${styles.btnComplete}`} onClick={() => onUpdateStatus(order.id, "completed")}>✓ Selesai</button>
                <button className={`${styles.btn} ${styles.btnCancel}`}   onClick={() => onUpdateStatus(order.id, "canceled")}>✕ Batal</button>
              </>
            )}
            {order.status === "completed" && <span className={styles.doneText}>✓ Order selesai</span>}
            {order.status === "canceled"  && <span className={styles.cancelText}>✕ Order dibatalkan</span>}
            <button className={`${styles.btn} ${styles.btnPrint}`} onClick={() => onPrint(order)}>🧾 Print</button>
          </div>
        </div>
      )}
    </div>
  );
}