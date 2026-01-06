import React, { useState } from 'react';
import { X, Plus, Image, Play, Trash2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VisionBoardImage {
  id: string;
  url: string;
  caption?: string;
}

interface VisionBoardScreenProps {
  onBack: () => void;
}

const defaultImages: VisionBoardImage[] = [
  { id: '1', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop', caption: 'IIT Campus' },
  { id: '2', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop', caption: 'Study Focus' },
  { id: '3', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop', caption: 'Success Team' },
];

export const VisionBoardScreen: React.FC<VisionBoardScreenProps> = ({ onBack }) => {
  const [images, setImages] = useState<VisionBoardImage[]>(defaultImages);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visionStatement, setVisionStatement] = useState(
    "I am a successful IIT student, excelling in my studies and living my dream life."
  );

  const handleAddImage = () => {
    // Simulate adding image
    const newImage: VisionBoardImage = {
      id: Date.now().toString(),
      url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=300&fit=crop`,
      caption: 'New Vision'
    };
    setImages([...images, newImage]);
  };

  const handleRemoveImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  const handleStartSlideshow = () => {
    setIsSlideshow(true);
    setCurrentSlide(0);
  };

  // Slideshow view
  if (isSlideshow) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <button
          onClick={() => setIsSlideshow(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex-1 flex items-center justify-center p-4">
          {images[currentSlide] && (
            <div className="text-center animate-in fade-in duration-500">
              <img
                src={images[currentSlide].url}
                alt={images[currentSlide].caption}
                className="max-w-full max-h-[60vh] rounded-2xl object-cover mx-auto"
              />
              <p className="text-white text-xl font-semibold mt-6">
                {images[currentSlide].caption}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 text-center">
          <p className="text-white/80 text-lg italic mb-6">"{visionStatement}"</p>
          <div className="flex justify-center gap-2">
            {images.map((_, idx) => (
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
            onClick={() => setCurrentSlide(Math.min(images.length - 1, currentSlide + 1))}
            disabled={currentSlide === images.length - 1}
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
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Vision Board</h1>
            <p className="text-xs text-muted-foreground">{images.length} images</p>
          </div>
          <Button variant="glow" size="sm" onClick={handleStartSlideshow}>
            <Play className="w-4 h-4 mr-1" />
            Play
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-24">
        {/* Vision Statement */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <p className="text-xs text-primary font-medium mb-2">VISION STATEMENT</p>
          <textarea
            value={visionStatement}
            onChange={(e) => setVisionStatement(e.target.value)}
            className="w-full bg-transparent text-foreground text-sm resize-none focus:outline-none"
            rows={2}
          />
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.url}
                alt={image.caption}
                className="w-full h-32 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  className="p-2 rounded-full bg-danger/80 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {image.caption && (
                <p className="absolute bottom-2 left-2 right-2 text-xs text-white font-medium bg-black/50 rounded px-2 py-1 truncate">
                  {image.caption}
                </p>
              )}
            </div>
          ))}
          
          {/* Add Image Button */}
          <button
            onClick={handleAddImage}
            className="h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Plus className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Add Image</span>
          </button>
        </div>

        {/* Tips */}
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
