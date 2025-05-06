/**
 * Re-exports Convex client for use in the application
 */
import { ConvexReactClient } from 'convex/react';

// Initialize Convex client
export const convexClient = new ConvexReactClient(process.env.CONVEX_URL || '');

// Export by default
export default convexClient; 