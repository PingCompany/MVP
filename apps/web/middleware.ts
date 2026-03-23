import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: [
      "/",
      "/manifesto",
      "/pricing",
      "/privacy",
      "/terms",
      "/callback",
      "/sign-in",
      "/sign-out",
      "/api/webhooks(.*)",
      "/invite/(.*)",
    ],
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
