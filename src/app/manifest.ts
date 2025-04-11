import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flux",
    short_name: "Flux",
    description:
      "FLUX is a Web3-based chat platform integrated with the Solana blockchain, enabling users to interact in real-time while leveraging the power of AI Agents to perform various blockchain operations and data analysis.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
