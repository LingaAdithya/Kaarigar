'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, User } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { getPublishedItems, PublishedItem, getArtisanProfile, ArtisanProfile } from '@/services/artisan-service';
import { Skeleton } from '@/components/ui/skeleton';
import { T } from '@/app/language-provider';

function ArtisanHomePageContent() {
  const searchParams = useSearchParams();
  const artisanId = searchParams.get('id');

  const [artisan, setArtisan] = useState<ArtisanProfile | null>(null);
  const [publishedItems, setPublishedItems] = useState<PublishedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!artisanId) {
        setIsLoading(false);
        // Maybe redirect to profile selection or show an error
        return;
    };

    const fetchArtisanData = async () => {
      setIsLoading(true);
      try {
        const [artisanData, items] = await Promise.all([
            getArtisanProfile(artisanId),
            getPublishedItems(artisanId)
        ]);
        setArtisan(artisanData);
        setPublishedItems(items);
      } catch (error) {
        console.error("Error fetching artisan data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArtisanData();
  }, [artisanId]);

  if (isLoading) {
    return (
        <div className="w-full max-w-4xl mx-auto text-center">
            <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-6 w-3/4 mx-auto mb-16" />
            <Skeleton className="w-48 h-48 rounded-full mx-auto" />
        </div>
    )
  }

  if (!artisanId || !artisan) {
    return (
        <div className="text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold">No Artisan Selected</h1>
            <p className="mt-2 text-muted-foreground">Please select a profile to view the dashboard.</p>
            <Link href="/artisan/profile" className="mt-6">
                <Button>Select Profile</Button>
            </Link>
        </div>
    )
  }
  
  const addProductUrl = `/artisan/add-product?id=${artisanId}`;

  return (
    <div className="flex flex-col items-center justify-start h-full text-center pt-8">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="font-headline text-3xl md:text-4xl mb-2"><T>Hello, {artisan.name}!</T></h1>
        <p className="text-muted-foreground mb-16"><T>Welcome back to your creative space.</T></p>
        
        <Link href={addProductUrl} passHref>
          <Button
            variant="default"
            className="w-48 h-48 rounded-full flex-col gap-2 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-100"
          >
            <Plus className="w-10 h-10" />
            <T>Add Masterpiece</T>
          </Button>
        </Link>

        <div className="mt-20 text-left">
          <h2 className="font-headline text-2xl mb-4 px-1"><T>Your Published Items</T></h2>
          {publishedItems.length > 0 ? (
            <Carousel opts={{ align: 'start' }} className="w-full">
              <CarouselContent className="-ml-2">
                {publishedItems.map((item) => (
                  <CarouselItem key={item.id} className="pl-2 md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card className="overflow-hidden shadow-sm">
                        <CardContent className="flex flex-col aspect-square items-center justify-center p-0 relative">
                          <Image src={item.image.imageUrl} data-ai-hint={item.image.imageHint} alt={item.name} width={400} height={400} className="object-cover w-full h-full" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                            <h3 className="font-headline text-lg text-white"><T>{item.name}</T></h3>
                            <p className="text-sm text-white/90">{item.price}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="ml-12" />
              <CarouselNext className="mr-12" />
            </Carousel>
          ) : (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground"><T>You haven't published any items yet.</T></p>
                <p className="text-muted-foreground"><T>Click "Add Masterpiece" to get started!</T></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArtisanHomePage() {
    return (
        <Suspense fallback={<div className="w-full max-w-4xl mx-auto text-center pt-8"><Skeleton className="h-10 w-1/2 mx-auto mb-2" /><Skeleton className="h-6 w-3/4 mx-auto mb-16" /><Skeleton className="w-48 h-48 rounded-full mx-auto" /></div>}>
            <ArtisanHomePageContent />
        </Suspense>
    )
}
