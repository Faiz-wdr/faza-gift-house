export interface Product {
  id: number;
  title: string;
  image: string;
  materials: {
    wood?: number;
    acrylic?: number;
    glass?: number;
  };
  sizes: string[];
  popularity: number; // 1-100 scale
  dateAdded: string; // YYYY-MM-DD
  pricingMatrix?: {
    [sizeKey: string]: {
      [matKey: string]: string;
    };
  };
  sizeKeys?: string[];
  productCode?: string;
  featured?: boolean;
}

export const productsData: Product[] = [
  {
    id: 1,
    title: "Classic Arch Memento",
    image: "/memento_orange.png",
    materials: { acrylic: 50, glass: 55 },
    sizes: ["13 x 15 CM", "15 x 17 CM"],
    popularity: 95,
    dateAdded: "2026-05-01",
  },
  {
    id: 2,
    title: "Foliage Quill Award",
    image: "/memento_green.png",
    materials: { wood: 22, acrylic: 50 },
    sizes: ["13 x 17 CM", "15 x 17 CM"],
    popularity: 88,
    dateAdded: "2026-04-15",
  },
  {
    id: 3,
    title: "Sunset Crest Shield",
    image: "/memento_purple.png",
    materials: { glass: 55, wood: 22 },
    sizes: ["13 x 17 CM", "15 x 17 CM"],
    popularity: 92,
    dateAdded: "2026-05-10",
  },
  {
    id: 4,
    title: "Tapered Pillar Plaque",
    image: "/memento_orange.png",
    materials: { wood: 25 },
    sizes: ["13 x 15 CM"],
    popularity: 75,
    dateAdded: "2026-05-20",
  },
  {
    id: 5,
    title: "Forest Horizon Block",
    image: "/memento_green.png",
    materials: { wood: 20, acrylic: 48 },
    sizes: ["13 x 17 CM", "15 x 17 CM"],
    popularity: 82,
    dateAdded: "2026-05-18",
  },
  {
    id: 6,
    title: "Royal Wave Crest",
    image: "/memento_purple.png",
    materials: { glass: 56 },
    sizes: ["15 x 17 CM"],
    popularity: 90,
    dateAdded: "2026-05-25",
  },
  {
    id: 7,
    title: "Apex Star Trophy",
    image: "/memento_orange.png",
    materials: { acrylic: 55 },
    sizes: ["13 x 15 CM", "15 x 17 CM"],
    popularity: 64,
    dateAdded: "2026-03-20",
  },
  {
    id: 8,
    title: "Botanical Eco Award",
    image: "/memento_green.png",
    materials: { wood: 19 },
    sizes: ["13 x 17 CM"],
    popularity: 79,
    dateAdded: "2026-05-30",
  },
  {
    id: 9,
    title: "Majestic Flame Shield",
    image: "/memento_purple.png",
    materials: { acrylic: 60, glass: 65 },
    sizes: ["13 x 17 CM", "15 x 17 CM"],
    popularity: 85,
    dateAdded: "2026-06-01",
  },
  {
    id: 10,
    title: "Minimalist Slab Memento",
    image: "/memento_orange.png",
    materials: { wood: 21, acrylic: 47, glass: 53 },
    sizes: ["13 x 15 CM", "15 x 17 CM"],
    popularity: 70,
    dateAdded: "2026-04-10",
  },
  {
    id: 11,
    title: "Pinnacle Achievement Crest",
    image: "/memento_green.png",
    materials: { acrylic: 49, glass: 54 },
    sizes: ["15 x 17 CM"],
    popularity: 98,
    dateAdded: "2026-06-03",
  },
  {
    id: 12,
    title: "Nebula Hexagon Plaque",
    image: "/memento_purple.png",
    materials: { wood: 27, glass: 63 },
    sizes: ["13 x 17 CM", "15 x 17 CM"],
    popularity: 80,
    dateAdded: "2026-05-15",
  },
];
