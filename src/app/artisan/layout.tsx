'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon } from '@/components/icons/HomeIcon';
import { OrdersIcon } from '@/components/icons/OrdersIcon';
import { ProfileIcon } from '@/components/icons/ProfileIcon';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/artisan/home', icon: HomeIcon, label: 'Home' },
  { href: '/artisan/orders', icon: OrdersIcon, label: 'Orders' },
  { href: '/artisan/profile', icon: ProfileIcon, label: 'Profile' },
];

export default function ArtisanLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow p-4 md:p-6 mb-16">
        {children}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border z-10">
        <nav className="max-w-md mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center text-center gap-1 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
                <item.icon className={cn('w-7 h-7 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-xs font-medium transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </footer>
    </div>
  );
}
