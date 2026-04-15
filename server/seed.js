/**
 * Seed demo user + listings (MySQL). Run:
 *   npm run seed --prefix server
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { ensureDatabase } = require('./database/bootstrap');

const DEMO = {
  username: 'techtregu_demo',
  email: 'demo@techtregu.com',
  password: 'DemoPass123',
  firstName: 'Demo',
  lastName: 'Seller',
  location: 'Prishtina, Kosovo',
};

const LISTINGS = [
  {
    title: 'RTX 4070 Ti — Asus TUF',
    description:
      'Barely used for 4 months. Excellent cooling, runs quiet under load. Original box and accessories. No mining.',
    price: 580,
    category: 'gpu',
    condition: 'used',
    location: 'Prishtina, Kosovo',
    images: [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
    ],
    specs: { VRAM: '12 GB GDDR6X', 'Boost Clock': '2610 MHz', TDP: '285 W', Condition: 'Like New' },
  },
  {
    title: 'Ryzen 9 7900X — Unlocked',
    description:
      'Great multi-core performance. Sold with original packaging. Pristine condition.',
    price: 320,
    category: 'cpu',
    condition: 'used',
    location: 'Prizren, Kosovo',
    images: ['https://images.unsplash.com/photo-1587825140708-dfaf288ae64b?w=800&q=80'],
    specs: { 'Cores/Threads': '12/24', 'Boost Clock': '5.6 GHz', TDP: '170 W' },
  },
  {
    title: 'Custom Gaming PC — Full Build',
    description:
      'RTX 3080, i9-12900K, 32 GB DDR5, 1 TB NVMe. Fully assembled and tested.',
    price: 1250,
    category: 'desktop',
    condition: 'refurbished',
    location: 'Mitrovica, Kosovo',
    images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80'],
    specs: {
      CPU: 'Intel i9-12900K',
      GPU: 'RTX 3080 10GB',
      RAM: '32 GB DDR5',
      Storage: '1 TB NVMe SSD',
    },
  },
  {
    title: 'Samsung 990 Pro 1 TB NVMe',
    description:
      'PCIe 4.0 M.2 drive. 6 months old, freshly formatted and ready to install.',
    price: 85,
    category: 'storage',
    condition: 'used',
    location: 'Prishtina, Kosovo',
    images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80'],
    specs: { Interface: 'PCIe 4.0 x4', Read: '7450 MB/s', Write: '6900 MB/s' },
  },
  {
    title: 'Corsair Vengeance DDR5 32 GB',
    description: 'Two 16 GB sticks at 5600 MHz. Upgrading to 64 GB kit.',
    price: 110,
    category: 'ram',
    condition: 'used',
    location: 'Gjakova, Kosovo',
    images: ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80'],
    specs: { Capacity: '2×16 GB', Speed: 'DDR5-5600', Voltage: '1.25V' },
  },
];

async function run() {
  await ensureDatabase();

  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'techtregu',
  };

  const pool = mysql.createPool(config);
  const { initSchema } = require('./database/initSchema');
  await initSchema();

  const [[{ c }]] = await pool.query('SELECT COUNT(*) AS c FROM listings WHERE is_active = 1');
  if (c > 0) {
    console.log(`Skip seed: ${c} active listing(s) already exist.`);
    await pool.end();
    process.exit(0);
  }

  const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [DEMO.email]);
  let userId;
  if (users.length) {
    userId = users[0].id;
    console.log('Using existing user:', DEMO.email);
  } else {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(DEMO.password, salt);
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, location)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [DEMO.username, DEMO.email, hash, DEMO.firstName, DEMO.lastName, DEMO.location]
    );
    userId = result.insertId;
    console.log('Created demo user:', DEMO.email, '/', DEMO.password);
  }

  for (const item of LISTINGS) {
    await pool.query(
      `INSERT INTO listings (title, description, price, category, \`condition\`, images, location, seller_id, specs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.title,
        item.description,
        item.price,
        item.category,
        item.condition,
        JSON.stringify(item.images),
        item.location,
        userId,
        JSON.stringify(item.specs),
      ]
    );
    console.log('Listed:', item.title);
  }

  console.log('Seed complete.');
  await pool.end();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
