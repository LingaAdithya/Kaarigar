
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
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {db, storage} from '@/lib/firebase';

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


export async function addProduct(
  productData: Partial<NewProduct>,
  imageToSubmit: string,
  onProgress: (progress: number) => void
): Promise<void> {
  if (!imageToSubmit) {
    throw new Error('An image is required to add a product.');
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
    artisan: { // Assuming a logged-in artisan, hardcoded for now
      id: "artisan-ramesh",
      name: "Ramesh Kumar",
    },
    createdAt: serverTimestamp(),
  });
}


export async function getPublishedItems(artisanId: string): Promise<PublishedItem[]> {
  // Get items from Firestore, filtering by artisan
  const productsCol = collection(db, 'products');
  // Remove the orderBy clause to avoid needing a composite index
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
  
  // Sort the products by date in the code
  firestoreProducts.sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    }
    return 0;
  });

  return firestoreProducts;
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
