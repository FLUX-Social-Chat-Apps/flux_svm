"use client";
import { supabase } from "@/config/supabase";
import { useWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Plus, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  sender: string;
  content: string;
  created_at: string;
  group_chat: string;
}

interface ChatProps {
  groupId: string;
}

interface Payload {
  new: Message;
}

export default function ChatGroup({ groupId }: ChatProps) {
  const { publicKey } = useWallet();
  const user = publicKey?.toString();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user names for all senders
  useEffect(() => {
    const fetchUserNames = async () => {
      if (!messages.length) return;

      const senderIds = [...new Set(messages.map((msg) => msg.sender))];

      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, name")
          .in("id", senderIds);

        if (error) throw error;

        const namesMap = data.reduce((acc, user) => {
          acc[user.id] = user.name;
          return acc;
        }, {} as Record<string, string>);

        setUserNames(namesMap);
      } catch (error) {
        console.error("Error fetching user names:", error);
      }
    };

    fetchUserNames();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("group_chat", groupId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setError("Failed to load messages. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Setup real-time listener
    const setupRealtime = () => {
      const messageListener = supabase
        .channel("public:messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `group_chat=eq.${groupId}`,
          },
          (payload: Payload) => {
            setMessages((prevMessages) => [...prevMessages, payload.new]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messageListener);
      };
    };

    fetchMessages();
    const cleanup = setupRealtime();

    return () => {
      cleanup();
    };
  }, [groupId]);

  const sendMessage = async () => {
    if (!user) {
      setError("Please connect your wallet to send messages");
      return;
    }

    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from("messages")
        .insert([{ sender: user, group_chat: groupId, content: newMessage }]);

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const isOwnMessage = (senderId: string) => {
    return user === senderId;
  };

  const getInitials = (address: string) => {
    return address ? `${address.substring(0, 2)}` : "?";
  };

  const getDisplayName = (senderId: string) => {
    if (userNames[senderId]) {
      return userNames[senderId];
    }

    return `${senderId.substring(0, 4)}...${senderId.substring(
      senderId.length - 4
    )}`;
  };

  return (
    <div className="flex flex-col h-[80vh]">
      <ScrollArea
        className="flex-1 px-4 py-2 mb-4 h-[40vh]"
        ref={scrollAreaRef}
      >
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-12 w-1/2 ml-auto" />
              <Skeleton className="h-12 w-2/3" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full py-20">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  No messages yet. Start the conversation!
                </p>
                <Send className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = isOwnMessage(message.sender);
              const showSender =
                index === 0 || messages[index - 1].sender !== message.sender;

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    isOwn ? "items-end" : "items-start"
                  } mb-2`}
                >
                  {!isOwn && showSender && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">
                        {getDisplayName(message.sender)}
                      </p>
                    </div>
                  )}
                  <div
                    className={`max-w-sm rounded ${
                      isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="p-2 break-all whitespace-pre-line">
                      {message.content}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 px-1">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2 items-center p-2 bg-background border-t">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button size={"icon"} variant="ghost">
              <Plus />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          disabled={!user}
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={!user || !newMessage.trim()}
          size="icon"
          type="submit"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {!user && (
        <p className="text-xs text-center text-destructive mt-2 pb-2">
          Connect your wallet to send messages
        </p>
      )}
    </div>
  );
}
