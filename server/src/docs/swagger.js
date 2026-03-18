import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Course Architect API",
      version: "1.0.0",
      description: "API for AI-powered course generation",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    "./src/modules/**/*.js",
    "./src/docs/*.js",
  ],
  basePath: "/api",
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;