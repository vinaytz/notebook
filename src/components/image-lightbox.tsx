"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useCallback, useState } from "react";

interface Element {
  _id: string;
  imageUrl: string;
  thumbnailUrl: string;
  description: string;
  tags: string[];
  createdAt: string;
}

interface ImageLightboxProps {
  elements: Element[];
  initialIndex: number;
  onClose: () => void;
}

export function ImageLightbox({ elements, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const element = elements[currentIndex];

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < elements.length - 1;

  const goNext = useCallback(() => {
    if (hasNext) setCurrentIndex((i) => i + 1);
  }, [hasNext]);

  const goPrev = useCallback(() => {
    if (hasPrev) setCurrentIndex((i) => i - 1);
  }, [hasPrev]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  if (!element) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Previous Button */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next Button */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <div
        className="relative mx-14 max-h-[90vh] max-w-4xl overflow-auto rounded-2xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Counter */}
        {elements.length > 1 && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
            {currentIndex + 1} / {elements.length}
          </div>
        )}

        {/* Image */}
        {element.imageUrl && (
          <div className="flex items-center justify-center bg-black/20">
            <img
              src={element.imageUrl}
              alt={element.description || "Element"}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        )}

        {/* Info */}
        <div className="p-5">
          {element.description ? (
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{element.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description</p>
          )}
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
