import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure public/index.html is bundled into the serverless Lambda
  // so the route handler can read it via fs.readFileSync on Vercel.
  // (Vercel serves public/ via CDN separately from the Lambda environment.)
  outputFileTracingIncludes: {
    "/": ["./public/index.html"],
  },
};

export default nextConfig;
