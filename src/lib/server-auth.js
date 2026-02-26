import jwt from 'jsonwebtoken';

/**
 * Extracts and verifies the authenticated user from the request
 * @param {Request} request 
 * @returns {Object|null} Decoded user token payload or null
 */
export async function getAuthUser(request) {
  try {
    let token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    // Also check cookies if header is missing
    if (!token && request.cookies) {
        token = request.cookies.get("token")?.value;
    }
    
    if (!token) return null;

    // Verify token — in production JWT_SECRET must be set via environment variable
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is not set');
      }
      // dev-only fallback (never use in production)
    }
    const decoded = jwt.verify(token, secret || 'dev-only-fallback-secret');
    return decoded;
  } catch (error) {
    return null;
  }
}
