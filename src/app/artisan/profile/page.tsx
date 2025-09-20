'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle } from 'lucide-react';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { T } from '@/app/language-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { ArtisanProfile as ArtisanProfileType } from '@/services/artisan-service';


export default function ArtisanProfileSelectionPage() {
    const [profiles, setProfiles] = useState<ArtisanProfileType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchArtisans = async () => {
            setIsLoading(true);
            try {
                const artisansCol = collection(db, 'artisans');
                const artisanSnapshot = await getDocs(artisansCol);
                const artisanList = artisanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArtisanProfileType));
                setProfiles(artisanList);
            } catch (error) {
                console.error("Error fetching artisan profiles:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchArtisans();
    }, []);

    const handleProfileSelect = (artisanId: string) => {
        router.push(`/artisan/home?id=${artisanId}`);
    };

    return (
        <div className="container mx-auto max-w-2xl py-12 text-center">
            <h1 className="font-headline text-4xl md:text-5xl mb-4"><T>Select Your Profile</T></h1>
            <p className="text-xl text-muted-foreground mb-12"><T>Choose your artisan profile to continue.</T></p>
            
            <div className="grid gap-6">
                {isLoading ? (
                    <>
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </>
                ) : (
                    profiles.map(profile => (
                        <Card key={profile.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleProfileSelect(profile.id)}>
                            <CardContent className="flex items-center gap-4 p-4">
                                <Avatar className="w-16 h-16">
                                    <AvatarImage src={profile.photo.imageUrl} alt={profile.name} data-ai-hint={profile.photo.imageHint} />
                                    <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                    <h2 className="font-semibold text-lg"><T>{profile.name}</T></h2>
                                    <p className="text-muted-foreground"><T>{profile.craft}</T></p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
                
                <Link href="/artisan/create-profile" passHref>
                    <Button variant="outline" className="w-full h-24 border-2 border-dashed hover:border-primary hover:text-primary transition-colors">
                        <PlusCircle className="mr-2" />
                        <T>Create New Profile</T>
                    </Button>
                </Link>
            </div>
        </div>
    );
}
