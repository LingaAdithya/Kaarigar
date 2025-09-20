
'use client';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { getArtisansOfTheDay, getRegions, getCuratedProducts, Artisan, Region, Product } from '@/services/customer-service';
import { useEffect, useState } from 'react';
import Autoplay from "embla-carousel-autoplay"
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { T, useLanguage } from '@/app/language-provider';

export default function CustomerHomePage() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [artisansData, regionsData, productsData] = await Promise.all([
          getArtisansOfTheDay(),
          getRegions(),
          getCuratedProducts(),
        ]);
        setArtisans(artisansData);
        setRegions(regionsData);
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to fetch customer home page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get('search') as string;
    if (query) {
      router.push(`/customer/search?q=${encodeURIComponent(query)}`);
    }
  };


  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <section className="mb-16">
          {loading ? <Skeleton className="w-full aspect-[3/2] md:aspect-[2.5/1] rounded-lg" /> : (
            <Carousel className="w-full" opts={{ loop: true }} plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}>
              <CarouselContent>
                {artisans.map((artisan) => (
                  <CarouselItem key={artisan.id}>
                    <div className="relative aspect-[3/2] md:aspect-[2.5/1] w-full rounded-lg overflow-hidden shadow-lg">
                      {artisan.photo && <Image src={artisan.photo.imageUrl} alt={artisan.name} fill className="object-cover" data-ai-hint={artisan.photo.imageHint} />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
                        <h3 className="text-sm font-semibold uppercase tracking-widest"><T>Artisan of the Day</T></h3>
                        <h2 className="font-headline text-4xl md:text-6xl"><T>{artisan.name}</T></h2>
                        <p className="text-lg"><T>{artisan.craft}</T></p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}
        </section>

        <section className="mb-16 text-center">
            <h2 className="font-headline text-3xl mb-4"><T>Dream It, Find It</T></h2>
             <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input name="search" placeholder={t('Describe the art you are dreaming of...')} className="pl-14 h-14 text-lg rounded-full shadow-inner bg-card border-border/80" />
            </form>
        </section>

        <section className="mb-16">
          <h2 className="font-headline text-3xl mb-6"><T>Shop by Region</T></h2>
          <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
            {loading ? Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="w-48 h-64 rounded-lg" />) : (
              regions.map((region) => (
                <div key={region.id} className="flex-shrink-0 w-48 text-center group">
                  <div className="relative w-48 h-64 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                    {region.image && <Image src={region.image.imageUrl} alt={region.name} fill className="object-cover" data-ai-hint={region.image.imageHint} />}
                  </div>
                  <h3 className="font-headline text-xl mt-3"><T>{region.name}</T></h3>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="font-headline text-3xl mb-6"><T>Curated For You</T></h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading ? Array.from({length: 4}).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/5] w-full rounded-lg"/>
                <Skeleton className="h-5 w-3/4 mt-4 rounded-md" />
                <Skeleton className="h-4 w-1/2 mt-2 rounded-md" />
              </div>
            )) : (
              products.map((product) => (
                <Link href={`/customer/product/${product.id}`} key={product.id}>
                  <Card className="overflow-hidden group border-none shadow-sm hover:shadow-lg transition-shadow duration-300 bg-card">
                    <CardContent className="p-0">
                      <div className="aspect-[4/5] relative">
                        {product.image && <Image src={product.image.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" data-ai-hint={product.image.imageHint} />}
                      </div>
                      <div className="p-4">
                        <h3 className="font-headline text-lg truncate"><T>{product.name}</T></h3>
                        <p className="text-sm text-muted-foreground"><T>{product.artisan.name}</T></p>
                        <p className="font-semibold mt-2">{product.price}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
