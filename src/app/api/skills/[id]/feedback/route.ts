import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Helper to find skill by ID or slug
async function findSkillByIdOrSlug(idOrSlug: string) {
  // Try to find by ID first (UUID format)
  const byId = await prisma.skill.findUnique({
    where: { id: idOrSlug },
  });
  if (byId) return byId;

  // Try to find by slug
  return prisma.skill.findFirst({
    where: { slug: idOrSlug },
  });
}

/**
 * @openapi
 * /skills/{id}/feedback:
 *   get:
 *     tags: [Feedback]
 *     summary: List skill feedback
 *     description: Get all feedback for a skill (publicly accessible)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID or slug
 *     responses:
 *       200:
 *         description: List of feedback
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
 *       404:
 *         description: Skill not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Feedback]
 *     summary: Submit feedback
 *     description: Submit rating and/or comment for a skill (requires authentication)
 *     security:
 *       - session: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID or slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               comment:
 *                 type: string
 *                 description: Text feedback
 *     responses:
 *       201:
 *         description: Feedback created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Rating or comment required, or invalid rating
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Skill not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skill = await findSkillByIdOrSlug(params.id);

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    const feedback = await prisma.skillFeedback.findMany({
      where: { skillId: skill.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// POST - Create new feedback
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    // Validate input
    if (!rating && !comment) {
      return NextResponse.json(
        { error: 'Rating or comment is required' },
        { status: 400 }
      );
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Find skill by ID or slug
    const skill = await findSkillByIdOrSlug(params.id);

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Create feedback
    const feedback = await prisma.skillFeedback.create({
      data: {
        skillId: skill.id,
        userId: session.user.id,
        rating: rating || null,
        comment: comment || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}
