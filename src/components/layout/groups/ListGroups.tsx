"use client";
import { supabase } from "@/config/supabase";
import { useWallet } from "@solana/wallet-adapter-react";
import { Users } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  members: Member[];
}

export default function ListGroups() {
  const { publicKey } = useWallet();
  const user = publicKey?.toString();

  const [groups, setGroups] = useState<Group[]>([]);

  const fetchUserGroups = useCallback(async () => {
    if (!user) return;

    try {
      const { data: memberData, error: memberError } = await supabase
        .from("group_chat_members")
        .select("group_chat_id")
        .eq("user_id", user);

      if (memberError) throw memberError;

      const groupIds = memberData.map((member) => member.group_chat_id);

      const { data: groupData, error: groupError } = await supabase
        .from("group_chat")
        .select("*")
        .in("id", groupIds);

      if (groupError) throw groupError;

      const groupsWithMembers = await Promise.all(
        groupData.map(async (group) => {
          const { data: members, error: membersError } = await supabase
            .from("group_chat_members")
            .select("user_id")
            .eq("group_chat_id", group.id);

          if (membersError) throw membersError;

          const userIds = members.map((member) => member.user_id);

          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("name, id")
            .in("id", userIds);

          if (usersError) throw usersError;

          return { ...group, members: usersData };
        })
      );

      setGroups(groupsWithMembers);
    } catch (error) {
      toast("Error fetching user groups", {
        description: String(error),
      });
    }
  }, [user]);

  useEffect(() => {
    fetchUserGroups();

    const interval = setInterval(() => {
      fetchUserGroups();
    }, 1000); // Fetch every second

    return () => clearInterval(interval);
  }, [fetchUserGroups]);

  return (
    <section>
      {groups.map((group) => (
        <Link href={`/chats/${group.id}`} key={group.id}>
          <div className="flex items-center justify-between p-3 border-b hover:bg-secondary duration-300 ease-in-out cursor-pointer">
            <div className="flex items-center space-x-3">
              <Users />
              <div>
                <h3 className="text-lg font-semibold capitalize">
                  {group.name}
                </h3>
                <p className="text-xs">
                  {group.members.map((member) => member.name).join(", ")}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}
