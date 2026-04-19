#!/bin/bash
# Setup script for TechTregu - Run with: bash setup.sh

echo "Creating MySQL user and database..."
mysql -u root -p'Black' <<EOF
CREATE DATABASE IF NOT EXISTS techtregu;
CREATE USER IF NOT EXISTS 'techtregu'@'localhost' IDENTIFIED BY 'techtregu_dev';
GRANT ALL PRIVILEGES ON techtregu.* TO 'techtregu'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "Updating .env file..."
cd /home/black/Desktop/techtregu/server
sed -i 's/MYSQL_USER=root/MYSQL_USER=techtregu/' .env
sed -i 's/MYSQL_PASSWORD=$/MYSQL_PASSWORD=techtregu_dev/' .env

echo "Seeding database..."
cd /home/black/Desktop/techtregu
node server/seed.js

echo "Starting the app..."
npm run dev