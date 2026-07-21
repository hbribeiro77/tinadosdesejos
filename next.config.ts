import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 é addon nativo: não pode ir no bundle webpack/turbopack do servidor.
  serverExternalPackages: ["better-sqlite3"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "better-sqlite3"];
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
