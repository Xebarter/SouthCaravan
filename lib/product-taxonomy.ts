export type ProductTaxonomyNode = {
  category: string;
  subcategories: {
    name: string;
    subSubcategories: string[];
  }[];
};

export const PRODUCT_TAXONOMY: ProductTaxonomyNode[] = [
  {
    category: 'Agriculture & Food Products',
    subcategories: [
      { name: 'Grains', subSubcategories: ['Maize', 'Rice', 'Wheat', 'Sorghum', 'Millet'] },
      { name: 'Tubers', subSubcategories: ['Cassava', 'Sweet Potatoes', 'Yams'] },
      { name: 'Fruits', subSubcategories: ['Mangoes', 'Pineapples', 'Avocados', 'Bananas', 'Citrus'] },
      { name: 'Vegetables', subSubcategories: ['Onions', 'Tomatoes', 'Green Beans', 'Peppers'] },
      { name: 'Cash Crops', subSubcategories: ['Coffee', 'Cocoa', 'Tea', 'Cotton'] },
      { name: 'Nuts & Seeds', subSubcategories: ['Sesame', 'Cashew', 'Groundnuts', 'Sunflower'] },
    ],
  },
  {
    category: 'Livestock & Animal Products',
    subcategories: [
      { name: 'Meat', subSubcategories: ['Beef', 'Goat Meat', 'Poultry'] },
      { name: 'Dairy', subSubcategories: ['Milk', 'Cheese', 'Yoghurt'] },
      { name: 'Animal By-products', subSubcategories: ['Leather', 'Wool', 'Hides & Skins'] },
    ],
  },
  {
    category: 'Fisheries & Aquaculture',
    subcategories: [
      { name: 'Freshwater Fish', subSubcategories: ['Tilapia', 'Catfish', 'Nile Perch'] },
      { name: 'Marine Fish', subSubcategories: ['Tuna', 'Sardines', 'Mackerel'] },
      { name: 'Seafood', subSubcategories: ['Shrimp', 'Crab', 'Octopus'] },
    ],
  },
  {
    category: 'Processed & Value-Added Foods',
    subcategories: [
      { name: 'Coffee & Cocoa Products', subSubcategories: ['Roasted Coffee', 'Cocoa Powder', 'Chocolate'] },
      { name: 'Flour Products', subSubcategories: ['Wheat Flour', 'Cassava Flour', 'Maize Flour'] },
      { name: 'Beverages', subSubcategories: ['Fruit Juices', 'Herbal Teas', 'Soft Drinks'] },
      { name: 'Edible Oils', subSubcategories: ['Palm Oil', 'Sunflower Oil', 'Sesame Oil'] },
      { name: 'Natural Sweeteners', subSubcategories: ['Honey', 'Molasses'] },
    ],
  },
  {
    category: 'Minerals & Natural Resources',
    subcategories: [
      { name: 'Precious Minerals', subSubcategories: ['Gold', 'Diamonds'] },
      { name: 'Industrial Minerals', subSubcategories: ['Copper', 'Cobalt', 'Iron Ore'] },
      { name: 'Energy Minerals', subSubcategories: ['Crude Oil', 'Natural Gas'] },
    ],
  },
  {
    category: 'Forestry Products',
    subcategories: [
      { name: 'Timber', subSubcategories: ['Hardwood', 'Softwood', 'Logs'] },
      { name: 'Woodcraft', subSubcategories: ['Furniture', 'Wood Panels'] },
      { name: 'Biomass', subSubcategories: ['Charcoal', 'Wood Pellets'] },
      { name: 'Paper Products', subSubcategories: ['Pulp', 'Paper Sheets'] },
    ],
  },
  {
    category: 'Textiles & Apparel',
    subcategories: [
      { name: 'Raw Textiles', subSubcategories: ['Cotton Fibers', 'Yarn'] },
      { name: 'African Prints', subSubcategories: ['Ankara', 'Kitenge', 'Kente'] },
      { name: 'Traditional Wear', subSubcategories: ['Kaftans', 'Dashikis', 'Boubous'] },
      { name: 'Modern Clothing', subSubcategories: ['T-Shirts', 'Dresses', 'Workwear'] },
    ],
  },
  {
    category: 'Handicrafts & Artisan Goods',
    subcategories: [
      { name: 'Jewelry', subSubcategories: ['Beaded Jewelry', 'Metal Jewelry'] },
      { name: 'Home Decor', subSubcategories: ['Baskets', 'Wood Carvings', 'Pottery'] },
      { name: 'Artwork', subSubcategories: ['Paintings', 'Sculptures'] },
      { name: 'Cultural Items', subSubcategories: ['Masks', 'Ceremonial Crafts'] },
    ],
  },
  {
    category: 'Beauty & Personal Care',
    subcategories: [
      { name: 'Natural Skincare', subSubcategories: ['Shea Butter', 'Black Soap'] },
      { name: 'Essential Oils', subSubcategories: ['Baobab Oil', 'Moringa Oil'] },
      { name: 'Haircare', subSubcategories: ['Hair Oils', 'Shampoos'] },
      { name: 'Cosmetics', subSubcategories: ['Lip Balms', 'Body Lotions'] },
    ],
  },
  {
    category: 'Industrial & Manufactured Goods',
    subcategories: [
      { name: 'Construction Materials', subSubcategories: ['Cement', 'Steel', 'Tiles'] },
      { name: 'Machinery', subSubcategories: ['Agricultural Machinery', 'Factory Equipment'] },
      { name: 'Automotive Parts', subSubcategories: ['Tyres', 'Engine Parts'] },
      { name: 'Chemicals & Pharmaceuticals', subSubcategories: ['Industrial Chemicals', 'Medicines'] },
    ],
  },
  {
    category: 'Energy & Power Products',
    subcategories: [
      { name: 'Refined Petroleum', subSubcategories: ['Diesel', 'Petrol', 'Lubricants'] },
      { name: 'Solar Equipment', subSubcategories: ['Solar Panels', 'Inverters'] },
      { name: 'Energy Storage', subSubcategories: ['Batteries', 'Energy Packs'] },
    ],
  },
  {
    category: 'Specialty & Emerging Products',
    subcategories: [
      { name: 'Sustainable Products', subSubcategories: ['Organic Produce', 'Fair-Trade Goods'] },
      { name: 'Eco-friendly Goods', subSubcategories: ['Biodegradable Packaging', 'Recycled Materials'] },
      { name: 'Green Energy Inputs', subSubcategories: ['Biofuels', 'Green Minerals'] },
      { name: 'Carbon Solutions', subSubcategories: ['Carbon Credits'] },
    ],
  },
  {
    category: 'Technology & Digital Products',
    subcategories: [
      { name: 'Software', subSubcategories: ['Business Software', 'ERP Tools'] },
      { name: 'Mobile Apps', subSubcategories: ['Consumer Apps', 'Enterprise Apps'] },
      { name: 'AI & Data', subSubcategories: ['AI Services', 'Data Analytics'] },
      { name: 'Cloud Services', subSubcategories: ['Hosting', 'SaaS Platforms'] },
    ],
  },
  {
    category: 'Services',
    subcategories: [
      { name: 'Tourism', subSubcategories: ['Travel Packages', 'Hotel Services'] },
      { name: 'Logistics', subSubcategories: ['Freight', 'Warehousing'] },
      { name: 'Financial Services', subSubcategories: ['Insurance', 'Fintech'] },
      { name: 'Professional Services', subSubcategories: ['Consulting', 'Legal Services'] },
      { name: 'Health & Wellness', subSubcategories: ['Medical Tourism', 'Wellness Retreats'] },
    ],
  },
];

export const CATEGORY_OPTIONS = PRODUCT_TAXONOMY.map((item) => item.category);

export function getSubcategoryOptions(category: string) {
  return PRODUCT_TAXONOMY.find((item) => item.category === category)?.subcategories.map((s) => s.name) ?? [];
}

export function getSubSubcategoryOptions(category: string, subcategory: string) {
  const categoryNode = PRODUCT_TAXONOMY.find((item) => item.category === category);
  if (!categoryNode) return [];
  return categoryNode.subcategories.find((item) => item.name === subcategory)?.subSubcategories ?? [];
}
