import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

/**
 * @openapi
 * /docs:
 *   get:
 *     tags: [Documentation]
 *     summary: OpenAPI specification
 *     description: Returns the OpenAPI 3.0 specification for the SkillHub API
 *     responses:
 *       200:
 *         description: OpenAPI specification in JSON format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET() {
  return NextResponse.json(swaggerSpec);
}
