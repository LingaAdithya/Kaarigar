'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { MoveHorizontal } from 'lucide-react';

interface ImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeHint: string;
  afterHint: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ImageComparisonSlider({
  beforeImage,
  afterImage,
  beforeHint,
  afterHint,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: ImageComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div ref={containerRef} className="relative w-full aspect-square rounded-lg overflow-hidden group shadow-lg">
        <Image src={beforeImage} alt="Before" fill objectFit="cover" data-ai-hint={beforeHint} />
        <div
          className="absolute top-0 left-0 right-0 bottom-0 w-full aspect-square overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image src={afterImage} alt="After" fill objectFit="cover" data-ai-hint={afterHint} />
        </div>
        <div
          className="absolute top-0 bottom-0 bg-white/80 w-1 cursor-ew-resize backdrop-blur-sm"
          style={{ left: `calc(${sliderPosition}% - 0.5px)` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 bg-white rounded-full p-1 border shadow-md text-foreground">
            <MoveHorizontal className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
          {beforeLabel}
        </div>
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
          {afterLabel}
        </div>
      </div>
      <Slider
        value={[sliderPosition]}
        onValueChange={(value) => setSliderPosition(value[0])}
        className="mt-6"
      />
    </div>
  );
}
