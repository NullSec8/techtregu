const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TechTregu API',
      version: '1.0.0',
      description:
        'API documentation for the TechTregu marketplace platform. TechTregu is a marketplace for computer hardware where users can buy and sell tech products such as laptops, desktops, GPUs, CPUs, RAM, storage, monitors, and peripherals.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token in the Authorization header (format: Bearer <token>)',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'tt_token',
          description: 'JWT token stored in the tt_token cookie (set after login/register)',
        },
      },
      schemas: {
        Listing: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            category: {
              type: 'string',
              enum: ['laptop', 'desktop', 'gpu', 'cpu', 'ram', 'storage', 'monitor', 'peripheral', 'other'],
            },
            condition: {
              type: 'string',
              enum: ['new', 'used', 'refurbished'],
            },
            images: {
              type: 'array',
              items: { type: 'string' },
            },
            location: { type: 'string' },
            specs: { type: 'object' },
            isActive: { type: 'boolean' },
            isSold: { type: 'boolean' },
            sellerId: { type: 'integer' },
            sellerName: { type: 'string' },
            views: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            senderId: { type: 'integer' },
            receiverId: { type: 'integer' },
            listingId: { type: 'integer', nullable: true },
            content: { type: 'string' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { cookieAuth: [] },
    ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
