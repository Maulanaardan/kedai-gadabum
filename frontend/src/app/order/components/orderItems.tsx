import s from "../OrderPage.module.css";

const FOOD_EMOJIS: Record<string, string> = {
  default: "🍽️",
  food: "🍛",
  drink: "🥤",
  snack: "🍟",
};

export default function OrderItems({
  cart,
  decreaseQty,
  addToCart,
}: any) {
  return (
    <div className={s.orderItems}>
      {cart.length === 0 ? (
        <div className={s.orderEmpty}>
          <div className={s.orderEmptyIcon}>🛒</div>
          <span>Belum ada pesanan</span>
        </div>
      ) : (
        cart.map((item: any) => (
          <div key={item.id} className={s.orderRow}>
            <div className={s.orderImg}>
              {FOOD_EMOJIS[item.category ?? "default"] ?? "🍽️"}
            </div>

            <div className={s.orderInfo}>
              <div className={s.orderItemName}>
                {item.name}
              </div>

              <div className={s.orderItemPrice}>
                Rp {(item.price * item.qty).toLocaleString("id-ID")}
              </div>
            </div>

            <div className={s.qtyCtrl}>
              <button
                className={s.qtyBtn}
                onClick={() => decreaseQty(item.id)}
              >
                −
              </button>

              <span className={s.qtyNum}>
                {item.qty}
              </span>

              <button
                className={s.qtyBtn}
                onClick={() => addToCart(item)}
              >
                +
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}