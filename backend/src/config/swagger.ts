import swaggerJsdoc from 'swagger-jsdoc';
import config from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BibSaaS Premium API',
      version: '1.0.0',
      description: 'BibSaaS Premium - Plateforme SaaS de coiffure intelligente avec IA, paiements multi-devises et gestion multi-tenant.',
      contact: {
        name: 'BibSaaS Support',
        email: 'support@bibsaas.com',
      },
    },
    servers: [
      {
        url: config.API_URL,
        description: 'Development server',
      },
      {
        url: 'https://api.bibsaas.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'string',
              example: 'ERROR_CODE',
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
            },
            requestId: {
              type: 'string',
              example: 'req_123456',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
