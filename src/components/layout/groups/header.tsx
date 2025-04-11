"use client";
import { Button } from "@/components/ui/button";
import { LogIn, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import WalletConnect from "@/components/ui/WalletConnect";
// import { randomBytes } from "crypto";

type UserType = {
  id: string | null;
  name: string | null;
  image: string | null;
};

export default function Header() {
  const { publicKey } = useWallet();
  const address = publicKey?.toString();

  const [user, setUser] = useState<UserType | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isMember, setIsMember] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!address) return;

      try {
        const { data: users, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", address);

        if (error) throw error;
        setUser(users[0]);
      } catch (error) {
        toast("Error fetching users:", {
          description: String(error),
        });
      }
    };
    fetchUser();
  }, [address]);

  async function createGroup() {
    setLoading(true);
    try {
      // const groupIdToCrypto = randomBytes(10).toString("hex");
      if (!groupName) {
        toast.error("Please enter a group name.");
        return;
      }
      const { data: group, error: groupError } = await supabase
        .from("group_chat")
        .insert([{ name: groupName }])
        .select();

      if (groupError) throw groupError;

      const groupId = group[0]?.id;

      const { error: memberError } = await supabase
        .from("group_chat_members")
        .insert([{ group_chat_id: groupId, user_id: address }]);

      if (memberError) throw memberError;

      toast("Group created and user added successfully.");
    } catch (error) {
      toast.error("Error creating group:");
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  }

  async function joinGroup() {
    if (!address) {
      toast("Please connect your wallet to join the group");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("group_chat_members")
        .insert([{ group_chat_id: groupId, user_id: address }]);

      if (error) throw error;

      setIsMember(true);
      toast("Successfully joined the group!");
    } catch (error) {
      console.error("Error joining group:", error);
      toast("Failed to join group. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  const router = useRouter();
  useEffect(() => {
    if (isMember) {
      toast("You are already a member of this group.");
    }
  }, [isMember]);

  if (!address) {
    router.push("/account");
  }

  return (
    <header className="space-y-5 mb-5">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Chats</h1>
          {user && (
            <p className="text-muted-foreground">Welcome, {user.name}</p>
          )}
        </div>
        <WalletConnect />
      </div>
      <div className="space-x-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Group Chat</DialogTitle>
              <DialogDescription>
                This will create a new group chat with full control over
                personal data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="group-name" className="text-sm font-medium">
                Group Name
              </Label>
              <Input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="space-x-2 mt-4 flex justify-end">
              <Button variant="outline">Cancel</Button>
              <Button onClick={createGroup} disabled={loading || !groupName}>
                {loading ? "Loading" : "Create Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <LogIn />
              Join Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join a Group</DialogTitle>
              <DialogDescription>Enter the group ID to join.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="group-id" className="text-sm font-medium">
                Group ID
              </Label>
              <Input
                type="text"
                placeholder="Enter group ID"
                className="w-1/3"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              />
            </div>
            <div className="space-x-2 mt-4 flex justify-end">
              <Button variant="outline">Cancel</Button>
              <Button onClick={joinGroup} disabled={loading || !groupId}>
                {loading ? "Loading" : "Join Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
