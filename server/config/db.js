import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Session from '../models/Session.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DEMO_DATA = {
  settings: {
    key: "admin_settings",
    qrImage: "",
    deepseekApiKey: ""
  },
  session: {
    id: "demo-lunch",
    title: "Gom Đặt Cơm Trưa Hôm Nay",
    restaurantName: "Quán Cơm Tấm & Nước Giải Khát",
    status: "OPEN",
    createdAt: new Date(),
    menuData: [
      {
        category: "Món Chính",
        items: [
          {
            id: "item_1",
            name: "Cơm Tấm Sườn Nướng",
            price: 45000,
            description: "Sườn nướng mật ong, mỡ hành, đồ chua",
            options: [
              {
                title: "Size",
                choices: [{ name: "Vừa", price: 0 }, { name: "Lớn", price: 5000 }]
              },
              {
                title: "Topping thêm",
                choices: [{ name: "Trứng ốp la", price: 7000 }, { name: "Chả trứng", price: 8000 }]
              }
            ]
          },
          {
            id: "item_2",
            name: "Cơm Gà Xối Mỡ",
            price: 48000,
            description: "Đùi gà xối mỡ mắm tỏi dầm dưa leo",
            options: [
              {
                title: "Topping thêm",
                choices: [{ name: "Canh súp thịt băm", price: 5000 }]
              }
            ]
          }
        ]
      },
      {
        category: "Thức Uống",
        items: [
          {
            id: "item_3",
            name: "Trà Đào Cam Sả",
            price: 25000,
            description: "Mát lạnh giải nhiệt",
            options: [
              {
                title: "Mức đá",
                choices: [{ name: "100% Đá", price: 0 }, { name: "Ít đá", price: 0 }]
              }
            ]
          }
        ]
      }
    ]
  },
  order: {
    id: "ord_101",
    sessionId: "demo-lunch",
    userName: "Nguyễn Văn A",
    items: [
      {
        id: "item_1",
        name: "Cơm Tấm Sườn Nướng",
        price: 45000,
        quantity: 1,
        selectedOptions: [{ title: "Size", choice: "Lớn", price: 5000 }],
        itemTotal: 50000
      },
      {
        id: "item_3",
        name: "Trà Đào Cam Sả",
        price: 25000,
        quantity: 1,
        selectedOptions: [{ title: "Mức đá", choice: "Ít đá", price: 0 }],
        itemTotal: 25000
      }
    ],
    totalAmount: 75000,
    paymentStatus: "PAID",
    notes: "Cơm ít mỡ hành",
    createdAt: new Date()
  }
};

export async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lunch-order';
    await mongoose.connect(mongoURI);
    console.log(`🍃 MongoDB Connected: ${mongoURI}`);

    // Seed initial data if DB collections are empty
    const sessionCount = await Session.countDocuments();
    if (sessionCount === 0) {
      console.log('🌱 Seeding database from existing db.json or fallback demo data...');
      let dbJsonData = null;
      try {
        const jsonPath = path.join(__dirname, '../data/db.json');
        if (fs.existsSync(jsonPath)) {
          const raw = fs.readFileSync(jsonPath, 'utf-8');
          dbJsonData = JSON.parse(raw);
        }
      } catch (err) {
        console.warn('Could not read db.json for initial seed, using defaults.');
      }

      if (dbJsonData && dbJsonData.sessions && dbJsonData.sessions.length > 0) {
        await Session.insertMany(dbJsonData.sessions);
        if (dbJsonData.orders && dbJsonData.orders.length > 0) {
          await Order.insertMany(dbJsonData.orders);
        }
        if (dbJsonData.settings) {
          await Settings.create({ key: 'admin_settings', ...dbJsonData.settings });
        }
        console.log('✅ Successfully migrated existing db.json data to MongoDB!');
      } else {
        await Session.create(DEFAULT_DEMO_DATA.session);
        await Order.create(DEFAULT_DEMO_DATA.order);
        await Settings.create(DEFAULT_DEMO_DATA.settings);
        console.log('✅ Seeded default demo data into MongoDB!');
      }
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.warn('⚠️ Please ensure MONGODB_URI is configured correctly in .env file or MongoDB service is running.');
  }
}
