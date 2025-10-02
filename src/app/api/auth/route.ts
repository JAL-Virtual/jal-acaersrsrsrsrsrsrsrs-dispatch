import { NextRequest, NextResponse } from 'next/server';
import { JALVirtualAPI } from '@/lib/api';

// POST /api/auth - Authenticate user with pilot ID and API key
export async function POST(request: NextRequest) {
  try {
    const { pilotId, apiKey, externalApiUrl } = await request.json();

    if (!pilotId || !apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Pilot ID and API key are required' 
        },
        { status: 400 }
      );
    }

    // Use the JALVirtualAPI to authenticate
    const jalAPI = new JALVirtualAPI(apiKey, externalApiUrl);
    const authResult = await jalAPI.authenticate();

    if (authResult.success && authResult.user) {
      // Generate a simple token (in production, use JWT or similar)
      const token = Buffer.from(`${pilotId}:${apiKey}`).toString('base64');
      
      return NextResponse.json({
        success: true,
        user: authResult.user,
        token: token,
        message: `Welcome back, ${authResult.user.name}!`
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: authResult.message || 'Authentication failed' 
        },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    console.error('Auth API error:', error);
    const err = error as { message?: string };
    
    return NextResponse.json(
      { 
        success: false, 
        message: err.message || 'Authentication error occurred' 
      },
      { status: 500 }
    );
  }
}
