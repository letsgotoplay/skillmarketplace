import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SkillHub API',
      version: '1.0.0',
      description:
        'Enterprise Skill Marketplace API - Discover, validate, and deploy AI agent skills with confidence. ' +
        'Features include security scanning, automated evaluation, team collaboration, and comprehensive analytics.',
      contact: {
        name: 'SkillHub Team',
        email: 'support@skillhub.example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        session: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description: 'NextAuth.js session cookie for authentication',
        },
      },
      schemas: {
        // Skill Schemas
        Skill: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'pdf-processing' },
            slug: { type: 'string', example: 'pdf-processing' },
            description: { type: 'string', example: 'Extract text and tables from PDF files' },
            category: {
              type: 'string',
              enum: ['DEVELOPMENT', 'SECURITY', 'DATA', 'AIML', 'TESTING', 'INTEGRATION'],
            },
            tags: { type: 'array', items: { type: 'string' }, example: ['pdf', 'document'] },
            visibility: {
              type: 'string',
              enum: ['PUBLIC', 'TEAM_ONLY', 'PRIVATE'],
            },
            author: { $ref: '#/components/schemas/User' },
            team: { $ref: '#/components/schemas/Team' },
            stats: { $ref: '#/components/schemas/SkillStats' },
            versions: {
              type: 'array',
              items: { $ref: '#/components/schemas/SkillVersion' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SkillVersion: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            version: { type: 'string', example: '1.0.0' },
            changelog: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            specValidationPassed: { type: 'boolean' },
            processingComplete: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SkillStats: {
          type: 'object',
          properties: {
            downloadsCount: { type: 'integer', example: 150 },
            viewsCount: { type: 'integer', example: 500 },
            lastViewedAt: { type: 'string', format: 'date-time' },
            lastDownloadedAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
          },
        },
        Team: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Engineering' },
            slug: { type: 'string', example: 'engineering' },
          },
        },
        // Security Schemas
        SecurityStatus: {
          type: 'object',
          properties: {
            skillId: { type: 'string', format: 'uuid' },
            version: { type: 'string' },
            processingComplete: { type: 'boolean' },
            specification: {
              type: 'object',
              properties: {
                passed: { type: 'boolean' },
                errors: { type: 'array', items: { type: 'string' } },
              },
            },
            patternScan: {
              type: 'object',
              properties: {
                score: { type: 'integer', minimum: 0, maximum: 100 },
                status: { type: 'string' },
                completedAt: { type: 'string', format: 'date-time' },
              },
            },
            aiAnalysis: {
              type: 'object',
              properties: {
                riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical', 'unknown'] },
                threats: { type: 'array', items: { $ref: '#/components/schemas/Threat' } },
                recommendations: { type: 'array', items: { type: 'string' } },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
            },
            warning: {
              type: 'object',
              properties: {
                shouldWarn: { type: 'boolean' },
                reasons: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        Threat: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            description: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            file: { type: 'string' },
            remediation: { type: 'string' },
          },
        },
        // Evaluation Schemas
        EvaluationResult: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'] },
            skillVersionId: { type: 'string', format: 'uuid' },
            results: {
              type: 'array',
              items: { $ref: '#/components/schemas/TestCaseResult' },
            },
            summary: { $ref: '#/components/schemas/EvaluationSummary' },
            createdAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
          },
        },
        TestCaseResult: {
          type: 'object',
          properties: {
            testCase: { type: 'string' },
            passed: { type: 'boolean' },
            output: { type: 'string' },
            error: { type: 'string' },
            executionTime: { type: 'integer', description: 'Execution time in ms' },
          },
        },
        EvaluationSummary: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            passed: { type: 'integer' },
            failed: { type: 'integer' },
            passRate: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
        // Feedback Schema
        Feedback: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            skillId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Statistics Schemas
        OverviewStats: {
          type: 'object',
          properties: {
            totalSkills: { type: 'integer' },
            totalDownloads: { type: 'integer' },
            totalViews: { type: 'integer' },
            skillsByCategory: { type: 'object', additionalProperties: { type: 'integer' } },
            recentUploads: { type: 'integer' },
            avgSecurityScore: { type: 'number' },
          },
        },
        // Error Schema
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Resource not found' },
          },
        },
      },
    },
    tags: [
      { name: 'Skills', description: 'Skill management endpoints' },
      { name: 'Security', description: 'Security scanning and analysis' },
      { name: 'Evaluations', description: 'Skill evaluation and testing' },
      { name: 'Statistics', description: 'Analytics and statistics' },
      { name: 'Teams', description: 'Team management and activity' },
      { name: 'Feedback', description: 'Skill feedback and ratings' },
    ],
  },
  apis: ['./src/app/api/**/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
