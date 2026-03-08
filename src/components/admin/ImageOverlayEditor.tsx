import { useState, useRef, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Type, Image as ImageIcon, RotateCcw, Loader2 } from "lucide-react";

interface ImageOverlayEditorProps {
  imageUrl: string;
  onClose: () => void;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: string;
}

export function ImageOverlayEditor({ imageUrl, onClose }: ImageOverlayEditorProps) {
  const { settings } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [addingText, setAddingText] = useState(false);
  const [newText, setNewText] = useState("");
  const [fontSize, setFontSize] = useState(32);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [showWatermark, setShowWatermark] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imgRef.current = img; setImgLoaded(true); renderCanvas(); };
    img.src = imageUrl;
  }, [imageUrl]);

  // Load logo
  useEffect(() => {
    if (!settings?.logo_url) return;
    const logo = new window.Image();
    logo.crossOrigin = "anonymous";
    logo.onload = () => { logoRef.current = logo; };
    logo.src = settings.logo_url;
  }, [settings?.logo_url]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw base image
    ctx.drawImage(img, 0, 0);

    // Draw text overlays
    overlays.forEach((ov) => {
      ctx.save();
      ctx.font = `${ov.fontWeight} ${ov.fontSize}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = ov.color;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(ov.text, ov.x, ov.y);
      ctx.restore();
    });

    // Draw watermark logo
    if (showWatermark && logoRef.current) {
      const logo = logoRef.current;
      const maxW = img.naturalWidth * 0.15;
      const scale = maxW / logo.naturalWidth;
      const w = logo.naturalWidth * scale;
      const h = logo.naturalHeight * scale;
      const padding = 20;
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.drawImage(logo, img.naturalWidth - w - padding, img.naturalHeight - h - padding, w, h);
      ctx.restore();
    }
  };

  useEffect(() => {
    if (imgLoaded) renderCanvas();
  }, [overlays, showWatermark, imgLoaded]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!addingText || !newText.trim()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setOverlays((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: newText, x, y, fontSize, color: fontColor, fontWeight: "bold" },
    ]);
    setNewText("");
    setAddingText(false);
  };

  const removeOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    canvas.toBlob((blob) => {
      if (!blob) { setDownloading(false); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited-image-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloading(false);
    }, "image/png");
  };

  const resetAll = () => {
    setOverlays([]);
    setShowWatermark(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm">
      <div className="flex-1 flex items-center justify-center p-4" onClick={onClose} />
      <div className="w-full max-w-4xl bg-portal-surface border-l border-portal-border flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-portal-border">
          <h2 className="font-display text-lg font-bold text-portal-text">Image Editor</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={resetAll} className="border-portal-border text-portal-text-muted">
              <RotateCcw size={13} className="mr-1.5" />Reset
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={downloading}
              className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
              {downloading ? <Loader2 size={13} className="animate-spin mr-1.5" /> : <Download size={13} className="mr-1.5" />}
              Download
            </Button>
            <button onClick={onClose} className="text-portal-text-muted hover:text-portal-text p-1.5">✕</button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-portal-bg">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className={`max-w-full max-h-[60vh] rounded-xl shadow-lg ${addingText ? "cursor-crosshair" : "cursor-default"}`}
          />
        </div>

        {/* Tools panel */}
        <div className="border-t border-portal-border p-4 space-y-3">
          {/* Text overlays list */}
          {overlays.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {overlays.map((ov) => (
                <span key={ov.id} className="flex items-center gap-1.5 rounded-full bg-portal-bg border border-portal-border px-3 py-1 text-xs text-portal-text">
                  "{ov.text}"
                  <button onClick={() => removeOverlay(ov.id)} className="text-destructive hover:text-destructive/80">✕</button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end gap-3 flex-wrap">
            {/* Add text */}
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label className="text-portal-text-muted text-xs">Text</Label>
              <div className="flex gap-2">
                <Input
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Type text, then click on image..."
                  className="bg-portal-bg border-portal-border text-portal-text text-sm flex-1"
                  onFocus={() => setAddingText(true)}
                />
              </div>
            </div>

            {/* Font size */}
            <div className="w-20 space-y-1">
              <Label className="text-portal-text-muted text-xs">Size</Label>
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                min={12}
                max={200}
                className="bg-portal-bg border-portal-border text-portal-text text-sm"
              />
            </div>

            {/* Color */}
            <div className="w-16 space-y-1">
              <Label className="text-portal-text-muted text-xs">Color</Label>
              <input
                type="color"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                className="h-9 w-full rounded-lg cursor-pointer border border-portal-border"
              />
            </div>

            {/* Watermark toggle */}
            <Button
              size="sm"
              variant={showWatermark ? "default" : "outline"}
              onClick={() => setShowWatermark(!showWatermark)}
              className={showWatermark ? "bg-portal-accent text-portal-accent-foreground" : "border-portal-border text-portal-text-muted"}
              disabled={!settings?.logo_url}
              title={!settings?.logo_url ? "Upload a logo in Settings first" : "Toggle logo watermark"}
            >
              <ImageIcon size={13} className="mr-1.5" />
              {showWatermark ? "Watermark ON" : "Watermark"}
            </Button>

            {addingText && newText.trim() && (
              <p className="text-xs text-portal-accent animate-pulse">👆 Click on image to place text</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
