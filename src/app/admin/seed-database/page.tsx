'use client';
import {useState} from 'react';
import {db} from '@/lib/firebase';
import {writeBatch, collection, doc} from 'firebase/firestore';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Loader2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';

const artisansData = [
  {
    id: 'artisan-meera',
    name: 'Meera Devi',
    craft: 'Madhubani Painting',
    bio: 'A master of the ancient art of Madhubani, Meera brings vibrant stories to life with her intricate brushwork.',
    photo: {
      imageUrl: 'https://picsum.photos/seed/artisan1/1200/800',
      imageHint: 'indian woman painting',
    },
  },
  {
    id: 'artisan-sanjay',
    name: 'Sanjay Verma',
    craft: 'Wood Carving',
    bio: 'Sanjay transforms blocks of wood into breathtaking sculptures, a skill passed down through generations in his family.',
    photo: {
      imageUrl: 'https://picsum.photos/seed/artisan2/1200/800',
      imageHint: 'indian man carving wood',
    },
  },
  {
    id: 'artisan-ramesh',
    name: 'Ramesh Kumar',
    craft: 'Wood Carving',
    bio: 'Ramesh has been carving wood for over 30 years, learning the craft from his father in their small village near Jaipur.',
    photo: {
      imageUrl: 'https://picsum.photos/seed/artisan-ramesh/100/100',
      imageHint: 'indian man',
    },
  },
];

const regionsData = [
  {
    id: 'region-rajasthan',
    name: 'Rajasthan',
    image: {
      imageUrl: 'https://picsum.photos/seed/rajasthan/400/500',
      imageHint: 'rajasthan fort',
    },
  },
  {
    id: 'region-kerala',
    name: 'Kerala',
    image: {
      imageUrl: 'https://picsum.photos/seed/kerala/400/500',
      imageHint: 'kerala backwaters',
    },
  },
  {
    id: 'region-bengal',
    name: 'West Bengal',
    image: {
      imageUrl: 'https://picsum.photos/seed/bengal/400/500',
      imageHint: 'kolkata tram',
    },
  },
  {
    id: 'region-gujarat',
    name: 'Gujarat',
    image: {
      imageUrl: 'https://picsum.photos/seed/gujarat/400/500',
      imageHint: 'gujarat textiles',
    },
  },
];

const productsData = [
  {
    id: 'prod-1',
    name: 'Royal Elephant',
    description: "Crafted from a single block of rosewood, this majestic pair of elephants represents the enduring spirit of Rajasthan's royal heritage. Each intricate detail is hand-carved by master artisan Ramesh, a skill passed down through generations. The vibrant colors, derived from natural pigments, tell a story of festive processions and regal splendor.",
    artisan: {id: 'artisan-ramesh', name: 'Ramesh Kumar'},
    price: 2300,
    materials: 'Rosewood, Natural Pigments',
    origin: 'Jaipur, Rajasthan',
    inspiration: 'Royal heritage of Rajasthan',
    image: {
      imageUrl: 'https://picsum.photos/seed/prod1/400/500',
      imageHint: 'handicraft elephant',
    },
    createdAt: new Date(),
  },
  {
    id: 'prod-2',
    name: 'Clay Diya Set',
    description: 'Illuminate your home with this set of four handcrafted clay diyas, perfect for festivals or adding a warm glow to any evening.',
    artisan: {id: 'artisan-meera', name: 'Meera Devi'},
    price: 850,
    materials: 'Terracotta Clay',
    origin: 'Mithila, Bihar',
    inspiration: 'Traditional festival of lights',
    image: {
      imageUrl: 'https://picsum.photos/seed/prod2/400/400',
      imageHint: 'clay lamp',
    },
    createdAt: new Date(),
  },
  {
    id: 'prod-3',
    name: 'Pashmina Shawl',
    description: 'Experience the unmatched softness and warmth of a genuine Kashmiri Pashmina shawl, handwoven by skilled artisans.',
    artisan: {id: 'artisan-sanjay', name: 'Sanjay Verma'},
    price: 8500,
    materials: '100% Pashmina Wool',
    origin: 'Srinagar, Kashmir',
    inspiration: 'The serene beauty of the Himalayas',
    image: {
      imageUrl: 'https://picsum.photos/seed/prod3/400/600',
      imageHint: 'pashmina shawl',
    },
    createdAt: new Date(),
  },
  {
    id: 'prod-4',
    name: 'Brass Ganesha',
    description: 'A beautiful brass statue of Lord Ganesha, the remover of obstacles. Intricately detailed and polished to a brilliant shine.',
    artisan: {id: 'artisan-ramesh', name: 'Ramesh Kumar'},
    price: 4200,
    materials: 'Brass',
    origin: 'Moradabad, Uttar Pradesh',
    inspiration: 'Hindu mythology and divine blessings',
    image: {
      imageUrl: 'https://picsum.photos/seed/prod4/400/500',
      imageHint: 'ganesha statue',
    },
    createdAt: new Date(),
  },
];

const ordersData = [
  {
    id: 'ORD001',
    customer: 'Priya Sharma',
    item: 'Madhubani Fish',
    price: '₹1200',
    status: 'Shipped',
    date: '2023-10-26',
  },
  {
    id: 'ORD002',
    customer: 'Amit Patel',
    item: 'Terracotta Horse',
    price: '₹2100',
    status: 'Processing',
    date: '2023-10-28',
  },
  {
    id: 'ORD003',
    customer: 'Sunita Reddy',
    item: 'Warli Village Life',
    price: '₹950',
    status: 'Delivered',
    date: '2023-10-25',
  },
];


export default function SeedDatabasePage() {
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();

  const handleSeed = async () => {
    setIsLoading(true);
    toast({
      title: 'Seeding Database...',
      description: 'This may take a moment. Please do not close this page.',
    });

    try {
      const batch = writeBatch(db);

      // Seed Artisans
      const artisansCol = collection(db, 'artisans');
      artisansData.forEach(artisan => {
        const {id, ...artisanData} = artisan;
        const artisanRef = doc(artisansCol, id);
        batch.set(artisanRef, artisanData);
      });

      // Seed Regions
      const regionsCol = collection(db, 'regions');
      regionsData.forEach(region => {
        const {id, ...regionData} = region;
        const regionRef = doc(regionsCol, id);
        batch.set(regionRef, regionData);
      });
      
      // Seed Products
      const productsCol = collection(db, 'products');
      productsData.forEach(product => {
        const { id, ...productData } = product;
        const productRef = doc(productsCol, id);
        batch.set(productRef, productData);
      });

      // Seed Orders
      const ordersCol = collection(db, 'orders');
      ordersData.forEach(order => {
        const { id, ...orderData } = order;
        const orderRef = doc(ordersCol, id);
        batch.set(orderRef, orderData);
      });

      await batch.commit();

      toast({
        title: 'Database Seeded Successfully!',
        description:
          'Your Firestore database has been populated with initial data.',
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      toast({
        variant: 'destructive',
        title: 'Error Seeding Database',
        description:
          'There was a problem seeding the database. Check the console for more information.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Seed Firestore Database</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 text-center">
          <p className="text-muted-foreground">
            Click the button below to populate your Firestore database with the
            initial sample data for products, artisans, and regions. This is a
            one-time action.
          </p>
          <Button onClick={handleSeed} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Database'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
