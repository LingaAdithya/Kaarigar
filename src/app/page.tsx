'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { KolamIcon } from '@/components/icons/KolamIcon';
import { AlpanaIcon } from '@/components/icons/AlpanaIcon';
import { useLanguage, T } from './language-provider';

const languages = [
  { name: 'English', script: 'English', motif: <KolamIcon className="w-8 h-8 text-muted-foreground" /> },
  { name: 'Hindi', script: 'हिन्दी', motif: <AlpanaIcon className="w-8 h-8 text-muted-foreground" /> },
  { name: 'Tamil', script: 'தமிழ்', motif: <KolamIcon className="w-8 h-8 text-muted-foreground" /> },
  { name: 'Bengali', script: 'বাংলা', motif: <AlpanaIcon className="w-8 h-8 text-muted-foreground" /> },
];

function LanguageSelection({ onSelect, selectedLanguage }: { onSelect: (lang: string) => void, selectedLanguage: string | null }) {
  return (
    <div className="text-center animate-in fade-in duration-500">
      <h1 className="font-headline text-4xl md:text-5xl mb-4">Welcome!</h1>
      <p className="text-xl md:text-2xl text-foreground/80 mb-12">What language do you speak?</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
        {languages.map((lang) => (
          <Card
            key={lang.name}
            onClick={() => onSelect(lang.name)}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-card/80',
              selectedLanguage === lang.name ? 'border-accent ring-2 ring-accent' : 'border-border'
            )}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center aspect-square">
              <div className="flex-grow flex items-center justify-center">
                {lang.motif}
              </div>
              <p className="font-headline text-xl mt-4">{lang.script}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RoleSelection() {
  return (
    <div className="text-center animate-in fade-in duration-500">
      <h1 className="font-headline text-4xl md:text-5xl mb-4"><T>Who are you?</T></h1>
      <p className="text-xl md:text-2xl text-foreground/80 mb-12"><T>Choose your journey with Karigar Konnect.</T></p>
      <div className="flex flex-col md:flex-row gap-6 justify-center">
        <Link href="/artisan/profile" passHref>
          <Button variant="default" size="lg" className="h-auto py-4 px-8 text-lg w-full md:w-auto shadow-lg hover:shadow-xl transition-shadow"><T>I am an Artisan</T></Button>
        </Link>
        <Link href="/customer/home" passHref>
          <Button variant="outline" size="lg" className="h-auto py-4 px-8 text-lg w-full md:w-auto bg-card hover:bg-secondary"><T>I am a Customer</T></Button>
        </Link>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const { language, setLanguage } = useLanguage();
  const [hasSelected, setHasSelected] = useState(false);

  const handleSelectLanguage = (lang: string) => {
    setLanguage(lang);
    setHasSelected(true);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      {!hasSelected ? (
        <LanguageSelection onSelect={handleSelectLanguage} selectedLanguage={language} />
      ) : (
        <RoleSelection />
      )}
    </main>
  );
}
