"use client";
import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/config/supabase";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ButtonBack from "@/components/ButtonBack";
import WalletConnect from "@/components/ui/WalletConnect";
export default function Page() {
  const { publicKey } = useWallet();
  const user = publicKey?.toString();

  const [idUser, setIdUser] = useState<string[] | null>(null);
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: users, error } = await supabase
          .from("users")
          .select("id");
        if (error) throw error;
        const usersMap = users?.map((data) => data.id);
        setIdUser(usersMap);
      } catch (error) {
        toast("Error fetching users:", {
          description: String(error),
        });
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && idUser?.includes(user)) {
      redirect("/chats");
    }
  }, [user, idUser]);

  const usersValue = {
    id: user,
    name: name,
    image: "",
  };

  const sendUserData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .insert([usersValue])
      .select();

    if (error) {
      setLoading(false);
      toast("Error Creating User", {
        description: String(error),
      });
    } else {
      setLoading(false);
      toast("Success Creating User", {
        description: String(data?.[0]),
      });
      redirect("/chats");
    }
  };
  console.log(idUser);
  return (
    <main className="space-y-5 max-w-sm mx-auto p-5">
      <ButtonBack />
      {!publicKey && (
        <div className="flex flex-col space-y-3">
          <h1 className="text-muted-foreground">
            Please connect your wallet first.
          </h1>
          <WalletConnect />
        </div>
      )}
      {publicKey && idUser && !idUser.includes(String(user)) && (
        <>
          <section>
            <WalletConnect />
            <h1 className="text-2xl font-semibold mt-2">
              Let us know more about you
            </h1>
            <p className="text-sm text-muted-foreground">
              You have full control over access to personal data.
            </p>
          </section>
          <section className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                type="text"
                placeholder={`${user?.slice(0, 10)}...${user?.slice(-5)}`}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button onClick={sendUserData} disabled={!name || loading}>
              {loading ? "Loading" : "Save"}
            </Button>
          </section>
        </>
      )}
    </main>
  );
}
