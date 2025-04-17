import BettingExample from "@/components/ExampleBetting";
import WalletConnect from "@/components/ui/WalletConnect";
import React from "react";

export default function page() {
  return (
    <div>
      <WalletConnect />
      <BettingExample />
    </div>
  );
}
