'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { findMatchingProduct } from '@/ai/flows/find-matching-product-flow';
import { Loader2, SearchX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      setError(null);
      
      findMatchingProduct(query)
        .then(res => {
          if (res.productId) {
            // Redirect to the product page
            router.push(`/customer/product/${res.productId}`);
          } else {
            // No product found
            setError(`We couldn't find a matching product for "${query}". Please try a different description.`);
            setIsLoading(false);
          }
        })
        .catch(err => {
          console.error("AI search failed:", err);
          setError("Sorry, our AI curator is taking a break. Please try again in a moment.");
          setIsLoading(false);
        });
    } else {
        setIsLoading(false);
    }
  // We only want to run this on initial load when query is available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="font-headline text-2xl">Our AI curator is searching...</h2>
        <p className="text-muted-foreground max-w-md">Finding handcrafted items that match your dream: "{query}"</p>
      </div>
    );
  }

  if (error) {
     return (
        <div className="py-16">
            <Alert variant="destructive" className="max-w-xl mx-auto text-center">
                <div className="flex justify-center mb-2">
                  <SearchX className="h-6 w-6" />
                </div>
                <AlertTitle>No Match Found</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
     )
  }
  
  if (!query) {
    return <div className="text-center py-16 text-muted-foreground">Please enter a description to start your search.</div>;
  }
  
  return null; // We either load, have an error, or redirect.
}


export default function SearchPage() {
    return (
        <main className="container mx-auto max-w-3xl px-4 py-8">
            <Suspense fallback={<div>Loading...</div>}>
                <SearchResults />
            </Suspense>
        </main>
    );
}
