export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  bgColor: string;
  textColor: string;
}

export interface Bike {
  id: string;
  name: string;
  slug: string;
  model: string;
  year: number;
  price: number;
  description: string;
  image: string;
  brandId: string;
  brand?: Brand;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  stock: number;

  // ✅ FIXED
  category: {
    name: string;
  };

  bike?: {
    name: string;
    brand: {
      name: string;
    };
  };
}