"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

interface Element {
  _id: string;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  tags: string[];
  createdAt: string;
}

interface ImageLightboxProps {
  element: Element;
  onClose: () => void;
}

export function ImageLightbox({ element, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 max-h-[90vh] max-w-4xl overflow-auto rounded-2xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image */}
        <div className="flex items-center justify-center bg-black/20">
          <img
            src={element.imageUrl}
            alt={element.description}
            className="max-h-[70vh] w-full object-contain"
          />
        </div>

        {/* Info */}
        <div className="p-5">
          <p className="text-sm font-medium leading-relaxed">
            {element.description}
          </p>
          {element.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {element.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
