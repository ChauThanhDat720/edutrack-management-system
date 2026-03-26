const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'School Management API',
            version: '1.0.0',
            description: 'API documentation for School Management System Backend'
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Local development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [
            {
                // This applies bearerAuth to all endpoints globally
                // but can be overridden at the route level if needed.
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js'], // Scan all route files for swagger annotations
};

const specs = swaggerJsDoc(options);

module.exports = specs;
