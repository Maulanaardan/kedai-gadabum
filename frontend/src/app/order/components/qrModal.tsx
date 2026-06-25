import s from "../OrderPage.module.css";

type Props = {
  showQR: boolean;
  currentOrder: any;
  qrUrl: string | null;
  payStatus: "waiting" | "paid" | "failed";
  handleConfirmPayment: () => void;
};

export default function QrModal({
  showQR,
  currentOrder,
  qrUrl,
  payStatus,
  handleConfirmPayment,
}: Props) {
  if (!showQR || !currentOrder) return null;

  return (
    <div className={s.modalOverlay}>
      <div className={s.modalBox}>
        <h2 className={s.modalTitle}>Scan & Bayar</h2>

        <p className={s.modalSub}>
          QRIS · {currentOrder.order_code}
        </p>

        {qrUrl && payStatus === "waiting" && (
          <div className={s.qrWrapper}>
            <img
              src={qrUrl}
              alt="QRIS"
              width={200}
              height={200}
            />
          </div>
        )}

        <div className={s.modalTotal}>
          Total:
          <b>
            Rp{" "}
            {Number(
              currentOrder.total_price
            ).toLocaleString("id-ID")}
          </b>
        </div>

        {payStatus === "waiting" && (
          <div className={s.payWaiting}>
            <div className={s.paySpinner} />
            Menunggu pembayaran...
          </div>
        )}

        {payStatus === "paid" && (
          <div className={s.paySuccess}>
            ✓ Pembayaran berhasil!
          </div>
        )}

        {payStatus === "failed" && (
          <div className={s.payFailed}>
            ✕ Pembayaran gagal / expired
          </div>
        )}

        {payStatus === "waiting" && (
          <>
            <div className={s.divider} />

            <button
              className={s.confirmBtn}
              onClick={handleConfirmPayment}
            >
              Sudah Bayar (Manual)
            </button>
          </>
        )}
      </div>
    </div>
  );
}