import { ConvexReactClient } from "convex/react";

/**
 * Blank until `npx convex dev` has been run and VITE_CONVEX_URL is set. When it
 * is blank the app runs local-only: matches play in memory and a refresh loses
 * them. This keeps the build and the app working before a deployment exists.
 */
const url = import.meta.env.VITE_CONVEX_URL as string | undefined;

export const convex = url ? new ConvexReactClient(url) : null;
export const convexConfigured = convex !== null;
