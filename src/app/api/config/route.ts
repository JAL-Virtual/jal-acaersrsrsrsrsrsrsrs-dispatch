import { NextRequest, NextResponse } from 'next/server';

// API Configuration
const API_CONFIG = {
  // External API endpoints - can be configured via environment variables
  JAL_VIRTUAL_API_URL: process.env.JAL_VIRTUAL_API_URL || 'https://jalvirtual.com/api/user',
  HOPPIE_API_URL: process.env.HOPPIE_API_URL || 'http://www.hoppie.nl/acars/system/connect.html',
  
  // API settings
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '10000'),
  RETRY_ATTEMPTS: parseInt(process.env.API_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.API_RETRY_DELAY || '1000'),
  
  // CORS settings
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  
  // Feature flags
  FEATURES: {
    ACARS_ENABLED: process.env.ACARS_ENABLED !== 'false',
    ROPS_ENABLED: process.env.ROPS_ENABLED !== 'false',
    MESSAGING_ENABLED: process.env.MESSAGING_ENABLED !== 'false',
  }
};

export async function GET(request: NextRequest) {
  try {
    // Return public configuration (no sensitive data)
    return NextResponse.json({
      success: true,
      config: {
        apiUrl: API_CONFIG.JAL_VIRTUAL_API_URL,
        hoppieUrl: API_CONFIG.HOPPIE_API_URL,
        timeout: API_CONFIG.TIMEOUT,
        features: API_CONFIG.FEATURES,
        version: process.env.npm_package_version || '1.0.0'
      }
    });
  } catch (error: unknown) {
    console.error('Config API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve configuration' 
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
