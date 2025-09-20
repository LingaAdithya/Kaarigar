
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {db, storage} from '@/lib/firebase';
import { ImagePlaceholder } from '@/lib/placeholder-images';

export type ArtisanProfile = {
    id: string;
    name: string;
    craft: string;
    bio: string;
    photo: {
        imageUrl: string;
        imageHint: string;
    }
};

export type PublishedItem = {
  id: string;
  name: string;
  image: {
    imageUrl: string;
    imageHint: string;
  };
  price: string;
  createdAt: Timestamp;
};

export type Order = {
  id: string;
  customer: string;
  item: string;
  price: string;
  status: 'Shipped' | 'Processing' | 'Delivered' | 'Pending';
  date: string;
};

export type NewProduct = {
  name: string;
  description: string;
  price: number;
  materials: string;
  origin: string;
  inspiration: string;
};

export type NewArtisanProfile = {
    name: string;
    story: string;
}

export async function createArtisanProfile(profileData: NewArtisanProfile): Promise<string> {
    const artisansCol = collection(db, 'artisans');
    const newArtisanDoc = await addDoc(artisansCol, {
        name: profileData.name,
        bio: profileData.story,
        craft: "Handicrafts", // Default craft
        photo: { // Default photo
            imageUrl: 'https://picsum.photos/seed/new-artisan/400/400',
            imageHint: 'artisan portrait',
        },
        createdAt: serverTimestamp(),
    });
    return newArtisanDoc.id;
}


export async function addProduct(
  artisanId: string,
  productData: Partial<NewProduct>,
  imageToSubmit: string,
  onProgress: (progress: number) => void
): Promise<void> {
  if (!imageToSubmit) {
    throw new Error('An image is required to add a product.');
  }
  if (!artisanId) {
    throw new Error('An artisan ID is required to add a product.');
  }

  // Fetch artisan profile to get their name
  const artisanProfile = await getArtisanProfile(artisanId);
  if (!artisanProfile) {
    throw new Error(`Artisan with ID ${artisanId} not found.`);
  }

  // 1. Upload the image to Firebase Storage
  const imageBlob = await fetch(imageToSubmit).then(r => r.blob());
  const storageRef = ref(storage, `products/${Date.now()}_${productData.name || 'product'}`);
  const uploadTask = uploadBytesResumable(storageRef, imageBlob);

  uploadTask.on('state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    },
    (error) => {
      console.error('Upload failed:', error);
      throw error;
    }
  );

  await uploadTask;
  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

  // 2. Add the product to Firestore
  const productsCol = collection(db, 'products');
  await addDoc(productsCol, {
    ...productData,
    price: Number(productData.price) || 0,
    image: {
      imageUrl: downloadURL,
      imageHint: "user uploaded product photo",
    },
    artisan: {
      id: artisanId,
      name: artisanProfile.name,
    },
    createdAt: serverTimestamp(),
  });
}


export async function getPublishedItems(artisanId: string): Promise<PublishedItem[]> {
  const productsCol = collection(db, 'products');
  const q = query(
    productsCol, 
    where('artisan.id', '==', artisanId)
  );
  const productSnapshot = await getDocs(q);
  
  const firestoreProducts = productSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      image: data.image,
      price: `₹${data.price}`,
      createdAt: data.createdAt as Timestamp,
    };
  });
  
  firestoreProducts.sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    }
    return 0;
  });

  return firestoreProducts;
}

export async function getArtisanProfile(artisanId: string): Promise<ArtisanProfile | null> {
    const artisanRef = doc(db, 'artisans', artisanId);
    const artisanSnap = await getDoc(artisanRef);

    if (!artisanSnap.exists()) {
        return null;
    }

    const data = artisanSnap.data();

    // Provide a default photo if one doesn't exist
    const photo = data.photo || {
        imageUrl: `https://picsum.photos/seed/${artisanId}/400/400`,
        imageHint: 'artisan portrait',
    };

    return { 
        id: artisanSnap.id, 
        ...data,
        photo: photo,
     } as ArtisanProfile;
}

export async function getOrders(): Promise<Order[]> {
  const ordersCol = collection(db, 'orders');
  const q = query(ordersCol, orderBy('date', 'desc'));
  const orderSnapshot = await getDocs(q);
  const orderList = orderSnapshot.docs.map(doc => {
    return {
      id: doc.id,
      ...doc.data(),
    } as Order;
  });
  return orderList;
}
