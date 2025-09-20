'use client';

import { useState, useEffect, useRef, use } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getProductDetails, ProductDetails } from '@/services/customer-service';
import { notFound } from 'next/navigation';
import { GoogleMapEmbed } from '@/components/google-map-embed';
import { Loader2, Volume2 } from 'lucide-react';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { T, useLanguage } from '@/app/language-provider';

function ProductPageContent({ id }: { id: string }) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const [translatedBio, setTranslatedBio] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const productDetails = await getProductDetails(id);
        if (!productDetails) {
          notFound();
        } else {
          setProduct(productDetails);
        }
      } catch (error) {
        console.error('Failed to fetch product details:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
    }
  }, [audioUrl]);
  
  const handleHearStory = async () => {
    if (!product) return;
  
    setIsGeneratingAudio(true);
    setAudioUrl(null);
  
    // Use the translated bio if available, otherwise use original
    const storyText = translatedBio || product.artisan.bio;

    try {
      const { audioDataUri } = await textToSpeech(storyText);
      if (audioDataUri) {
        setAudioUrl(audioDataUri);
      } else {
        throw new Error("Generated audio was empty.");
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        variant: 'destructive',
        title: t('Audio Generation Failed'),
        description: t('Could not generate the audio story. Please try again.'),
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Effect to handle translation of the bio
  useEffect(() => {
    if (product?.artisan.bio) {
        const translated = t(product.artisan.bio);
        if(translated) {
            setTranslatedBio(translated);
        }
    }
  }, [product, t]);


  if (isLoading) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    // This will be caught by notFound in useEffect, but as a fallback:
    return notFound();
  }

  const { artisan, region } = product;
  const origin = product.details.find(d => d.label === 'Origin')?.value;

  return (
    <div className="bg-background min-h-screen pb-24">
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <div>
            <Carousel className="w-full rounded-lg overflow-hidden shadow-lg">
              <CarouselContent>
                {product.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square relative">
                      <Image src={image.imageUrl} alt={`${product.name} view ${index + 1}`} fill className="object-cover" data-ai-hint={image.imageHint} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>

          <div>
            <section className="mb-6">
              <h1 className="font-headline text-4xl md:text-5xl mb-4"><T>{product.name}</T></h1>
              <p className="text-lg leading-relaxed text-foreground/90"><T>{product.story}</T></p>
            </section>
            
            <Separator className="my-6" />

            <section className="mb-6">
              <Card className="bg-card/50 border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-headline text-2xl mb-4"><T>Meet the Artisan</T></h2>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback>{artisan.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg"><T>{artisan.name}</T></h3>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-card hover:bg-secondary" onClick={handleHearStory} disabled={isGeneratingAudio}>
                    {isGeneratingAudio ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        <T>Generating...</T>
                      </>
                    ) : audioUrl ? (
                      <>
                        <Volume2 className="w-5 h-5 mr-2" />
                        <T>Playing Story...</T>
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-5 h-5 mr-2" />
                        <T>Hear their Story</T>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </section>
            
            <Separator className="my-6" />

            <section className="mb-6">
                <h2 className="font-headline text-2xl mb-4"><T>Details</T></h2>
                <ul className="space-y-2">
                    {product.details.map(detail => (
                        <li key={detail.label} className="flex justify-between">
                            <span className="text-muted-foreground"><T>{detail.label}</T></span>
                            <span className="font-medium text-right"><T>{detail.value}</T></span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="mb-6">
                 <h2 className="font-headline text-2xl mb-4"><T>Artisan's Region</T></h2>
                 <div className="aspect-video relative rounded-lg overflow-hidden shadow-md">
                    {origin && <GoogleMapEmbed origin={origin} />}
                 </div>
            </section>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div>
                <p className="text-sm text-muted-foreground"><T>Price</T></p>
                <p className="font-headline text-2xl">{product.price}</p>
            </div>
            <Button size="lg" className="text-lg"><T>Add to Cart</T></Button>
        </div>
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setAudioUrl(null)} />}
    </div>
  );
}


function ProductPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        <div>
          <Skeleton className="aspect-square w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-6" />
          <Separator className="my-6" />
          <Card className="bg-card/50 border-border/50 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="w-full">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Separator className="my-6" />
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Since this is a dynamic route page, we have to export it as the default.
export default function Page({ params }: { params: { id: string } }) {
    const resolvedParams = use(params);
    return <ProductPageContent id={resolvedParams.id} />;
}
