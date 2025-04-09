import { Notifications } from "@/components/Notifications";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-sm mx-auto p-5">
      <Notifications />
      <div>
        <h1 className="text-5xl font-bold">FLUX</h1>
        <h2 className="max-w-sm text-muted-foreground">
          Decentralized Group Chat with{" "}
          <strong>Prediction Markets and AI Agents</strong> for Transaction.
        </h2>
      </div>
      <Link href={"/account"}>
        <Button className="mt-5" size={"lg"}>
          Start Group Chat
        </Button>
      </Link>
    </main>
  );
}
