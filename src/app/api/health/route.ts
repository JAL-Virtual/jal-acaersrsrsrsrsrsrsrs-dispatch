import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check external API connectivity
    const externalApiUrl = process.env.JAL_VIRTUAL_API_URL || 'https://jalvirtual.com/api/user';
    let externalApiStatus = 'unknown';
    let externalApiResponseTime = 0;
    
    try {
      const externalStartTime = Date.now();
      await axios.head(externalApiUrl, { timeout: 5000 });
      externalApiResponseTime = Date.now() - externalStartTime;
      externalApiStatus = 'healthy';
    } catch (error) {
      externalApiStatus = 'unhealthy';
    }
    
    const totalResponseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      services: {
        api: {
          status: 'healthy',
          responseTime: totalResponseTime
        },
        externalApi: {
          status: externalApiStatus,
          responseTime: externalApiResponseTime,
          url: externalApiUrl
        }
      },
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error: unknown) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
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
