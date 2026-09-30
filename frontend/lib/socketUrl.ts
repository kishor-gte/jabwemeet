/**
 * Dynamic Socket.io URL resolver
 * Prioritizes NEXT_PUBLIC_SOCKET_URL environment variable, falls back to window.location.origin in production,
 * or http://localhost:5001 in local development.
 */
export const getSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5001";
    }
    return window.location.origin;
  }
  return "http://localhost:5001";
};
