import { NextRequest, NextResponse } from 'next/server';
import { JALVirtualAPI } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pilotId, apiKey } = body;

    // Validate input
    if (!pilotId || !apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Pilot ID and API key are required' 
        },
        { status: 400 }
      );
    }

    // Initialize JAL Virtual API client
    const jalAPI = new JALVirtualAPI(apiKey);
    
    // Attempt authentication
    const authResponse = await jalAPI.authenticate();

    if (authResponse.success && authResponse.user && authResponse.token) {
      // Verify pilot ID matches
      if (authResponse.user.id !== pilotId && authResponse.user.callsign !== pilotId) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Pilot ID does not match your account' 
          },
          { status: 401 }
        );
      }

      // Return successful authentication
      return NextResponse.json({
        success: true,
        user: authResponse.user,
        token: authResponse.token,
        message: `Welcome back, ${authResponse.user.name}!`
      });
    } else {
      // Return authentication failure
      return NextResponse.json(
        { 
          success: false, 
          message: authResponse.message || 'Authentication failed' 
        },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    console.error('API Auth Error:', error);
    
    const err = error as { message?: string };
    
    // Handle specific error types
    if (err.message?.includes('timeout')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Connection timeout. Please check your internet connection.' 
        },
        { status: 408 }
      );
    } else if (err.message?.includes('Network Error') || err.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unable to connect to JAL Virtual servers. Please check your internet connection or VPN settings.' 
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error. Please try again.' 
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
