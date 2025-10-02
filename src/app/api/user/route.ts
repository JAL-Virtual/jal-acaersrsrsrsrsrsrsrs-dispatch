import { NextRequest, NextResponse } from 'next/server';
import { JALVirtualAPI } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authorization header required' 
        },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Initialize JAL Virtual API client
    const jalAPI = new JALVirtualAPI(apiKey);
    
    // Fetch user data
    const userData = await jalAPI.getUserInfo(apiKey);

    if (userData) {
      return NextResponse.json({
        success: true,
        user: userData,
        message: 'User data retrieved successfully'
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to retrieve user data' 
        },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    console.error('User API Error:', error);
    const err = error as { message?: string };
    
    return NextResponse.json(
      { 
        success: false, 
        message: err.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
