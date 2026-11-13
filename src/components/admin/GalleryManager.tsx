import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadPortfolioImage } from "@/lib/portfolio";
import { validateFile } from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/errors";
import { moveGalleryImage } from "@/lib/gallery-management";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, Replace, Save, ImageIcon, Pencil } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence } from "framer-motion";
import { CinematicLightbox } from "@/components/media/CinematicLightbox";
import { ImageOverlayEditor } from "@/components/admin/ImageOverlayEditor";

interface GalleryImage {
  id: string;
  image_url: string;
  sort_order: number;
  caption: string | null;
}
interface Props { projectId: string; onChanged?: () => void }

export function GalleryManager({ projectId, onChanged }: Props) {
  const { toast } = useToast();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replacement = useRef<string | null>(null);

  const fetchImages = useCallback(async () => {
    const { data, error } = await supabase.from("portfolio_gallery").select("id,image_url,sort_order,caption")
      .eq("project_id", projectId).order("sort_order").order("id");
    if (error) throw error;
    const next = data ?? [];
    setImages(next);
    setCaptions(Object.fromEntries(next.map(i => [i.id, i.caption ?? ""])));
    setError(null);
  }, [projectId]);

  useEffect(() => {
    fetchImages().catch(err => setError(friendlyErrorMessage(err))).finally(() => setLoading(false));
  }, [fetchImages]);

  const run = async (action: () => Promise<void>, success: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await action();
      await fetchImages();
      onChanged?.();
      toast({ title: success });
    } catch (err) {
      const message = friendlyErrorMessage(err);
      setError(message);
      toast({ title: "Couldn't save gallery", description: message, variant: "destructive" });
      await fetchImages().catch(() => {});
      setError(message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>, replace: boolean) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const imageId = replacement.current;
    if (!files.length || (replace && !imageId)) return;
    for (const file of files) {
      const invalid = validateFile(file, ["png", "jpg", "jpeg", "webp"]);
      if (invalid || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        toast({ title: "Image couldn't be added", description: invalid ?? "Choose a PNG, JPG or WEBP image.", variant: "destructive" });
        return;
      }
    }
    await run(async () => {
      if (replace && imageId) {
        const url = await uploadPortfolioImage(files[0], projectId, "gallery");
        if (!url) throw new Error("Upload failed. Please try again.");
        const { error } = await supabase.rpc("replace_project_gallery_image", { p_project_id: projectId, p_image_id: imageId, p_image_url: url });
        if (error) throw error;
      } else {
        const start = Math.max(-1, ...images.map(i => i.sort_order)) + 1;
        const rows = [];
        for (const [index, file] of files.entries()) {
          const url = await uploadPortfolioImage(file, projectId, "gallery");
          if (!url) throw new Error(`Couldn't upload ${file.name}. Please try again.`);
          rows.push({ project_id: projectId, image_url: url, sort_order: start + index });
        }
        const { error } = await supabase.from("portfolio_gallery").insert(rows);
        if (error) throw error;
      }
    }, replace ? "Image replaced" : `${files.length} images added`);
  };

  const reorder = async (from: number, to: number) => {
    if (from === to) return;
    const next = moveGalleryImage(images, from, to);
    await run(async () => {
      const { error } = await supabase.rpc("reorder_project_gallery", { p_project_id: projectId, p_image_ids: next.map(i => i.id) });
      if (error) throw error;
    }, "Gallery order saved");
  };
  const dragEnd = (result: DropResult) => {
    if (result.destination) void reorder(result.source.index, result.destination.index);
  };

  if (loading) return <div className="flex justify-center py-12" role="status" aria-label="Loading gallery"><Loader2 className="animate-spin text-portal-text-muted" /></div>;

  return (
    <div className="space-y-4" aria-busy={busy}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-portal-text-muted">{images.length} images</span>
        <Button onClick={() => uploadRef.current?.click()} disabled={busy}><ImagePlus />Add images</Button>
        <input ref={uploadRef} aria-label="Upload gallery images" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={e => void upload(e, false)} disabled={busy} />
        <input ref={replaceRef} aria-label="Replacement gallery image" type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => void upload(e, true)} disabled={busy} />
      </div>
      {busy && <p role="status" className="flex items-center gap-2 text-sm text-portal-text-muted"><Loader2 size={16} className="animate-spin" />Saving gallery…</p>}
      {error && <div role="alert" className="text-sm text-destructive">{error}<Button variant="link" disabled={busy} onClick={() => void run(fetchImages, "Gallery refreshed")}>Retry</Button></div>}
      {!images.length && !error && <div className="py-10 text-center text-portal-text-muted"><ImageIcon className="mx-auto mb-3" /><p>No gallery images yet</p></div>}
      <DragDropContext onDragEnd={dragEnd}>
        <Droppable droppableId="gallery">
          {provided => <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
            {images.map((img, index) => <Draggable key={img.id} draggableId={img.id} index={index} isDragDisabled={busy}>
              {drag => <div ref={drag.innerRef} {...drag.draggableProps} className="flex flex-wrap sm:flex-nowrap items-center gap-3 rounded-lg border border-portal-border bg-portal-bg p-3">
                <Button {...drag.dragHandleProps} variant="ghost" size="icon" disabled={busy} aria-label={`Reorder image ${index + 1}`} title="Drag to reorder" className="h-11 w-11 shrink-0 text-portal-text-muted"><GripVertical /></Button>
                <Button variant="ghost" className="h-20 w-24 shrink-0 overflow-hidden rounded-md p-0" aria-label={`Preview image ${index + 1}`} onClick={() => setLightbox(index)}>
                  <img src={img.image_url} alt={img.caption ?? `Gallery image ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </Button>
                <div className="min-w-0 flex-1 basis-32 space-y-2">
                  <label htmlFor={`caption-${img.id}`} className="text-xs font-medium text-portal-text-muted">Image {index + 1} · Caption</label>
                  <div className="flex gap-2">
                    <Input id={`caption-${img.id}`} value={captions[img.id] ?? ""} disabled={busy} onChange={e => setCaptions(prev => ({ ...prev, [img.id]: e.target.value }))} className="min-w-0 bg-portal-surface text-portal-text border-portal-border" />
                    <Button variant="outline" size="icon" title="Save caption" aria-label={`Save caption for image ${index + 1}`} disabled={busy || (captions[img.id] ?? "") === (img.caption ?? "")} onClick={() => void run(async () => {
                      const { error, data } = await supabase.from("portfolio_gallery").update({ caption: captions[img.id]?.trim() || null }).eq("id", img.id).eq("project_id", projectId).select("id").single();
                      if (error || !data) throw error ?? new Error("Caption couldn't be saved.");
                    }, "Caption saved")}><Save /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button variant="outline" size="icon" className="h-11 w-11" disabled={busy || index === 0} title="Move earlier" aria-label={`Move image ${index + 1} earlier`} onClick={() => void reorder(index, index - 1)}><ArrowUp /></Button>
                  <Button variant="outline" size="icon" className="h-11 w-11" disabled={busy || index === images.length - 1} title="Move later" aria-label={`Move image ${index + 1} later`} onClick={() => void reorder(index, index + 1)}><ArrowDown /></Button>
                  <Button variant="outline" size="icon" className="h-11 w-11" disabled={busy} title="Replace image" aria-label={`Replace image ${index + 1}`} onClick={() => { replacement.current = img.id; replaceRef.current?.click(); }}><Replace /></Button>
                  <Button variant="outline" size="icon" className="h-11 w-11" disabled={busy} title="Edit image" aria-label={`Edit image ${index + 1}`} onClick={() => setEditorImage(img.image_url)}><Pencil /></Button>
                  <Button variant="destructive" size="icon" className="h-11 w-11" disabled={busy} title="Remove image" aria-label={`Remove image ${index + 1}`} onClick={() => {
                    if (!confirm("Remove this image from the project gallery?")) return;
                    void run(async () => {
                      const { data, error } = await supabase.from("portfolio_gallery").delete().eq("id", img.id).eq("project_id", projectId).select("id").single();
                      if (error || !data) throw error ?? new Error("Image couldn't be removed.");
                    }, "Image removed");
                  }}><Trash2 /></Button>
                </div>
              </div>}
            </Draggable>)}
            {provided.placeholder}
          </div>}
        </Droppable>
      </DragDropContext>
      <AnimatePresence>{lightbox !== null && images.length > 0 && <CinematicLightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />}</AnimatePresence>
      {editorImage && <ImageOverlayEditor imageUrl={editorImage} onClose={() => setEditorImage(null)} />}
    </div>
  );
}
