"use client";
import ButtonBack from "@/components/ButtonBack";
import ChatGroup from "@/components/layout/groups/chat";
import { Users } from "lucide-react";
import React, { use, useEffect, useState } from "react";
import { supabase } from "@/config/supabase";

interface Group {
  name: string;
  memberCount: number;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const { data: groupData, error: groupError } = await supabase
          .from("group_chat")
          .select("name")
          .eq("id", groupId)
          .single();

        if (groupError) throw groupError;

        const { data: memberData, error: memberError } = await supabase
          .from("group_chat_members")
          .select("user_id", { count: "exact" })
          .eq("group_chat_id", groupId);

        if (memberError) throw memberError;

        setGroup({
          name: groupData.name,
          memberCount: memberData.length,
        });
      } catch (error) {
        console.error("Error fetching group details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  if (loading) {
    return <p className="max-w-sm mx-auto text-center">Loading...</p>;
  }

  return (
    <main className="max-w-sm mx-auto p-5 space-y-5">
      <ButtonBack />
      <section className="flex items-center gap-2">
        <Users size={40} />
        <div>
          <h1 className="text-xl font-semibold mt-2">{group?.name}</h1>
          <h2 className="text-sm text-muted-foreground">
            {group?.memberCount} Member{group?.memberCount !== 1 ? "s" : ""}
          </h2>
        </div>
      </section>
      <hr />
      <ChatGroup groupId={groupId} />
    </main>
  );
}
