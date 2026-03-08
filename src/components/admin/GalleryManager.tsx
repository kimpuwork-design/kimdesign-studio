import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadPortfolioImage } from "@/lib/portfolio";
import { useToast } from "@/hooks/use-toast";
import {
  ImagePlus, Trash2, Loader2, GripVertical,
  ArrowUpDown,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { AnimatePresence } from "framer-motion";
import { CinematicLightbox, type LightboxImage } from "@/components/media/CinematicLightbox";

interface GalleryImage {
  id: string;
  project_id: string | null;
  portfolio_id: string | null;
  image_url: string;
  sort_order: number;
  created_at: string;
}

interface Props {
  projectId: string;
}

export function GalleryManager({ projectId }: Props) {
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [orderValue, setOrderValue] = useState("");
  const orderInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    const { data, error } = await supabase
      .from("portfolio_gallery")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ title: "Error loading gallery", description: error.message, variant: "destructive" });
    } else {
      setImages(data ?? []);
    }
    setLoading(false);
  }, [projectId, toast]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.sort_order)) + 1 : 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast({ title: `${file.name} is not an image`, variant: "destructive" });
        continue;
      }

      const url = await uploadPortfolioImage(file, projectId, "gallery");
      if (!url) {
        toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
        continue;
      }

      const { error } = await supabase.from("portfolio_gallery").insert({
        project_id: projectId,
        image_url: url,
        sort_order: maxOrder + i,
      });

      if (error) {
        toast({ title: `Failed to save ${file.name}`, description: error.message, variant: "destructive" });
      }
    }

    setUploading(false);
    e.target.value = "";
    fetchImages();
    toast({ title: `${files.length} image${files.length > 1 ? "s" : ""} uploaded` });
  };

  const handleDelete = async (img: GalleryImage) => {
    if (!confirm("Delete this gallery image?")) return;
    setDeleting(img.id);
    const { error } = await supabase.from("portfolio_gallery").delete().eq("id", img.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Image removed" });
      fetchImages();
    }
    setDeleting(null);
  };

  const persistOrder = async (reordered: GalleryImage[]) => {
    setImages(reordered);
    for (let i = 0; i < reordered.length; i++) {
      await supabase
        .from("portfolio_gallery")
        .update({ sort_order: i })
        .eq("id", reordered[i].id);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = Array.from(images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    await persistOrder(reordered);
  };

  const handleOrderChange = async (imgId: string, currentIndex: number) => {
    const targetPos = parseInt(orderValue, 10);
    setEditingOrder(null);
    setOrderValue("");

    if (isNaN(targetPos) || targetPos < 1 || targetPos > images.length || targetPos === currentIndex + 1) return;

    const reordered = Array.from(images);
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetPos - 1, 0, moved);
    await persistOrder(reordered);
    toast({ title: `Moved to position ${targetPos}` });
  };

  const startEditingOrder = (imgId: string, currentIndex: number) => {
    setEditingOrder(imgId);
    setOrderValue(String(currentIndex + 1));
    setTimeout(() => orderInputRef.current?.select(), 50);
  };

  const moveToFirst = async (currentIndex: number) => {
    if (currentIndex === 0) return;
    const reordered = Array.from(images);
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.unshift(moved);
    await persistOrder(reordered);
    toast({ title: "Moved to first" });
  };

  const moveToLast = async (currentIndex: number) => {
    if (currentIndex === images.length - 1) return;
    const reordered = Array.from(images);
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.push(moved);
    await persistOrder(reordered);
    toast({ title: "Moved to last" });
  };

  // Convert to lightbox format
  const lightboxImages: LightboxImage[] = images.map((img, i) => ({
    id: img.id,
    image_url: img.image_url,
    caption: `Gallery image ${i + 1}`,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={22} className="animate-spin text-portal-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div className="rounded-xl border border-dashed border-portal-border bg-portal-surface p-6">
        <label className="flex flex-col items-center justify-center cursor-pointer gap-3 text-portal-text-muted hover:text-portal-accent transition-colors">
          {uploading ? (
            <Loader2 size={28} className="animate-spin" />
          ) : (
            <ImagePlus size={28} />
          )}
          <span className="text-sm font-medium">
            {uploading ? "Uploading..." : "Click to upload gallery images"}
          </span>
          <span className="text-xs text-portal-text-muted/60">PNG, JPG, WEBP · Multiple files allowed</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Image count */}
      {images.length > 0 && (
        <p className="text-xs text-portal-text-muted">{images.length} image{images.length !== 1 ? "s" : ""} · Drag or click position number to reorder</p>
      )}

      {/* Gallery grid with drag & drop */}
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <ImagePlus size={40} className="text-portal-text-muted/20 mb-3" />
          <p className="font-medium text-portal-text">No gallery images yet</p>
          <p className="mt-1 text-sm text-portal-text-muted">Upload images to build the project gallery.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable
            droppableId="gallery"
            getContainerForClone={() => document.body}
            renderClone={(provided, snapshot, rubric) => {
              const img = images[rubric.source.index];
              return (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="relative aspect-square rounded-xl overflow-hidden border-2 border-portal-accent bg-portal-bg shadow-2xl cursor-grabbing"
                  style={{
                    ...provided.draggableProps.style,
                    opacity: 0.92,
                    pointerEvents: "none",
                  }}
                >
                  <img
                    src={img.image_url}
                    alt=""
                    className="w-full h-full object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                  <span className="absolute bottom-2 left-2 rounded-md bg-portal-bg/80 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-semibold text-portal-text-muted">
                    {rubric.source.index + 1}
                  </span>
                </div>
              );
            }}
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
              >
                {images.map((img, index) => (
                  <Draggable key={img.id} draggableId={img.id} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={`group relative aspect-square rounded-xl overflow-hidden border border-portal-border bg-portal-bg cursor-grab active:cursor-grabbing transition-all duration-200 ${
                          snapshot.isDragging ? "opacity-40 ring-2 ring-portal-accent/20" : "hover:shadow-md"
                        }`}
                      >
                        {/* Drag handle indicator */}
                        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-portal-bg/80 backdrop-blur-sm p-1 pointer-events-none">
                          <GripVertical size={14} className="text-portal-text-muted" />
                        </div>

                        {/* Move to first/last buttons */}
                        <div className="absolute top-2 right-10 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          {index > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); moveToFirst(index); }}
                              title="Move to first"
                              className="rounded-md bg-portal-bg/80 backdrop-blur-sm px-1.5 py-1 text-[10px] font-bold text-portal-text-muted hover:text-portal-accent hover:bg-portal-bg transition-colors"
                            >
                              ⇤
                            </button>
                          )}
                          {index < images.length - 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); moveToLast(index); }}
                              title="Move to last"
                              className="rounded-md bg-portal-bg/80 backdrop-blur-sm px-1.5 py-1 text-[10px] font-bold text-portal-text-muted hover:text-portal-accent hover:bg-portal-bg transition-colors"
                            >
                              ⇥
                            </button>
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
                          disabled={deleting === img.id}
                          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-destructive/90 backdrop-blur-sm p-1.5 text-white hover:bg-destructive"
                        >
                          {deleting === img.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>

                        {/* Image (click for lightbox) */}
                        <div
                          onClick={() => { if (!snapshot.isDragging) setLightbox(index); }}
                          className="w-full h-full"
                        >
                          <img
                            src={img.image_url}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
                            loading="lazy"
                            draggable={false}
                          />
                        </div>

                        {/* Clickable order badge */}
                        {editingOrder === img.id ? (
                          <div
                            className="absolute bottom-2 left-2 z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              ref={orderInputRef}
                              type="number"
                              min={1}
                              max={images.length}
                              value={orderValue}
                              onChange={(e) => setOrderValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleOrderChange(img.id, index);
                                if (e.key === "Escape") { setEditingOrder(null); setOrderValue(""); }
                              }}
                              onBlur={() => handleOrderChange(img.id, index)}
                              className="w-10 h-6 rounded-md bg-portal-bg border border-portal-accent text-center text-[11px] font-semibold text-portal-text focus:outline-none focus:ring-1 focus:ring-portal-accent"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditingOrder(img.id, index); }}
                            title="Click to set position"
                            className="absolute bottom-2 left-2 rounded-md bg-portal-bg/80 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-semibold text-portal-text-muted hover:text-portal-accent hover:bg-portal-bg/95 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <ArrowUpDown size={9} />
                            {index + 1}
                          </button>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* CinematicLightbox */}
      <AnimatePresence>
        {lightbox !== null && images.length > 0 && (
          <CinematicLightbox
            images={lightboxImages}
            startIndex={lightbox}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
