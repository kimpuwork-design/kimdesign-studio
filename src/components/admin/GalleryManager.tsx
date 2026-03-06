import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadPortfolioImage } from "@/lib/portfolio";
import { useToast } from "@/hooks/use-toast";
import {
  ImagePlus, Trash2, Loader2, GripVertical, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = Array.from(images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setImages(reordered);

    for (let i = 0; i < reordered.length; i++) {
      await supabase
        .from("portfolio_gallery")
        .update({ sort_order: i })
        .eq("id", reordered[i].id);
    }
  };

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
        <p className="text-xs text-portal-text-muted">{images.length} image{images.length !== 1 ? "s" : ""} · Drag to reorder</p>
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
                    width: 180,
                    height: 180,
                    opacity: 0.92,
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

                        {/* Order badge */}
                        <span className="absolute bottom-2 left-2 rounded-md bg-portal-bg/80 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-semibold text-portal-text-muted pointer-events-none">
                          {index + 1}
                        </span>
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

      {/* Lightbox */}
      {lightbox !== null && images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
          <button
            onClick={() => setLightbox((lightbox - 1 + images.length) % images.length)}
            className="absolute left-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <img
            src={images[lightbox].image_url}
            alt=""
            className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain"
          />
          <button
            onClick={() => setLightbox((lightbox + 1) % images.length)}
            className="absolute right-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
