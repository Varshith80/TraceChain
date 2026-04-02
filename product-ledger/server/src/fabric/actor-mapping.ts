/**
 * Actor Mapping Utility
 * 
 * Architecture: Maps centralized user authentication (PostgreSQL) to blockchain actor IDs (Fabric MSP)
 * 
 * In production, this would:
 * 1. Look up user's blockchain identity from database
 * 2. Use Fabric MSP identity for blockchain operations
 * 3. Maintain mapping between user IDs and actor IDs
 */

import { logger } from '../utils/logger.js';
import { getUserById } from '../database/users.js';

/**
 * Get blockchain actor ID for a user
 * 
 * Architecture: User authentication is centralized, but blockchain operations need actor IDs
 * This function maps user ID to blockchain actor ID
 * 
 * TODO: In production, implement proper mapping:
 * - Store blockchain identity in user profile
 * - Use Fabric MSP identity
 * - Handle identity enrollment
 */
export async function getUserActorID(userID: string): Promise<string> {
  try {
    const user = await getUserById(userID);
    if (!user) {
      throw new Error('User not found');
    }

    // For now, use user ID as actor ID
    // TODO: Implement proper blockchain identity mapping
    // In production, this would:
    // 1. Check if user has enrolled blockchain identity
    // 2. Return their Fabric MSP identity
    // 3. Handle identity enrollment if needed
    
    // Temporary: Use user ID prefixed with role for blockchain identity
    // This is NOT production-ready - needs proper Fabric identity management
    const actorID = `${user.role}-${userID}`;
    
    logger.debug(`Mapped user ${userID} to actor ${actorID}`);
    return actorID;
  } catch (error) {
    logger.error('Error getting user actor ID:', error);
    // Fallback to user ID if mapping fails
    return userID;
  }
}

