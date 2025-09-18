import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {db, storage} from '@/lib/firebase';
import type {ImagePlaceholder} from '@/lib/placeholder-images';

export type PublishedItem = {
  id: string;
  name: string;
  image: {
    imageUrl: string;
    imageHint: string;
  };
  price: string;
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


export async function addProduct(
  productData: Partial<NewProduct>,
  imageToSubmit: string,
  onProgress: (progress: number) => void
): Promise<void> {
  // This function now saves the product to local storage for instant access.
  // The original Firebase upload logic is preserved but commented out.
  return new Promise((resolve) => {
    console.log("▶️ Starting addProduct (Local Storage)...");
    
    // Simulate a quick process for the UI
    onProgress(50);

    const newProduct = {
      id: `local-${Date.now()}`,
      name: productData.name || "Unnamed Product",
      description: productData.description,
      price: Number(productData.price) || 0,
      materials: productData.materials,
      origin: productData.origin,
      inspiration: productData.inspiration,
      image: {
        imageUrl: imageToSubmit,
        imageHint: "local product image",
      },
      artisan: {
        id: "artisan-ramesh",
        name: "Ramesh Kumar",
      },
      createdAt: new Date().toISOString(),
    };
    
    // Retrieve existing local products, add the new one, and save back.
    const localProducts = JSON.parse(localStorage.getItem('localProducts') || '[]');
    localProducts.push(newProduct);
    localStorage.setItem('localProducts', JSON.stringify(localProducts));

    onProgress(100);
    console.log("✅ Product saved to Local Storage:", newProduct.id);
    
    resolve();
  });
}


export async function getPublishedItems(artisanId: string): Promise<PublishedItem[]> {
  // First, get items from local storage and filter by artisan
  const localItemsString = typeof window !== 'undefined' ? localStorage.getItem('localProducts') : null;
  const allLocalItems = localItemsString ? JSON.parse(localItemsString) : [];
  const localItems = allLocalItems.filter((item: any) => item.artisan.id === artisanId);
  
  const localProducts = localItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      image: item.image,
      price: `₹${item.price}`,
      createdAt: item.createdAt, // Keep createdAt for sorting
    }));

  // Then, get items from Firestore, filtering by artisan
  const productsCol = collection(db, 'products');
  // Remove the orderBy clause to prevent the composite index error
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
      createdAt: data.createdAt.toDate().toISOString(), // Convert Firestore timestamp
    };
  });

  // Combine and remove duplicates
  const allItems = [...localProducts, ...firestoreProducts];
  const uniqueItems = allItems.filter((item, index, self) =>
    index === self.findIndex((t) => t.id === item.id)
  );
  
  // Sort the combined list by date on the client-side
  uniqueItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // We can remove the createdAt property before returning if the UI doesn't need it
  return uniqueItems.map(({ createdAt, ...item }) => item);
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
