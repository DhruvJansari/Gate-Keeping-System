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

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-me');
    return decoded;
  } catch (error) {
    return null;
  }
}
