/**
 * Re-exports Convex client for use in the application
 */
import { ConvexReactClient } from 'convex/react';

// Initialize Convex client
export const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || '');

// Export by default
export default convexClient; 