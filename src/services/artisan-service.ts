import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import {ref, uploadString, getDownloadURL} from 'firebase/storage';
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
  image: {
    imageUrl: string;
    imageHint: string;
  };
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function addProduct(
  productData: Partial<NewProduct>,
  imageToSubmit: string
): Promise<void> {
  // 1. Upload image to Firebase Storage
  const storageRef = ref(storage, `products/${Date.now()}_${productData.name}`);
  const uploadResult = await uploadString(
    storageRef,
    imageToSubmit,
    'data_url'
  );
  const imageUrl = await getDownloadURL(uploadResult.ref);

  // 2. Add product data to Firestore
  const docRef = await addDoc(collection(db, 'products'), {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    materials: productData.materials,
    origin: productData.origin,
    inspiration: productData.inspiration,
    image: {
      imageUrl: imageUrl,
      imageHint: productData.image?.imageHint || 'product image',
    },
    artisan: {
      id: 'artisan-ramesh', // In a real app, this would be the logged-in user's ID
      name: 'Ramesh Kumar',
    },
    createdAt: new Date(),
  });
  console.log('Document written with ID: ', docRef.id);
}

export async function getPublishedItems(): Promise<PublishedItem[]> {
  const productsCol = collection(db, 'products');
  const q = query(productsCol, orderBy('createdAt', 'desc'), limit(10));
  const productSnapshot = await getDocs(q);
  const productList = productSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      image: data.image,
      price: `₹${data.price}`,
    };
  });
  return productList as PublishedItem[];
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
