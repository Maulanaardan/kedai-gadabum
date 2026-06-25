import s from "../OrderPage.module.css";

export default function OrderFooter({
  cart,
  cartCount,
  total,
  tax,
  grandTotal,
  paymentMethod,
  setPaymentMethod,
  handleCheckout,
}: any) {
  return (
    <div className={s.orderFooter}>
      <div className={s.summaryRow}>
        <span>Subtotal ({cartCount} item)</span>
        <span>Rp {total.toLocaleString("id-ID")}</span>
      </div>

      <div className={s.summaryRow}>
        <span>Pajak (10%)</span>
        <span>Rp {tax.toLocaleString("id-ID")}</span>
      </div>

      <div className={s.summaryRowTotal}>
        <span>Total</span>
        <span className={s.summaryTotalAmount}>
          Rp {grandTotal.toLocaleString("id-ID")}
        </span>
      </div>

      <p className={s.paymentLabel}>
        Metode Pembayaran
      </p>

      <select
        className={s.paymentSelect}
        value={paymentMethod}
        onChange={(e) =>
          setPaymentMethod(e.target.value)
        }
      >
        <option value="cash">
          Bayar di Kasir
        </option>
        <option value="qris">
          QRIS
        </option>
      </select>

      <button
        className={s.checkoutBtn}
        onClick={handleCheckout}
        disabled={cart.length === 0}
      >
        Checkout →
      </button>
    </div>
  );
}