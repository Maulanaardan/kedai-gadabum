"use client";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "../components/LogoutButton";
import { printReceipt } from "./utils/printReceipt";
import { useOrders } from "./hooks/useOrders";
import { StatCards } from "./components/StatCards";
import { OrderCard } from "./components/OrderCards";
import styles from "./components/orderlists.module.css";


const NAV_ITEMS = [
    { icon: "🧾", label: "Order",   view: "today"   as const },
    { icon: "🕐", label: "Histori", view: "history" as const },
  ];

 const STATUS_FILTERS = [
    { key: "all",        label: "Semua"    },
    { key: "pending",    label: "Pending"  },
    { key: "processing", label: "Diproses" },
    { key: "completed",  label: "Selesai"  },
    { key: "canceled",   label: "Dibatal"  },
  ];

export default function OrdersPage() {
  const { authorized, loading: authLoading } = useAuthGuard("cashier");
  const { orders, loading, updateStatus } = useOrders();
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const router                        = useRouter();
  const [filter, setFilter]           = useState("all");
  const [search, setSearch]           = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [view, setView]               = useState<"today" | "history">("today");
  const [dateFilter, setDateFilter]   = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const roles = JSON.parse(sessionStorage.getItem("roles") || "[]");
    if (!token || !roles.includes("cashier")) {
      router.push("/login");
    }
  }, [router]);

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  if (authLoading || !authorized) {
    return <div className={styles.loading} />;
  }

  const todayStr = new Date().toLocaleDateString("en-CA");

  const displayOrders = view === "today"
    ? orders.filter((o) => o.createdAt?.slice(0, 10) === todayStr)
    : orders.filter((o) => {
        const d = o.createdAt?.slice(0, 10);
        if (!d || d >= todayStr) return false;
        if (dateFilter && d !== dateFilter) return false;
        return true;
      });

  const uniqueTables = Array.from(
    new Set(orders.map((o) => String(o.table_id)))
  ).sort((a, b) => Number(a) - Number(b));

  const filteredOrders = displayOrders.filter((order) => {
    const matchStatus = filter === "all" || order.status === filter;
    const matchSearch =
      order.order_code?.toLowerCase().includes(search.toLowerCase()) ||
      order.order_code?.replace("ORD-", "").includes(search) ||
      String(order.table_id).includes(search);
    const matchTable = tableFilter === "all" || String(order.table_id) === tableFilter;
    return matchStatus && matchSearch && matchTable;
  });

  const counts = {
    pending:    displayOrders.filter((o) => o.status === "pending").length,
    processing: displayOrders.filter((o) => o.status === "processing").length,
    completed:  displayOrders.filter((o) => o.status === "completed").length,
    canceled:   displayOrders.filter((o) => o.status === "canceled").length,
  };

  const STAT_CARDS = [
    { label: "Pending",  count: counts.pending,    icon: "⏳", iconBg: "#FEF9C3", subLabel: "Menunggu diproses" },
    { label: "Diproses", count: counts.processing, icon: "🔥", iconBg: "#DBEAFE", subLabel: "Sedang disiapkan"  },
    { label: "Selesai",  count: counts.completed,  icon: "✅", iconBg: "#DCFCE7", subLabel: view === "today" ? "Order hari ini" : "Total selesai" },
    { label: "Dibatal",  count: counts.canceled,   icon: "❌", iconBg: "#FEE2E2", subLabel: "Order dibatalkan"  },
  ];

  const hasDateFilter = !!dateFilter;

  return (
    <div className={styles.app}>
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="Logo" />
        </div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            className={`${styles.navItem}${view === item.view ? " " + styles.active : ""}`}
            title={item.label}
            onClick={() => {
              setView(item.view);
              setFilter("all");
              setSearch("");
              setDateFilter("");
            }}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
        <div className={styles.sidebarSpacer} />
        <div className={styles.navItem} title="Logout" style={{ marginBottom: 8 }}>
          <LogoutButton iconOnly />
        </div>
      </nav>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.topbarTitle}>
              {view === "today" ? "Manajemen Order" : "Histori Order"}
            </span>
            {view === "today" ? (
              <div className={styles.liveBadge}>
                <div className={styles.liveDot} />
                Live
              </div>
            ) : (
              <div className={styles.historyBadge}>🕐 Riwayat</div>
            )}
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.search}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Cari order / meja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className={styles.dateBadge}>
              📅 {new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </header>

        <div className={styles.body}>
          <StatCards cards={STAT_CARDS} />

          <div className={styles.controls}>
            <div className={styles.filterTabs}>
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`${styles.filterTab}${filter === f.key ? " " + styles.active : ""}`}
                  onClick={() => setFilter(f.key)}
                >{f.label}</button>
              ))}
            </div>

            <div className={styles.spacer} />

            {view === "history" && (
              <div className={styles.dateFilter}>
                <span className={styles.dateFilterLabel}>📅 Tanggal</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateFilter}
                  max={todayStr}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
                {hasDateFilter && (
                  <button
                    className={styles.dateReset}
                    onClick={() => setDateFilter("")}
                  >
                    ✕ Reset
                  </button>
                )}
              </div>
            )}

            {view === "history" && hasDateFilter && (
              <span className={styles.dateActiveBadge}>
                🔍 {dateFilter}
              </span>
            )}

            <select
              className={styles.tableSelect}
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
            >
              <option value="all">Semua Meja</option>
              {uniqueTables.map((t) => (
                <option key={t} value={t}>Table {t}</option>
              ))}
            </select>
          </div>

          <div className={styles.orders}>
            {filteredOrders.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>{view === "today" ? "📋" : "🕐"}</div>
                <div>
                  {view === "today"
                    ? "Tidak ada order hari ini"
                    : hasDateFilter
                      ? "Tidak ada order di rentang tanggal ini"
                      : "Tidak ada histori order"}
                </div>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isExpanded={expandedId === order.id}
                  view={view}
                  onToggle={toggleExpand}
                  onUpdateStatus={updateStatus}
                  onPrint={printReceipt}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}