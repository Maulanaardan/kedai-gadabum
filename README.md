# ☕ Kedai Gadabum

Sistem pemesanan cafe berbasis QR code yang memungkinkan pelanggan untuk scan QR meja, melihat menu, dan melakukan pemesanan langsung melalui website tanpa perlu ke kasir.

---

## 🚀 Fitur

- 📱 Scan QR code per meja
- 📋 Melihat menu makanan & minuman
- 🛒 Pemesanan langsung dari web
- 🧾 Sistem order (Order & Order Items)
- 💳 Sistem pembayaran (cash / QRIS / card)
- 🪑 Manajemen meja

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- Sequelize (ORM)
- MySQL

### Frontend
- Next.js
- React

---

## ⚙️ Cara Menjalankan Project

### 1. Clone repository
```bash
git clone https://github.com/USERNAME/kedai-gadabum.git
cd kedai-gadabum
2. Setup Backend
cd backend
npm install
npm run dev

Server berjalan di:

http://localhost:5000
3. Setup Frontend
cd frontend
npm install
npm run dev

Frontend berjalan di:
http://localhost:3000

🔗 API Endpoint (Contoh)
Get Menu
GET /menus
Create Order
POST /orders

Body:
{
  "table_id": 1,
  "items": [
    { "menu_id": 1, "quantity": 2 }
  ]
}
```
## 🎯 Tujuan Project

Project ini dibuat sebagai latihan fullstack development dan implementasi sistem pemesanan digital pada cafe menggunakan QR code.

## 👨‍💻 Author

Maulana Wardana
