type Menu = { id: number; name: string; price: number };

type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: string;
  sub_total: string;
  menu?: Menu;
};

type Order = {
  id: number;
  table_id: number;
  status: string;
  total_price: string;
  order_code: string | null;
  order_type?: "dine_in" | "take_away";
  items: OrderItem[];
  createdAt?: string;
};

export function printReceipt(order: Order) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <div style="display:flex;justify-content:space-between;">
        <span>${item.menu?.name ?? "Menu"}</span>
        <span>${item.quantity} x Rp ${Number(item.price).toLocaleString("id-ID")}</span>
      </div>`
    )
    .join("");

  const content = `
    <div style="font-family:monospace;width:250px;">
      <hr style="border-top:1px dashed #000;"/>
      <h3 style="text-align:center;">Kedai Gadabum</h3>
      <hr/>
      <p>Order: ${order.order_code}</p>
      <p>Table: ${order.table_id}</p>
      <p>Tipe: ${order.order_type === "dine_in" ? "Makan di Sini" : "Bawa Pulang"}</p>
      <p>${order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</p>
      <hr/>${itemsHtml}<hr/>
      <h4>Total: Rp ${Number(order.total_price).toLocaleString("id-ID")}</h4>
      <hr/><p style="text-align:center;">Terima kasih 🙏</p>
    </div>`;

  const win = window.open("", "", "width=300,height=500");
  win?.document.write(content);
  win?.document.close();
  win?.print();
}