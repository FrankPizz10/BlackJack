// swaggerConfig.ts
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description:
        'API documentation for BlackJackNow. Available only in development.',
    },
  },
  apis: ['./src/routes/*.ts'], // Adjust the path to match where your API endpoints are defined
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

export default swaggerDocs;

