import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getProductDetails } from '@/services/customer-service';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProductDetails(params.id);

  if (!product) {
    notFound();
  }
  
  const {artisan, region} = product;

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
              <h1 className="font-headline text-4xl md:text-5xl mb-4">{product.name}</h1>
              <p className="text-lg leading-relaxed text-foreground/90">{product.story}</p>
            </section>
            
            <Separator className="my-6" />

            <section className="mb-6">
              <Card className="bg-card/50 border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-headline text-2xl mb-4">Meet the Artisan</h2>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      {artisan.photo && <AvatarImage src={artisan.photo.imageUrl} alt={artisan.name} data-ai-hint={artisan.photo.imageHint} />}
                      <AvatarFallback>{artisan.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{artisan.name}</h3>
                      <p className="text-sm text-muted-foreground">{artisan.bio}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-card hover:bg-secondary">
                    <PlayIcon className="w-5 h-5 mr-2" />
                    Hear their Story
                  </Button>
                </CardContent>
              </Card>
            </section>
            
            <Separator className="my-6" />

            <section className="mb-6">
                <h2 className="font-headline text-2xl mb-4">Details</h2>
                <ul className="space-y-2">
                    {product.details.map(detail => (
                        <li key={detail.label} className="flex justify-between">
                            <span className="text-muted-foreground">{detail.label}</span>
                            <span className="font-medium text-right">{detail.value}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="mb-6">
                 <h2 className="font-headline text-2xl mb-4">Artisan's Region</h2>
                 <div className="aspect-video relative rounded-lg overflow-hidden shadow-md">
                    {region.mapImage && <Image src={region.mapImage.imageUrl} alt={`Map of ${product.details.find(d => d.label === 'Origin')?.value}`} fill className="object-cover" data-ai-hint={region.mapImage.imageHint} />}
                 </div>
            </section>

          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-headline text-2xl">{product.price}</p>
            </div>
            <Button size="lg" className="text-lg">Add to Cart</Button>
        </div>
      </div>
    </div>
  );
}
