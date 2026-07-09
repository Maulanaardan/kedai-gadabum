import styles from "./orderlists.module.css";

type StatCard = {
  label: string;
  count: number;
  icon: string;
  iconBg: string;
  subLabel: string;
};

export function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className={styles.stats}>
      {cards.map((s) => (
        <div className={styles.stat} key={s.label}>
          <div className={styles.statTop}>
            <div className={styles.statIcon} style={{ background: s.iconBg }}>{s.icon}</div>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
          <div className={styles.statCount}>{s.count}</div>
          <div className={styles.statSub}>{s.subLabel}</div>
        </div>
      ))}
    </div>
  );
}