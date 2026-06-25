import s from "../OrderPage.module.css";

export default function OrderHead({
  table,
  dineIn,
  setDineIn,
}: any) {
  return (
    <div className={s.orderHead}>
      <div className={s.orderMeta}>
        <div>
          <div className={s.orderLabel}>Pesanan Saat Ini</div>
          <div className={s.orderCode}>#907653</div>
        </div>

        <div>
          <div
            className={s.orderLabel}
            style={{ textAlign: "center" }}
          >
            Meja
          </div>
          <div className={s.orderTableNum}>
            T{table ?? "1"}
          </div>
        </div>
      </div>

      <div className={s.dineTabs}>
        <button
          className={`${s.dineTab} ${
            dineIn ? s.dineTabActive : ""
          }`}
          onClick={() => setDineIn(true)}
        >
          Makan di Sini
        </button>

        <button
          className={`${s.dineTab} ${
            !dineIn ? s.dineTabActive : ""
          }`}
          onClick={() => setDineIn(false)}
        >
          Bawa Pulang
        </button>
      </div>
    </div>
  );
}