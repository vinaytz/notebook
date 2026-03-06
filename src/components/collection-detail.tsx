"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ImageIcon,
  Loader2,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CreateElementDialog } from "@/components/create-element-dialog";
import { ImageLightbox } from "@/components/image-lightbox";

interface Collection {
  _id: string;
  name: string;
  description: string;
  elementCount: number;
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

interface CollectionDetailProps {
  collection: Collection;
  onBack: () => void;
  onDelete: () => void;
}

export function CollectionDetail({
  collection,
  onBack,
  onDelete,
}: CollectionDetailProps) {
  const [elements, setElements] = useState<Element[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      // Tags are non-critical
    }
  }, [collection._id]);

  useEffect(() => {
    setLoading(true);
    fetchElements();
  }, [fetchElements]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleElementCreated = () => {
    fetchElements();
    fetchTags();
    setCreateOpen(false);
  };

  const handleDeleteElement = async (elementId: string) => {
    try {
      const res = await fetch(
        `/api/collections/${collection._id}/elements/${elementId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setElements((prev) => prev.filter((e) => e._id !== elementId));
      fetchTags();
      toast.success("Element deleted");
    } catch {
      toast.error("Failed to delete element");
    }
  };

  const handleDeleteCollection = async () => {
    setDeleting(true);
    onDelete();
    setDeleteConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {collection.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Element</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tag Filters */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Badge
            variant={activeTag === null ? "default" : "outline"}
            className="cursor-pointer transition-colors"
            onClick={() => setActiveTag(null)}
          >
            All
          </Badge>
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant={activeTag === tag ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
              {activeTag === tag && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Elements Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="text-center">
            <p className="font-medium">
              {activeTag ? "No elements with this tag" : "No elements yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeTag
                ? "Try selecting a different tag"
                : "Add your first element to this collection"}
            </p>
          </div>
          {!activeTag && (
            <Button
              variant="outline"
              onClick={() => setCreateOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Element
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {elements.map((element) => (
            <Card
              key={element._id}
              className="group overflow-hidden transition-all duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/5"
            >
              {/* Image */}
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

              {/* Content */}
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

                {/* Actions */}
                <div className="mt-3 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                        ···
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteElement(element._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Element Dialog */}
      <CreateElementDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        collectionId={collection._id}
        onCreated={handleElementCreated}
      />

      {/* Image Lightbox */}
      {lightboxElement && (
        <ImageLightbox
          element={lightboxElement}
          onClose={() => setLightboxElement(null)}
        />
      )}

      {/* Delete Collection Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{collection.name}&rdquo; and all its
              elements. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCollection}
              disabled={deleting}
              className="gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
