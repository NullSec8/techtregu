/**
 * Seed demo user + listings. Run when MongoDB is available:
 *   npm run seed --prefix server
 * Skips if there are already active listings.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Listing = require('./models/Listing');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/techtregu';

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
    specs: {
      VRAM: '12 GB GDDR6X',
      'Boost Clock': '2610 MHz',
      TDP: '285 W',
      Condition: 'Like New',
    },
  },
  {
    title: 'Ryzen 9 7900X — Unlocked',
    description:
      'Great multi-core performance. Sold with original packaging. Pristine condition.',
    price: 320,
    category: 'cpu',
    condition: 'used',
    location: 'Prizren, Kosovo',
    images: [
      'https://images.unsplash.com/photo-1587825140708-dfaf288ae64b?w=800&q=80',
    ],
    specs: {
      'Cores/Threads': '12/24',
      'Boost Clock': '5.6 GHz',
      TDP: '170 W',
    },
  },
  {
    title: 'Custom Gaming PC — Full Build',
    description:
      'RTX 3080, i9-12900K, 32 GB DDR5, 1 TB NVMe. Fully assembled and tested.',
    price: 1250,
    category: 'desktop',
    condition: 'refurbished',
    location: 'Mitrovica, Kosovo',
    images: [
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80',
    ],
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
    images: [
      'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80',
    ],
    specs: {
      Interface: 'PCIe 4.0 x4',
      Read: '7450 MB/s',
      Write: '6900 MB/s',
    },
  },
  {
    title: 'Corsair Vengeance DDR5 32 GB',
    description: 'Two 16 GB sticks at 5600 MHz. Upgrading to 64 GB kit.',
    price: 110,
    category: 'ram',
    condition: 'used',
    location: 'Gjakova, Kosovo',
    images: [
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
    ],
    specs: {
      Capacity: '2×16 GB',
      Speed: 'DDR5-5600',
      Voltage: '1.25V',
    },
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected for seed');

  const existing = await Listing.countDocuments({ isActive: true });
  if (existing > 0) {
    console.log(`Skip seed: ${existing} active listing(s) already exist.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  let user = await User.findOne({ email: DEMO.email });
  if (!user) {
    const salt = await bcrypt.genSalt(10);
    user = new User({
      ...DEMO,
      password: await bcrypt.hash(DEMO.password, salt),
    });
    await user.save();
    console.log('Created demo user:', DEMO.email, '/', DEMO.password);
  } else {
    console.log('Using existing user:', DEMO.email);
  }

  for (const item of LISTINGS) {
    const listing = new Listing({
      ...item,
      seller: user._id,
      specs: item.specs || {},
    });
    await listing.save();
    console.log('Listed:', listing.title);
  }

  console.log('Seed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
