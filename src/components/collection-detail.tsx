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
  Globe,
  Lock,
  Pencil,
  Search,
  FolderOpen,
  ChevronRight,
  FolderPlus,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CreateElementDialog } from "@/components/create-element-dialog";
import { ImageLightbox } from "@/components/image-lightbox";

interface Collection {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  elementCount: number;
  subCollectionCount: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
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
  breadcrumbs: Collection[];
  onBack: () => void;
  onDelete: () => void;
  onNavigateInto: (collection: Collection) => void;
  onNavigateTo: (index: number) => void;
}

export function CollectionDetail({
  collection,
  breadcrumbs,
  onBack,
  onDelete,
  onNavigateInto,
  onNavigateTo,
}: CollectionDetailProps) {
  const [elements, setElements] = useState<Element[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isPublic, setIsPublic] = useState(collection.isPublic ?? false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Edit collection state
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editName, setEditName] = useState(collection.name);
  const [editDesc, setEditDesc] = useState(collection.description || "");
  const [editIsPublic, setEditIsPublic] = useState(collection.isPublic ?? false);
  const [savingCollection, setSavingCollection] = useState(false);

  // Edit element state
  const [editElementOpen, setEditElementOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<Element | null>(null);
  const [editElementDesc, setEditElementDesc] = useState("");
  const [editElementTags, setEditElementTags] = useState("");
  const [savingElement, setSavingElement] = useState(false);

  // Tag search
  const [tagSearch, setTagSearch] = useState("");

  // Current display name/desc (updated after edit)
  const [displayName, setDisplayName] = useState(collection.name);
  const [displayDesc, setDisplayDesc] = useState(collection.description || "");

  // Sub-collections
  const [subCollections, setSubCollections] = useState<Collection[]>([]);
  const [loadingSubCollections, setLoadingSubCollections] = useState(true);

  // Create sub-collection
  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [creatingSub, setCreatingSub] = useState(false);
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [subIsPublic, setSubIsPublic] = useState(collection.isPublic ?? false);

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

  const fetchSubCollections = useCallback(async () => {
    setLoadingSubCollections(true);
    try {
      const res = await fetch(`/api/collections?parentId=${collection._id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubCollections(data);
    } catch {
      // Non-critical
    } finally {
      setLoadingSubCollections(false);
    }
  }, [collection._id]);

  useEffect(() => {
    setLoading(true);
    fetchElements();
  }, [fetchElements]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchSubCollections();
  }, [fetchSubCollections]);

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

  const toggleVisibility = async () => {
    setTogglingVisibility(true);
    try {
      const res = await fetch(`/api/collections/${collection._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setIsPublic(!isPublic);
      setEditIsPublic(!isPublic);
      toast.success(isPublic ? "Collection is now private" : "Collection is now public");
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setTogglingVisibility(false);
    }
  };

  const handleEditCollection = async () => {
    if (!editName.trim()) {
      toast.error("Collection name is required");
      return;
    }
    setSavingCollection(true);
    try {
      const res = await fetch(`/api/collections/${collection._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim(), isPublic: editIsPublic }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setDisplayName(editName.trim());
      setDisplayDesc(editDesc.trim());
      setIsPublic(editIsPublic);
      setEditCollectionOpen(false);
      toast.success("Collection updated");
    } catch {
      toast.error("Failed to update collection");
    } finally {
      setSavingCollection(false);
    }
  };

  const openEditElement = (element: Element) => {
    setEditingElement(element);
    setEditElementDesc(element.description);
    setEditElementTags(element.tags.join(", "));
    setEditElementOpen(true);
  };

  const handleEditElement = async () => {
    if (!editingElement) return;
    setSavingElement(true);
    try {
      const tags = editElementTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const res = await fetch(
        `/api/collections/${collection._id}/elements/${editingElement._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: editElementDesc, tags }),
        }
      );
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setElements((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      fetchTags();
      setEditElementOpen(false);
      setEditingElement(null);
      toast.success("Element updated");
    } catch {
      toast.error("Failed to update element");
    } finally {
      setSavingElement(false);
    }
  };

  const handleCreateSubCollection = async () => {
    if (!subName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    setCreatingSub(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subName,
          description: subDesc,
          isPublic: subIsPublic,
          parentId: collection._id,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const created = await res.json();
      setSubCollections((prev) => [created, ...prev]);
      setCreateSubOpen(false);
      setSubName("");
      setSubDesc("");
      setSubIsPublic(collection.isPublic ?? false);
      toast.success("Sub-collection created");
    } catch {
      toast.error("Failed to create sub-collection");
    } finally {
      setCreatingSub(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <nav className="flex items-center gap-1 text-sm overflow-x-auto pb-1">
          {breadcrumbs.slice(0, -1).map((bc, i) => (
            <span key={bc._id} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <button
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                onClick={() => onNavigateTo(i)}
              >
                {bc.name}
              </button>
            </span>
          ))}
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground truncate">{displayName}</span>
        </nav>
      )}

      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight font-display">
              {displayName}
            </h1>
            {displayDesc && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {displayDesc}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={toggleVisibility}
              disabled={togglingVisibility}
            >
              {togglingVisibility ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isPublic ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              {isPublic ? "Public" : "Private"}
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Element</span>
            </Button>
            <Button variant="outline" onClick={() => setCreateSubOpen(true)} className="gap-2">
              <FolderPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Sub-Collection</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditName(displayName);
                setEditDesc(displayDesc);
                setEditIsPublic(isPublic);
                setEditCollectionOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
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

      {/* Sub-Collections */}
      {!loadingSubCollections && subCollections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Sub-Collections ({subCollections.length})
          </h3>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {subCollections.map((sub) => (
              <button
                key={sub._id}
                className="group flex flex-col gap-2 rounded-xl border border-border/60 p-4 text-left transition-all hover:border-foreground/20 hover:shadow-md hover:shadow-foreground/5"
                onClick={() => onNavigateInto(sub)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <FolderOpen className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {sub.isPublic ? <Globe className="mr-1 h-2.5 w-2.5" /> : <Lock className="mr-1 h-2.5 w-2.5" />}
                    {sub.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                <div>
                  <p className="font-semibold text-sm truncate group-hover:text-foreground transition-colors">
                    {sub.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sub.elementCount || 0} items
                    {(sub.subCollectionCount || 0) > 0 && ` · ${sub.subCollectionCount} folders`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
                  {activeTag === tag && (
                    <X className="ml-1 h-3 w-3" />
                  )}
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
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {elements.map((element) => (
            <Card
              key={element._id}
              className="group pb-0 overflow-hidden transition-all duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/5"
            >
              {/* Image */}
              {(element.thumbnailUrl || element.imageUrl) ? (
                <div
                  className="relative aspect-square cursor-pointer overflow-hidden bg-muted"
                  onClick={() => setLightboxIndex(elements.indexOf(element))}
                >
                  <img
                    src={element.thumbnailUrl || element.imageUrl}
                    alt={element.description || "Element"}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              ) : (
                <div
                  className="flex aspect-square cursor-pointer items-center justify-center bg-muted"
                  onClick={() => setLightboxIndex(elements.indexOf(element))}
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}

              {/* Content */}
              <div className="p-4 pt-0 pb-3 md:pb-4 flex justify-between items-center">
                <div>

                {element.description ? (
                  <p className="line-clamp-2 whitespace-pre-wrap text-sm font-medium leading-snug">{element.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description</p>
                )}
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

                {/* Actions */}
                <div className="mt-3 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                        ···
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditElement(element)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
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
      {lightboxIndex !== null && (
        <ImageLightbox
          elements={elements}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Edit Collection Dialog */}
      <Dialog open={editCollectionOpen} onOpenChange={setEditCollectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update your collection details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditCollection()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="edit-public" className="text-sm font-medium">Public Collection</Label>
                <p className="text-xs text-muted-foreground">Anyone can view this collection</p>
              </div>
              <Switch
                id="edit-public"
                checked={editIsPublic}
                onCheckedChange={setEditIsPublic}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditCollectionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCollection} disabled={savingCollection} className="gap-2">
                {savingCollection && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Element Dialog */}
      <Dialog open={editElementOpen} onOpenChange={(open) => {
        setEditElementOpen(open);
        if (!open) setEditingElement(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Element</DialogTitle>
            <DialogDescription>
              Update the description and tags for this element.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {editingElement && (
              <div className="mx-auto h-32 w-32 overflow-hidden rounded-lg bg-muted">
                <img
                  src={editingElement.thumbnailUrl || editingElement.imageUrl}
                  alt={editingElement.description}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-el-desc">Description</Label>
              <Textarea
                id="edit-el-desc"
                value={editElementDesc}
                onChange={(e) => setEditElementDesc(e.target.value)}
                rows={3}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-el-tags">Tags</Label>
              <Input
                id="edit-el-tags"
                placeholder="comma separated, e.g. physics, formula"
                value={editElementTags}
                onChange={(e) => setEditElementTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setEditElementOpen(false); setEditingElement(null); }}>
                Cancel
              </Button>
              <Button onClick={handleEditElement} disabled={savingElement} className="gap-2">
                {savingElement && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
            <DialogDescription>
              This will permanently delete &ldquo;{displayName}&rdquo; and all its
              elements and sub-collections. This action cannot be undone.
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

      {/* Create Sub-Collection Dialog */}
      <Dialog open={createSubOpen} onOpenChange={setCreateSubOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sub-Collection</DialogTitle>
            <DialogDescription>
              Create a new collection inside &ldquo;{displayName}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="sub-name">Name</Label>
              <Input
                id="sub-name"
                placeholder="e.g. Chapter 1, Reference Images..."
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateSubCollection()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-desc">Description (optional)</Label>
              <Textarea
                id="sub-desc"
                placeholder="What will this sub-collection contain?"
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="sub-public" className="text-sm font-medium">Public</Label>
                <p className="text-xs text-muted-foreground">Anyone can view this sub-collection</p>
              </div>
              <Switch
                id="sub-public"
                checked={subIsPublic}
                onCheckedChange={setSubIsPublic}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateSubOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubCollection} disabled={creatingSub} className="gap-2">
                {creatingSub && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
