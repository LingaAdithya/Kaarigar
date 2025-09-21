
import {collection, getDocs, doc, getDoc, query, limit, orderBy} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import type {ImagePlaceholder} from '@/lib/placeholder-images';

export type Artisan = {
  id: string;
  name: string;
  craft: string;
  photo: ImagePlaceholder;
  bio?: string;
};

export type Region = {
  id: string;
  name: string;
  image: ImagePlaceholder;
};

export type Product = {
  id: string;
  name: string;
  artisan: {name: string};
  price: string;
  image: ImagePlaceholder;
};

export type ProductForSearch = {
    id: string;
    name: string;
    description: string;
};

export type ProductDetails = {
  id: string;
  name: string;
  images: ImagePlaceholder[];
  story: string;
  artisan: {
    id: string;
    name: string;
    photo: ImagePlaceholder;
    bio: string;
  };
  price: string;
  details: {label: string; value: string}[];
  region: {
    mapImage: ImagePlaceholder;
  };
};

export async function getArtisansOfTheDay(): Promise<Artisan[]> {
  const artisansCol = collection(db, 'artisans');
  const q = query(artisansCol, orderBy('createdAt', 'desc'), limit(2));
  const artisanSnapshot = await getDocs(q);
  const artisanList = artisanSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    } as Artisan;
  });
  return artisanList;
}

export async function getRegions(): Promise<Region[]> {
  const regionsCol = collection(db, 'regions');
  const regionSnapshot = await getDocs(regionsCol);
  const regionList = regionSnapshot.docs.map(doc => {
    return {
      id: doc.id,
      ...doc.data(),
    } as Region;
  });
  return regionList;
}

export async function getCuratedProducts(): Promise<Product[]> {
  const productsCol = collection(db, 'products');
  // Fetches all products, ordered by newest first.
  const q = query(productsCol, orderBy('createdAt', 'desc'));
  const productSnapshot = await getDocs(q);
  const productList = productSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      artisan: {name: data.artisan.name},
      price: `₹${data.price}`,
      image: data.image,
    } as Product;
  });
  return productList;
}

export async function getProductDetails(
  productId: string
): Promise<ProductDetails | null> {
  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    return null;
  }

  const productData = productSnap.data();

  // Fetch artisan details
  const artisanRef = doc(db, 'artisans', productData.artisan.id);
  const artisanSnap = await getDoc(artisanRef);
  const artisanData = artisanSnap.exists()
    ? (artisanSnap.data() as Artisan)
    : null;

  if (!artisanData) {
    throw new Error('Artisan not found for product');
  }

  // In a real app, you might fetch region data as well
  const mapImage = {
    id: 'map-rajasthan',
    description: 'Map of Rajasthan',
    imageUrl: 'https://picsum.photos/seed/map/600/400',
    imageHint: 'india map rajasthan',
  };

  const images = productData.images && productData.images.length > 0 ? productData.images : [productData.image];

  return {
    id: productSnap.id,
    name: productData.name,
    images: images,
    story: productData.description,
    artisan: {
      id: artisanData.id,
      name: artisanData.name,
      bio: artisanData.bio || 'A passionate creator of beautiful handicrafts.',
      photo: artisanData.photo,
    },
    price: `₹${productData.price}`,
    details: [
      {label: 'Materials', value: productData.materials},
      {label: 'Origin', value: productData.origin},
    ],
    region: {
      mapImage: mapImage,
    },
  };
}

export async function getAllProductsForSearch(): Promise<ProductForSearch[]> {
  const productsCol = collection(db, 'products');
  const productSnapshot = await getDocs(productsCol);
  const productList = productSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
    } as ProductForSearch;
  });
  return productList;
}
