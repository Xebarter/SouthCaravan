export type DefaultMarketplaceSection = {
  title: string;
  items: string[];
};

/** Mirrors supabase/seed-default-cartegories.sql: level-1 section titles and level-2 category names (order preserved). */
export const DEFAULT_MARKETPLACE_TAXONOMY: DefaultMarketplaceSection[] = [
  {
    title: 'Agriculture & Food Products',
    items: [
      'Grains & Cereals',
      'Pulses & Legumes',
      'Tubers & Roots',
      'Fruits',
      'Vegetables',
      'Nuts & Seeds',
      'Spices & Herbs',
      'Beverage Crops',
      'Beverages',
      'Processed Foods',
      'Meat & Poultry',
      'Dairy Products',
      'Seafood & Fish',
    ],
  },
  {
    title: 'Minerals, Metals & Raw Materials',
    items: [
      'Precious Metals',
      'Industrial Metals',
      'Steel & Iron',
      'Scrap Materials',
      'Rare Earth Elements & Other Minerals',
    ],
  },
  {
    title: 'Energy & Fuels',
    items: [
      'Crude Oil & Petroleum',
      'Refined Petroleum (Petrol, Diesel, Kerosene)',
      'Natural Gas',
      'Coal',
      'Renewable Energy',
    ],
  },
  {
    title: 'Chemicals & Industrial Supplies',
    items: [
      'Industrial Chemicals',
      'Fertilizers',
      'Petrochemicals',
      'Paints & Coatings',
      'Adhesives & Sealants',
      'Cleaning Chemicals',
      'Plastic Raw Materials',
    ],
  },
  {
    title: 'Construction & Building Materials',
    items: [
      'Cement & Concrete',
      'Bricks & Blocks',
      'Roofing Materials',
      'Tiles & Flooring',
      'Glass & Windows',
      'Plumbing Materials',
      'Electrical Fittings',
      'Doors & Windows',
      'Insulation Materials',
    ],
  },
  {
    title: 'Machinery & Industrial Equipment',
    items: [
      'Agricultural Machinery & Tools',
      'Construction Machinery',
      'Manufacturing Equipment',
      'Food Processing Machines',
      'Packaging Machines',
      'Pumps & Compressors',
      'Tools & Hardware',
    ],
  },
  {
    title: 'Electronics & Electrical',
    items: [
      'Consumer Electronics (Phones, TVs, Audio)',
      'Computer Equipment (Laptops, Accessories)',
      'Electrical Equipment (Cables, Switches, Transformers)',
      'Components (Semiconductors, Circuit Boards)',
    ],
  },
  {
    title: 'Textiles, Apparel & Footwear',
    items: [
      'Raw Materials (Cotton, Wool, Silk)',
      'Fabrics (incl. African Prints: Ankara, Kitenge, Kente, Bogolan, Adire)',
      "Garments (Men's, Women's, Children's, Traditional Wear)",
      'Footwear',
      'Fashion Accessories (Scarves, Bags)',
    ],
  },
  {
    title: 'Home, Furniture & Interior',
    items: [
      'Furniture (Office, Home, Wooden Handcrafted)',
      'Home Decor',
      'Kitchenware',
      'Bedding & Mattresses',
      'Lighting Fixtures',
    ],
  },
  {
    title: 'Automotive & Transport',
    items: ['Vehicles (Cars, Trucks, Motorcycles)', 'Spare Parts', 'Tires & Accessories'],
  },
  {
    title: 'Health, Pharma & Medical',
    items: ['Medicines & Herbal Products', 'Medical Equipment', 'Laboratory Supplies', 'PPE & Safety Gear'],
  },
  {
    title: 'Beauty & Personal Care',
    items: [
      'Skincare (Shea Butter, Natural Oils)',
      'Hair Products',
      'Cosmetics',
      'Fragrances',
      'Hygiene Products (Black Soap, etc.)',
    ],
  },
  {
    title: 'Handicrafts & Cultural Products',
    items: [
      'Art & Paintings',
      'Sculptures & Carvings',
      'Beaded Products & Jewelry',
      'Traditional Items (Masks, Baskets, Woven Goods, Pottery)',
      'Leather Goods',
      'Musical Instruments',
    ],
  },
  {
    title: 'Packaging & Printing',
    items: ['Packaging Materials (Paper, Plastic)', 'Printing Services', 'Labels & Branding Materials'],
  },
  {
    title: 'Recycling & Environmental Products',
    items: ['Scrap Metals', 'Recycled Plastics', 'Waste Management Equipment', 'Eco-Friendly Products'],
  },
  {
    title: 'Sports, Toys & Recreation',
    items: ['Sports Equipment', 'Gym Equipment', 'Toys & Games'],
  },
  {
    title: 'Office, School & Business Supplies',
    items: ['Stationery', 'Office Equipment', 'School Supplies'],
  },
  {
    title: 'Logistics & Industrial Services (B2B Support)',
    items: ['Freight & Shipping', 'Warehousing', 'Customs Clearing', 'Distribution Services'],
  },
  {
    title: 'Digital & Professional Services',
    items: [
      'Software Development',
      'Web & App Development',
      'IT Services',
      'Marketing Services',
      'Consulting Services',
      'Financial Services',
    ],
  },
  {
    title: 'Raw Materials by Industry (Advanced Filter Category)',
    items: ['Textile Raw Materials', 'Construction Raw Materials', 'Chemical Raw Materials', 'Food Processing Inputs'],
  },
];
