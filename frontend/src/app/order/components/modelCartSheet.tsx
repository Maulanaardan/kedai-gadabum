import s from "../OrderPage.module.css";
import OrderHead from "./orderHead";
import OrderItems from "./orderItems";
import OrderFooter from "./orderFooter";

export default function ModelCartSheet({
  showCart,
  setShowCart,
  table,
  dineIn,
  setDineIn,
  cart,
  decreaseQty,
  addToCart,
  cartCount,
  total,
  tax,
  grandTotal,
  paymentMethod,
  setPaymentMethod,
  handleCheckout,
}: any) {
  if (!showCart) return null;

  return (
    <>
    <div
        className={s.sheetOverlay}
        onClick={() => setShowCart(false)}
    />
        <div className={s.sheet}>
            <div className={s.sheetHandleRow}>
                <span className={s.sheetTitle}>Pesanan</span>
                <div className={s.sheetHandle} />

                <button
                className={s.sheetClose}
                onClick={() => setShowCart(false)}
                >
                ✕
                </button>
            </div>

        <OrderHead
            table={table}
            dineIn={dineIn}
            setDineIn={setDineIn}
        />

        <OrderItems
            cart={cart}
            decreaseQty={decreaseQty}
            addToCart={addToCart}
        />

        <OrderFooter
            cart={cart}
            cartCount={cartCount}
            total={total}
            tax={tax}
            grandTotal={grandTotal}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            handleCheckout={handleCheckout}
        />
        </div>
    </>
  );
}