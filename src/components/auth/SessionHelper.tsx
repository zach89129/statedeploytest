"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * SessionHelper Component
 *
 * This component ensures that the NextAuth session is properly initialized
 * on the client side. This helps with environments where session handling
 * might be problematic.
 *
 * This component does not render any visible UI.
 */
export default function SessionHelper() {
  const { data: session, status, update } = useSession();

  // Force update session state when page loads
  useEffect(() => {
    const checkSession = async () => {
      console.log("SessionHelper: Initial session status:", status);

      // Force update of session
      if (status === "loading") {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay
        console.log("SessionHelper: Updating session state...");
        await update();
      }
    };

    checkSession();
  }, [status, update]);

  // Monitor session status changes
  useEffect(() => {
    console.log("SessionHelper: Current session status:", status);
    console.log("SessionHelper: Session data:", session);
  }, [session, status]);

  useEffect(() => {
    // Error handling for fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      try {
        const response = await originalFetch(...args);

        // Log auth-related responses
        if (typeof args[0] === "string" && args[0].includes("/api/auth")) {
          console.log(`Auth fetch: ${args[0]}, status: ${response.status}`);
        }

        return response;
      } catch (error) {
        console.error("Fetch error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    return () => {
      // Restore original fetch when component unmounts
      window.fetch = originalFetch;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
