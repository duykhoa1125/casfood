import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

const INITIAL_DATA = {
  settings: {
    qrImage: "", // Custom uploaded Admin QR code image (base64 / URL)
    deepseekApiKey: ""
  },
  sessions: [
    {
      id: "demo-lunch",
      title: "Gom Đặt Cơm Trưa Hôm Nay",
      restaurantName: "Quán Cơm Tấm & Nước Giải Khát",
      status: "OPEN",
      createdAt: new Date().toISOString(),
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
    }
  ],
  orders: [
    {
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
      createdAt: new Date().toISOString()
    }
  ]
};

function ensureDbExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  }
}

export function readDb() {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading database file:", e);
    return INITIAL_DATA;
  }
}

export function writeDb(data) {
  ensureDbExists();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
