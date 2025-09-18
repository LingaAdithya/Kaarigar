'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { getPublishedItems, PublishedItem } from '@/services/artisan-service';
import { Skeleton } from '@/components/ui/skeleton';

const ARTISAN_ID = 'artisan-ramesh';

export default function ArtisanHomePage() {
  const [publishedItems, setPublishedItems] = useState<PublishedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const items = await getPublishedItems(ARTISAN_ID);
        setPublishedItems(items);
      } catch (error) {
        console.error("Error fetching published items:", error);
        // Handle error display if necessary
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="flex flex-col items-center justify-start h-full text-center pt-8">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="font-headline text-3xl md:text-4xl mb-2">Hello, Ramesh!</h1>
        <p className="text-muted-foreground mb-16">Welcome back to your creative space.</p>
        
        <Link href="/artisan/add-product" passHref>
          <Button
            variant="default"
            className="w-48 h-48 rounded-full flex-col gap-2 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-100"
          >
            <Plus className="w-10 h-10" />
            Add Masterpiece
          </Button>
        </Link>

        <div className="mt-20 text-left">
          <h2 className="font-headline text-2xl mb-4 px-1">Your Published Items</h2>
          <Carousel opts={{ align: 'start' }} className="w-full">
            <CarouselContent className="-ml-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <CarouselItem key={index} className="pl-2 md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card className="overflow-hidden shadow-sm">
                        <CardContent className="flex aspect-square items-center justify-center p-0">
                          <Skeleton className="w-full h-full" />
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))
              ) : (
                publishedItems.map((item) => (
                  <CarouselItem key={item.id} className="pl-2 md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card className="overflow-hidden shadow-sm">
                        <CardContent className="flex flex-col aspect-square items-center justify-center p-0 relative">
                          <Image src={item.image.imageUrl} data-ai-hint={item.image.imageHint} alt={item.name} width={400} height={400} className="object-cover w-full h-full" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                            <h3 className="font-headline text-lg text-white">{item.name}</h3>
                            <p className="text-sm text-white/90">{item.price}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselPrevious className="ml-12" />
            <CarouselNext className="mr-12" />
          </Carousel>
        </div>
      </div>
    </div>
  );
}
