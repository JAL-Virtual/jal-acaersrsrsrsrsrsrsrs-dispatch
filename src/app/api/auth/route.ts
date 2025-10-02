import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API Configuration
const API_CONFIG = {
  baseUrl: process.env.EXTERNAL_API_URL || 'https://jalvirtual.com/api/user',
  timeout: parseInt(process.env.EXTERNAL_API_TIMEOUT || '10000'),
  retryAttempts: parseInt(process.env.EXTERNAL_API_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.EXTERNAL_API_RETRY_DELAY || '1000'),
};

// Retry utility function
const retryRequest = async <T>(requestFn: () => Promise<T>, attempts: number = API_CONFIG.retryAttempts): Promise<T> => {
  try {
    return await requestFn();
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (attempts > 1 && (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED')) {
      console.log(`Retrying API request, ${attempts - 1} attempts remaining...`);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
      return retryRequest(requestFn, attempts - 1);
    }
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pilotId, apiKey, externalApiUrl } = body;

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

    // Use custom API URL if provided, otherwise use default
    const apiUrl = externalApiUrl || API_CONFIG.baseUrl;

    try {
      // Make request to external API
      const response = await retryRequest(() => 
        axios.get(apiUrl, {
          timeout: API_CONFIG.timeout,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            // Alternative header formats that some APIs might use
            'X-API-Key': apiKey,
            'X-Pilot-ID': pilotId,
          }
        })
      );

      const userData = response.data;
      
      // Transform external API response to our User format
      const transformedUser = {
        id: userData.id || userData.pilot_id || userData.user_id || pilotId,
        name: userData.name || userData.pilot_name || userData.full_name || 'Pilot',
        email: userData.email || userData.email_address || '',
        callsign: userData.callsign || userData.aircraft_callsign || userData.flight_callsign || pilotId,
        hoppieId: userData.hoppie_id || userData.hoppie_logon || '',
        role: userData.role || userData.user_type || 'pilot'
      };

      // Verify pilot ID matches
      if (transformedUser.id !== pilotId && transformedUser.callsign !== pilotId) {
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
        user: transformedUser,
        token: apiKey,
        message: `Welcome back, ${transformedUser.name}!`,
        externalApiUrl: apiUrl
      });

    } catch (error: unknown) {
      console.error('External API authentication error:', error);
      const err = error as { 
        code?: string; 
        response?: { 
          status?: number; 
          data?: { message?: string; error?: string } 
        }; 
        message?: string 
      };
      
      // Enhanced error handling for external API
      if (err.code === 'ECONNABORTED') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Connection timeout. Please check your internet connection.' 
          },
          { status: 408 }
        );
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Unable to connect to external API servers. Please check your internet connection or API URL.' 
          },
          { status: 503 }
        );
      } else if (err.response?.status === 401) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid API key. Please check your credentials.' 
          },
          { status: 401 }
        );
      } else if (err.response?.status === 403) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Access denied. Please contact API support.' 
          },
          { status: 403 }
        );
      } else if (err.response?.status && err.response.status >= 500) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'External API servers are temporarily unavailable. Please try again later.' 
          },
          { status: 502 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: err.response?.data?.message || err.response?.data?.error || err.message || 'Authentication failed. Please check your connection and try again.' 
        },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('API Auth Error:', error);
    
    const err = error as { message?: string };
    
    return NextResponse.json(
      { 
        success: false, 
        message: err.message || 'Internal server error. Please try again.' 
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
