"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, X, Crop, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

interface CreateElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  onCreated: () => void;
}

export function CreateElementDialog({
  open,
  onOpenChange,
  collectionId,
  onCreated,
}: CreateElementDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const cropperRef = useRef<ReactCropperElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setIsCropping(false);
    setDescription("");
    setTagInput("");
    setTags([]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setFile(selectedFile);
    setCroppedBlob(null);
    setCroppedPreview(null);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      maxWidth: 2048,
      maxHeight: 2048,
      imageSmoothingQuality: "high",
    });

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCroppedBlob(blob);
          setCroppedPreview(canvas.toDataURL("image/jpeg", 0.9));
          setIsCropping(false);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleSkipCrop = () => {
    setIsCropping(false);
    setCroppedBlob(null);
    setCroppedPreview(null);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        setTags((prev) => [...prev, tag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!file && !croppedBlob) {
      toast.error("Please select an image");
      return;
    }
    if (!description.trim()) {
      toast.error("Please add a description");
      return;
    }

    setUploading(true);

    try {
      // 1. Get ImageKit auth params
      const authRes = await fetch("/api/imagekit-auth");
      if (!authRes.ok) throw new Error("Failed to get upload credentials");
      const authData = await authRes.json();

      // 2. Upload to ImageKit
      const uploadBlob = croppedBlob || file!;
      const formData = new FormData();
      formData.append("file", uploadBlob, file?.name || "image.jpg");
      formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || authData.publicKey || "");
      formData.append("signature", authData.signature);
      formData.append("expire", authData.expire.toString());
      formData.append("token", authData.token);
      formData.append("fileName", `collectr_${Date.now()}_${file?.name || "image.jpg"}`);
      formData.append("folder", `/collectr/${collectionId}`);

      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.message || "Upload failed");
      }

      const uploadData = await uploadRes.json();

      // 3. Create element in DB
      const elementRes = await fetch(`/api/collections/${collectionId}/elements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          imageFileId: uploadData.fileId,
          thumbnailUrl: uploadData.thumbnailUrl || uploadData.url,
          description: description.trim(),
          tags,
        }),
      });

      if (!elementRes.ok) throw new Error("Failed to save element");

      toast.success("Element added successfully");
      resetForm();
      onCreated();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Element</DialogTitle>
          <DialogDescription>
            Upload an image, add a description and tags.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Image Upload / Crop Area */}
          {!previewUrl ? (
            <div
              className="cursor-pointer rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center transition-colors hover:border-foreground/30 hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">
                Click to upload an image
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPG, WebP up to 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : isCropping ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Crop className="h-4 w-4" />
                  Crop your image
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSkipCrop}>
                    Skip
                  </Button>
                  <Button size="sm" onClick={handleCrop} className="gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    Apply Crop
                  </Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border">
                <Cropper
                  ref={cropperRef}
                  src={previewUrl}
                  style={{ height: 350, width: "100%" }}
                  initialAspectRatio={NaN}
                  guides={true}
                  background={false}
                  responsive={true}
                  viewMode={1}
                  autoCropArea={0.8}
                  checkOrientation={false}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Drag to reposition. Resize handles to adjust crop area. Free-form crop enabled.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="overflow-hidden rounded-xl border">
                <img
                  src={croppedPreview || previewUrl}
                  alt="Preview"
                  className="max-h-64 w-full object-contain bg-muted/30"
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCropping(true)}
                  className="gap-1.5"
                >
                  <Crop className="h-3.5 w-3.5" />
                  Re-crop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewUrl(null);
                    setFile(null);
                    setCroppedBlob(null);
                    setCroppedPreview(null);
                  }}
                  className="gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </Button>
                {croppedBlob && (
                  <span className="flex items-center text-xs text-emerald-500">
                    <Check className="mr-1 h-3 w-3" /> Cropped
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="element-desc">Description</Label>
            <Textarea
              id="element-desc"
              placeholder="A brief description of this element..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="element-tags">Tags</Label>
            <Input
              id="element-tags"
              placeholder='Type a tag and press Enter (e.g. "physics")'
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer gap-1 pr-1.5 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !file || !description.trim()}
              className="gap-2"
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? "Uploading..." : "Upload & Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
