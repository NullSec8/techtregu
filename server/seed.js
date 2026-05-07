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
  {
    title: 'RTX 4090 — MSI Suprim Liquid',
    description: ' flagship GPU. Liquid cooling, excellent temps. Original packaging included.',
    price: 1450,
    category: 'gpu',
    condition: 'used',
    location: 'Prishtina, Kosovo',
    images: ['https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80'],
    specs: { VRAM: '24 GB GDDR6X', 'Boost Clock': '2520 MHz', TDP: '450 W' },
  },
  {
    title: 'RTX 4080 Super — Gigabyte AORUS',
    description: 'Upgraded from non-Super model. Great for 4K gaming.',
    price: 950,
    category: 'gpu',
    condition: 'used',
    location: 'Prizren, Kosovo',
    images: ['https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80'],
    specs: { VRAM: '16 GB GDDR6X', 'Boost Clock': '2505 MHz', TDP: '320 W' },
  },
  {
    title: 'Intel i7-14700K — 14th Gen',
    description: 'Latest gen i7. Perfect for gaming and productivity.',
    price: 340,
    category: 'cpu',
    condition: 'new',
    location: 'Mitrovica, Kosovo',
    images: ['https://images.unsplash.com/photo-1587825140708-dfaf288ae64b?w=800&q=80'],
    specs: { 'Cores/Threads': '20/28', 'Boost Clock': '5.6 GHz', TDP: '125 W' },
  },
  {
    title: 'AMD Ryzen 5 7600 — Non-X',
    description: 'Budget-friendly 7000 series. Great value for gamers.',
    price: 180,
    category: 'cpu',
    condition: 'new',
    location: 'Gjakova, Kosovo',
    images: ['https://images.unsplash.com/photo-1587825140708-dfaf288ae64b?w=800&q=80'],
    specs: { 'Cores/Threads': '6/12', 'Boost Clock': '5.1 GHz', TDP: '65 W' },
  },
  {
    title: 'Dell XPS 15 — 9530',
    description: 'i7-13700H, 32 GB RAM, RTX 4060, 1 TB SSD. Excellent condition.',
    price: 1350,
    category: 'laptop',
    condition: 'used',
    location: 'Prishtina, Kosovo',
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80'],
    specs: { CPU: 'i7-13700H', GPU: 'RTX 4060', RAM: '32 GB DDR5', Storage: '1 TB NVMe' },
  },
  {
    title: 'MacBook Pro 14" — M3 Pro',
    description: 'Apple M3 Pro, 18 GB RAM, 512 GB SSD. Space Black.',
    price: 1650,
    category: 'laptop',
    condition: 'new',
    location: 'Prizren, Kosovo',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
    specs: { CPU: 'M3 Pro', RAM: '18 GB Unified', Storage: '512 GB SSD', Display: '14.2" Liquid Retina XDR' },
  },
  {
    title: 'ASUS ROG Strix G16 — Gaming Laptop',
    description: 'i9-13980HX, RTX 4070, 16 GB DDR5, 1 TB SSD. 240 Hz display.',
    price: 1480,
    category: 'laptop',
    condition: 'used',
    location: 'Mitrovica, Kosovo',
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80'],
    specs: { CPU: 'i9-13980HX', GPU: 'RTX 4070', RAM: '16 GB DDR5', Display: '16" 240Hz' },
  },
  {
    title: 'Custom Build — Ryzen 7 7800X3D + RTX 4070',
    description: 'Gaming powerhouse. 7800X3D best for gaming, paired with RTX 4070.',
    price: 1450,
    category: 'desktop',
    condition: 'used',
    location: 'Prishtina, Kosovo',
    images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80'],
    specs: { CPU: 'Ryzen 7 7800X3D', GPU: 'RTX 4070 12GB', RAM: '32 GB DDR5', Storage: '2 TB NVMe' },
  },
  {
    title: 'Workstation Build — Threadripper',
    description: 'AMD Threadripper Pro 5975WX, 128 GB DDR4, RTX 4090. For professionals.',
    price: 4500,
    category: 'desktop',
    condition: 'used',
    location: 'Prizren, Kosovo',
    images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80'],
    specs: { CPU: 'Threadripper Pro 5975WX', GPU: 'RTX 4090', RAM: '128 GB DDR4', Storage: '4 TB NVMe' },
  },
  {
    title: 'WD Black SN850X 2 TB',
    description: 'Top-tier PCIe 4.0 NVMe. Loads games fast.',
    price: 150,
    category: 'storage',
    condition: 'new',
    location: 'Gjakova, Kosovo',
    images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80'],
    specs: { Interface: 'PCIe 4.0 x4', Read: '7300 MB/s', Write: '6600 MB/s' },
  },
  {
    title: 'Samsung 870 EVO 1 TB SATA',
    description: 'Reliable SATA SSD for old builds or secondary storage.',
    price: 65,
    category: 'storage',
    condition: 'new',
    location: 'Mitrovica, Kosovo',
    images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80'],
    specs: { Interface: 'SATA III', Read: '560 MB/s', Write: '530 MB/s' },
  },
  {
    title: 'Seagate Barracuda 4 TB HDD',
    description: '7200 RPM, good for mass storage. Bare drive.',
    price: 70,
    category: 'storage',
    condition: 'used',
    location: 'Prishtina, Kosovo',
    images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80'],
    specs: { Interface: 'SATA III', Capacity: '4 TB', RPM: '7200', Cache: '256 MB' },
  },
  {
    title: 'G.Skill Trident Z5 RGB DDR5 64 GB',
    description: 'Two 32 GB sticks at 6400 MHz. Fast and beautiful.',
    price: 220,
    category: 'ram',
    condition: 'used',
    location: 'Prizren, Kosovo',
    images: ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80'],
    specs: { Capacity: '2×32 GB', Speed: 'DDR5-6400', CL: '32-39-39' },
  },
  {
    title: 'Kingston Fury Beast DDR5 32 GB',
    description: 'Affordable DDR5. 5600 MHz. Perfect for budget builds.',
    price: 95,
    category: 'ram',
    condition: 'new',
    location: 'Mitrovica, Kosovo',
    images: ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80'],
    specs: { Capacity: '2×16 GB', Speed: 'DDR5-5600', CL: '40-40-40' },
  },
  {
    title: 'LG 27GP950-B 4K Gaming Monitor',
    description: '27" 4K 160Hz Nano IPS. HDMI 2.1. Excellent colors.',
    price: 450,
    category: 'monitor',
    condition: 'used',
    location: 'Gjakova, Kosovo',
    images: ['https://images.unsplash.com/photo-1527443224154-c351a0ad96ae?w=800&q=80'],
    specs: { Size: '27"', Resolution: '3840×2160', Refresh: '160 Hz', Panel: 'Nano IPS' },
  },
  {
    title: 'Samsung Odyssey G7 32"',
    description: '1440p 240Hz curved. Great for competitive gaming.',
    price: 550,
    category: 'monitor',
    condition: 'used',
    location: 'Prishtina, Kosovo',
    images: ['https://images.unsplash.com/photo-1527443224154-c351a0ad96ae?w=800&q=80'],
    specs: { Size: '32"', Resolution: '2560×1440', Refresh: '240 Hz', Curved: '1000R' },
  },
  {
    title: 'Dell U2723QE 27" 4K USB-C',
    description: 'Professional IPS Black. 98% DCI-P3. USB-C hub.',
    price: 500,
    category: 'monitor',
    condition: 'used',
    location: 'Prizren, Kosovo',
    images: ['https://images.unsplash.com/photo-1527443224154-c351a0ad96ae?w=800&q=80'],
    specs: { Size: '27"', Resolution: '3840×2160', Panel: 'IPS Black', 'USB-C': '90W' },
  },
  {
    title: 'Logitech G Pro X Wireless Headset',
    description: 'Blue VO!CE mic, 7.1 surround. Great audio quality.',
    price: 120,
    category: 'peripheral',
    condition: 'used',
    location: 'Mitrovica, Kosovo',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    specs: { Type: 'Headset', Connectivity: '2.4 GHz / 3.5mm', Battery: '20 hr', Surround: '7.1' },
  },
  {
    title: 'Keychron Q1 Pro — Mechanical',
    description: 'QMK, wireless, gasket mount. Hot-swappable. White LED.',
    price: 180,
    category: 'peripheral',
    condition: 'used',
    location: 'Gjakova, Kosovo',
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'],
    specs: { Layout: '75%', Switches: 'Hot-swappable', Connectivity: 'Bluetooth 5.1 / USB-C' },
  },
  {
    title: 'Logitech G305 Wireless Mouse',
    description: 'Lightweight, 12K sensor. Long battery life. Great for FPS.',
    price: 40,
    category: 'peripheral',
    condition: 'new',
    location: 'Prishtina, Kosovo',
    images: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80'],
    specs: { Sensor: 'HERO 12K', Weight: '99g', Battery: '250 hr', DPI: '12000' },
  },
  {
    title: 'Razer DeathAdder V3 Pro',
    description: 'Lightest DeathAdder yet. 30K sensor. Wireless.',
    price: 90,
    category: 'peripheral',
    condition: 'new',
    location: 'Prizren, Kosovo',
    images: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80'],
    specs: { Sensor: 'FOCUS 30K', Weight: '63g', Battery: '90 hr', Switches: 'Optical' },
  },
  {
    title: 'WD Elements 5 TB Portable',
    description: 'Simple, reliable backup drive. USB 3.0.',
    price: 110,
    category: 'storage',
    condition: 'new',
    location: 'Prishtina, Kosovo',
    images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80'],
    specs: { Interface: 'USB 3.0', Capacity: '5 TB', Size: '2.5"', Power: 'Bus powered' },
  },
  {
    title: 'Crucial P3 Plus 500 GB',
    description: 'Budget NVMe. Good for boot drive.',
    price: 40,
    category: 'storage',
    condition: 'new',
    location: 'Mitrovica, Kosovo',
    images: ['https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80'],
    specs: { Interface: 'PCIe 3.0', Read: '3500 MB/s', Write: '1900 MB/s' },
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

  const [[{ c }]] = await pool.query('SELECT COUNT(*) AS c FROM listings WHERE is_active = 1 AND seller_id = ?', [userId]);
  if (c > 0) {
    console.log(`Skip seed: ${c} active listing(s) already exist for this user.`);
    await pool.end();
    process.exit(0);
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

if (!process.env.VITEST) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { DEMO, LISTINGS, run };

