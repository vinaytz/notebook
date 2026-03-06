"use client";

import { CollectionsView } from "@/components/collections-view";
import { AppHeader } from "@/components/app-header";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null; // Middleware redirects to /login

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <CollectionsView />
      </main>
    </div>
  );
}
