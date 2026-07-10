const db = require("./models");

async function seed() {
  try {
    console.log("Mulai seeding...");

    // Seed Tables (nomor meja 1-10)
    const tableCount = await db.Table.count();
    if (tableCount === 0) {
      const tables = Array.from({ length: 10 }, (_, i) => ({
        table_number: `${i + 1}`,
        qrCode: `table-${i + 1}`,
      }));
      await db.Table.bulkCreate(tables);
      console.log(`${tables.length} meja berhasil dibuat`);
    } else {
      console.log("Tables udah ada data, skip seeding tables");
    }

    // Seed Menu
    const menuCount = await db.Menu.count();
    if (menuCount === 0) {
      const menus = [
        {
          name: "Nasi Goreng Spesial",
          price: 25000,
          category: "food",
          description: "Nasi goreng dengan telur, ayam suwir, dan kerupuk",
          image: "",
          stock: 50,
        },
        {
          name: "Mie Ayam Bakso",
          price: 20000,
          category: "food",
          description: "Mie ayam dengan tambahan bakso sapi",
          image: "",
          stock: 50,
        },
        {
          name: "Ayam Geprek",
          price: 18000,
          category: "food",
          description: "Ayam goreng geprek sambal bawang level pedas custom",
          image: "",
          stock: 40,
        },
        {
          name: "Es Teh Manis",
          price: 5000,
          category: "drink",
          description: "Es teh manis segar",
          image: "",
          stock: 100,
        },
        {
          name: "Es Jeruk",
          price: 7000,
          category: "drink",
          description: "Es jeruk peras asli",
          image: "",
          stock: 80,
        },
        {
          name: "Kerupuk",
          price: 3000,
          category: "snack",
          description: "Kerupuk udang renyah",
          image: "",
          stock: 60,
        },
      ];
      await db.Menu.bulkCreate(menus);
      console.log(`${menus.length} menu berhasil dibuat`);
    } else {
      console.log("Menu udah ada data, skip seeding menu");
    }

    console.log("Seeding selesai!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding gagal:", error);
    process.exit(1);
  }
}

seed();