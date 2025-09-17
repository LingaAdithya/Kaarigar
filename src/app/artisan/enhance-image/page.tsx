'use client';
import { Button } from '@/components/ui/button';
import { ImageComparisonSlider } from '@/components/image-comparison-slider';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState } from 'react';

export default function EnhanceImagePage() {
  const beforeImage = PlaceHolderImages.find(p => p.id === 'enhance-before');
  const afterImage = PlaceHolderImages.find(p => p.id === 'enhance-after');

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);

  const handleEnhance = () => {
    setIsEnhancing(true);
    setTimeout(() => {
      setIsEnhancing(false);
      setIsEnhanced(true);
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-2xl w-full">
        <div className="mb-8 animate-in fade-in-0 slide-in-from-top-10 duration-500">
            <h1 className="font-headline text-4xl md:text-5xl mb-2 flex items-center justify-center gap-3 text-primary">
              <Sparkles className="w-10 h-10" />
              Enhance Your Photo
            </h1>
            <p className="text-muted-foreground text-lg">
              Let our AI give your product photo a professional touch.
            </p>
        </div>

        <div className="animate-in fade-in-0 zoom-in-90 duration-700">
          {beforeImage && afterImage && (
            <ImageComparisonSlider
              beforeImage={beforeImage.imageUrl}
              beforeHint={beforeImage.imageHint}
              afterImage={isEnhanced ? afterImage.imageUrl : beforeImage.imageUrl}
              afterHint={afterImage.imageHint}
              beforeLabel="Original"
              afterLabel={isEnhanced ? "Enhanced" : "Original"}
            />
          )}
        </div>
        
        <div className="mt-12 animate-in fade-in-0 slide-in-from-bottom-10 duration-500 space-y-4">
          {!isEnhanced ? (
             <Button size="lg" className="text-lg" onClick={handleEnhance} disabled={isEnhancing}>
                {isEnhancing ? (
                    <>
                        <Loader2 className="mr-2 animate-spin" />
                        Enhancing...
                    </>
                ) : (
                    <>
                        <Wand2 className="mr-2" />
                        Enhance with AI
                    </>
                )}
             </Button>
          ): (
            <Link href="/artisan/home">
                <Button size="lg" className="text-lg">Looks Great, Continue</Button>
            </Link>
          )}
          
        </div>
      </div>
    </div>
  );
}

    