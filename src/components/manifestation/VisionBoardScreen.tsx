import React, { useState, useRef } from 'react';
import { X, Plus, Play, Trash2, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVisionBoard } from '@/hooks/useVisionBoard';

interface VisionBoardScreenProps {
  onBack: () => void;
}

export const VisionBoardScreen: React.FC<VisionBoardScreenProps> = ({ onBack }) => {
  const { items, loading, uploading, uploadImage, removeImage } = useVisionBoard();
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visionStatement, setVisionStatement] = useState(
    "I am a successful IIT student, excelling in my studies and living my dream life."
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const caption = prompt('Enter a caption for this image (optional):');
      await uploadImage(file, caption || undefined);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (id: string) => {
    await removeImage(id);
  };

  const handleStartSlideshow = () => {
    if (items.length > 0) {
      setIsSlideshow(true);
      setCurrentSlide(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSlideshow && items.length > 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <button
          onClick={() => setIsSlideshow(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex-1 flex items-center justify-center p-4">
          {items[currentSlide] && (
            <div className="text-center animate-in fade-in duration-500">
              <img
                src={items[currentSlide].image_url}
                alt={items[currentSlide].caption || 'Vision'}
                className="max-w-full max-h-[60vh] rounded-2xl object-cover mx-auto"
              />
              <p className="text-white text-xl font-semibold mt-6">
                {items[currentSlide].caption || 'My Vision'}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 text-center">
          <p className="text-white/80 text-lg italic mb-6">"{visionStatement}"</p>
          <div className="flex justify-center gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentSlide ? "bg-white w-6" : "bg-white/30"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between p-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="text-white"
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            onClick={() => setCurrentSlide(Math.min(items.length - 1, currentSlide + 1))}
            disabled={currentSlide === items.length - 1}
            className="text-white"
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Vision Board</h1>
            <p className="text-xs text-muted-foreground">{items.length} images</p>
          </div>
          <Button variant="glow" size="sm" onClick={handleStartSlideshow} disabled={items.length === 0}>
            <Play className="w-4 h-4 mr-1" />
            Play
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <p className="text-xs text-primary font-medium mb-2">VISION STATEMENT</p>
          <textarea
            value={visionStatement}
            onChange={(e) => setVisionStatement(e.target.value)}
            className="w-full bg-transparent text-foreground text-sm resize-none focus:outline-none"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <img
                src={item.image_url}
                alt={item.caption || 'Vision'}
                className="w-full h-32 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <button
                  onClick={() => handleRemoveImage(item.id)}
                  className="p-2 rounded-full bg-destructive/80 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {item.caption && (
                <p className="absolute bottom-2 left-2 right-2 text-xs text-white font-medium bg-black/50 rounded px-2 py-1 truncate">
                  {item.caption}
                </p>
              )}
            </div>
          ))}
          
          <button
            onClick={handleAddImage}
            disabled={uploading}
            className="h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Add Image</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">Vision Board Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Add images that represent your future self</li>
            <li>• Include your dream campus or workplace</li>
            <li>• Review your board daily during manifestation</li>
            <li>• Update as your vision evolves</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
