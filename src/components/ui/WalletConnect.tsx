"use client";
import React from "react";
import dynamic from "next/dynamic";

export default function WalletConnect() {
  const WalletMultiButtonDynamic = dynamic(
    async () =>
      (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
    { ssr: false }
  );

  return <WalletMultiButtonDynamic />;
}
