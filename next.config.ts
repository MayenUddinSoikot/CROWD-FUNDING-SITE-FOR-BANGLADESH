import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* Hosts whose photos we are allowed to resize. Shohay's own storage
       bucket, and the stock host used for placeholder hero slides.
       Anything else is served as-is rather than optimised. */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "coeqraamujuixtervqgb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    /* The widths a phone, tablet and laptop actually ask for. */
    deviceSizes: [360, 414, 640, 828, 1080, 1440, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
