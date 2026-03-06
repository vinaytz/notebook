"use client";

import { useState, useEffect, useCallback } from "react";
import { FolderOpen, Loader2, Search, Globe, ArrowLeft, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ImageLightbox } from "@/components/image-lightbox";
import { Filter, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { AppHeader } from "@/components/app-header";

interface Collection {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  elementCount: number;
  ownerName: string;
  createdAt: string;
}

interface Element {
  _id: string;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  tags: string[];
  createdAt: string;
}

export default function ExplorePage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const fetchPublicCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/public/collections");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCollections(data);
    } catch {
      toast.error("Failed to load public collections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicCollections();
  }, [fetchPublicCollections]);

  const filtered = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedCollection) {
    return (
      <div className="min-h-screen bg-background">
        <ExploreHeader />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <PublicCollectionDetail
            collection={selectedCollection}
            onBack={() => setSelectedCollection(null)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ExploreHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <div className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-3xl font-bold tracking-tight font-display">Explore</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Discover public collections shared by the community
            </p>
          </div>

          {/* Search */}
          {collections.length > 0 && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search public collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border p-5">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Globe className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">
                  {searchQuery ? "No collections found" : "No public collections yet"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : "Be the first to share a public collection"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((collection) => (
                <Card
                  key={collection._id}
                  className="group cursor-pointer transition-all duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/5"
                  onClick={() => setSelectedCollection(collection)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FolderOpen className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="mr-1 h-3 w-3" />
                        Public
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold tracking-tight transition-colors group-hover:text-foreground">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>by {collection.ownerName}</span>
                      <span className="text-border">·</span>
                      <span>{collection.elementCount} items</span>
                      <span className="text-border">·</span>
                      <span>
                        {formatDistanceToNow(new Date(collection.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ExploreHeader() {
  const { user, loading } = useAuth();

  // If user is logged in, use the full AppHeader with avatar/dropdown
  if (user) {
    return <AppHeader />;
  }

  // Not logged in — show sign-in / get-started buttons
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight font-display">Collectr</span>
          </Link>
        </div>
        {!loading && (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function PublicCollectionDetail({
  collection,
  onBack,
}: {
  collection: Collection;
  onBack: () => void;
}) {
  const [elements, setElements] = useState<Element[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lightboxElement, setLightboxElement] = useState<Element | null>(null);

  const fetchElements = useCallback(async () => {
    try {
      const url = activeTag
        ? `/api/collections/${collection._id}/elements?tag=${encodeURIComponent(activeTag)}`
        : `/api/collections/${collection._id}/elements`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setElements(data);
    } catch {
      toast.error("Failed to load elements");
    } finally {
      setLoading(false);
    }
  }, [collection._id, activeTag]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${collection._id}/tags`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTags(data);
    } catch {
      // non-critical
    }
  }, [collection._id]);

  useEffect(() => {
    setLoading(true);
    fetchElements();
  }, [fetchElements]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight font-display">
              {collection.name}
            </h1>
            <Badge variant="secondary" className="text-xs">
              <Globe className="mr-1 h-3 w-3" />
              Public
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {collection.description && (
              <span>{collection.description} · </span>
            )}
            by {collection.ownerName}
          </p>
        </div>
      </div>

      <Separator />

      {/* Tag Filter / Search */}
      {tags.length > 0 && (
        <div className="space-y-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags…"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {tagSearch && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground"
                onClick={() => setTagSearch("")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Badge
              variant={activeTag === null ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => { setActiveTag(null); setTagSearch(""); }}
            >
              All
            </Badge>
            {tags
              .filter((tag) => tag.toLowerCase().includes(tagSearch.toLowerCase()))
              .map((tag) => (
                <Badge
                  key={tag}
                  variant={activeTag === tag ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                  {activeTag === tag && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
          </div>
        </div>
      )}

      {/* Elements Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : elements.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">
            {activeTag ? "No elements with this tag" : "No elements in this collection"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {elements.map((element) => (
            <Card
              key={element._id}
              className="group overflow-hidden transition-all duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/5"
            >
              <div
                className="relative aspect-square cursor-pointer overflow-hidden bg-muted"
                onClick={() => setLightboxElement(element)}
              >
                <img
                  src={element.thumbnailUrl || element.imageUrl}
                  alt={element.description}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-medium leading-snug">
                  {element.description}
                </p>
                {element.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {element.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer text-xs transition-colors hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setActiveTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {lightboxElement && (
        <ImageLightbox
          element={lightboxElement}
          onClose={() => setLightboxElement(null)}
        />
      )}
    </div>
  );
}
