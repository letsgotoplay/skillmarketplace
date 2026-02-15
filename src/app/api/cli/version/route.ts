import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/api-auth';

// GET /api/cli/version - CLI version check and marketplace info
// This endpoint validates the token and returns marketplace info
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', authenticated: false },
        { status: 401 }
      );
    }

    // Return marketplace info and user details
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        scopes: user.scopes,
      },
      marketplace: {
        name: 'SkillHub',
        version: '1.0.0',
        minCliVersion: '1.0.0',
      },
    });
  } catch (error) {
    console.error('Error in CLI version check:', error);
    return NextResponse.json(
      { error: 'Internal server error', authenticated: false },
      { status: 500 }
    );
  }
}
