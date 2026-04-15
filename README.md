# TechTregu - Tech Marketplace

A full-stack marketplace for buying and selling computer hardware and tech devices, similar to MerrJep.com but focused on technology products.

## Features

### Core Features
- **User Authentication**: Register, login, logout with JWT
- **Product Listings**: Create, view, and manage tech product listings
- **Categories**: Laptops, Desktops, GPUs, CPUs, RAM, Storage, Monitors, Peripherals
- **Search & Filters**: Search by keywords, filter by category, price, condition
- **Product Details**: Detailed product pages with specifications
- **Messaging System**: Real-time messaging between buyers and sellers
- **User Profiles**: View seller profiles and their listings

### Technical Features
- **Responsive Design**: Mobile-friendly UI
- **Real-time Chat**: Socket.io for instant messaging
- **Image Upload**: Support for product images
- **Pagination**: Efficient loading of listings
- **Form Validation**: Frontend and backend validation

## Tech Stack

### Frontend
- **React 18** with Hooks
- **React Router** for navigation
- **Axios** for API calls
- **CSS** for styling
- **Socket.io-client** for real-time messaging

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Socket.io** for real-time features
- **Multer** for file uploads
- **Cloudinary** for image storage

## Project Structure

```
techtregu/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main React app
│   │   ├── App.css        # Styles
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend
│   ├── models/            # MongoDB models
│   │   ├── User.js
│   │   ├── Listing.js
│   │   └── Message.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── listings.js
│   │   └── messages.js
│   ├── middleware/
│   │   └── auth.js
│   ├── index.js           # Server entry point
│   ├── package.json
│   └── .env               # Environment variables
└── package.json           # Root package.json
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd techtregu
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   - Update `server/.env` with your values:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost/techtregu
   JWT_SECRET=your_super_secret_jwt_key_here
   CLIENT_URL=http://localhost:5173

   # Optional: For image uploads
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Start MongoDB**
   - Make sure MongoDB is running locally, or update MONGODB_URI for MongoDB Atlas

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the React frontend (port 5173) and Node.js backend (port 5000) concurrently.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile` - Update profile (protected)
- `GET /api/users/:id/listings` - Get user's listings

### Listings
- `GET /api/listings` - Get all listings (with filters)
- `GET /api/listings/:id` - Get single listing
- `POST /api/listings` - Create listing (protected)
- `PUT /api/listings/:id` - Update listing (protected)
- `DELETE /api/listings/:id` - Delete listing (protected)

### Messages
- `GET /api/messages` - Get user's messages (protected)
- `GET /api/messages/conversation/:userId` - Get conversation (protected)
- `POST /api/messages` - Send message (protected)
- `PUT /api/messages/:id/read` - Mark as read (protected)

## Usage

1. **Register/Login**: Create an account or login
2. **Browse Listings**: View products on the homepage
3. **Search/Filter**: Use search bar and category filters
4. **View Details**: Click on products to see full details
5. **Contact Sellers**: Use the messaging system to contact sellers
6. **Create Listings**: Post your own products for sale

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] Admin panel for managing users and listings
- [ ] Favorites/wishlist functionality
- [ ] Advanced sorting and filtering
- [ ] Email notifications
- [ ] Payment integration
- [ ] Review and rating system
- [ ] Dark mode toggle
- [ ] Mobile app version
