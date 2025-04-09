"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ButtonBack() {
  const router = useRouter();
  return (
    <Button onClick={() => router.back()} variant={"outline"} className="mb-2">
      <ChevronLeft />
    </Button>
  );
}
