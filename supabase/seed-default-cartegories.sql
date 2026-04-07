-- Seed sidebar categories from contenttoadd.txt (B2B wholesale marketplace menu)
-- Hierarchy: level 1 = main section, 2 = category, 3 = product lines where nested in source
-- Safe to run multiple times (idempotent)
-- First level-1 section name: "Agriculture & Food Products" (slug agriculture-food-products), not "Agricultural Products".

create extension if not exists pgcrypto;

-- Ensure required table/trigger/policies exist before seeding
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  level int not null check (level in (1, 2, 3)),
  parent_id uuid references public.product_categories(id) on delete cascade,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, slug)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_categories_set_updated_at on public.product_categories;
create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();

alter table public.product_categories enable row level security;

drop policy if exists "product_categories_select_public" on public.product_categories;
create policy "product_categories_select_public"
  on public.product_categories for select
  using (true);

drop policy if exists "product_categories_insert_blocked" on public.product_categories;
create policy "product_categories_insert_blocked"
  on public.product_categories for insert
  with check (false);

drop policy if exists "product_categories_update_blocked" on public.product_categories;
create policy "product_categories_update_blocked"
  on public.product_categories for update
  using (false);

drop policy if exists "product_categories_delete_blocked" on public.product_categories;
create policy "product_categories_delete_blocked"
  on public.product_categories for delete
  using (false);

do $$
begin
  -- ── Level 1: main sections (20) ─────────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 1, null, true, v.sort_order
  from (values
    ('Agriculture & Food Products', 'agriculture-food-products', 0),
    ('Minerals, Metals & Raw Materials', 'minerals-metals-raw-materials', 1),
    ('Energy & Fuels', 'energy-fuels', 2),
    ('Chemicals & Industrial Supplies', 'chemicals-industrial-supplies', 3),
    ('Construction & Building Materials', 'construction-building-materials', 4),
    ('Machinery & Industrial Equipment', 'machinery-industrial-equipment', 5),
    ('Electronics & Electrical', 'electronics-electrical', 6),
    ('Textiles, Apparel & Footwear', 'textiles-apparel-footwear', 7),
    ('Home, Furniture & Interior', 'home-furniture-interior', 8),
    ('Automotive & Transport', 'automotive-transport', 9),
    ('Health, Pharma & Medical', 'health-pharma-medical', 10),
    ('Beauty & Personal Care', 'beauty-personal-care', 11),
    ('Handicrafts & Cultural Products', 'handicrafts-cultural-products', 12),
    ('Packaging & Printing', 'packaging-printing', 13),
    ('Recycling & Environmental Products', 'recycling-environmental-products', 14),
    ('Sports, Toys & Recreation', 'sports-toys-recreation', 15),
    ('Office, School & Business Supplies', 'office-school-business-supplies', 16),
    ('Logistics & Industrial Services (B2B Support)', 'logistics-industrial-services', 17),
    ('Digital & Professional Services', 'digital-professional-services', 18),
    ('Raw Materials by Industry (Advanced Filter Category)', 'raw-materials-by-industry', 19)
  ) as v(name, slug, sort_order)
  where not exists (
    select 1 from public.product_categories c
    where c.level = 1 and c.parent_id is null and c.slug = v.slug
  );

  -- ── 1. Agriculture & Food Products ──────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Grains & Cereals', 'grains-cereals', 0),
    ('Pulses & Legumes', 'pulses-legumes', 1),
    ('Tubers & Roots', 'tubers-roots', 2),
    ('Fruits', 'fruits', 3),
    ('Vegetables', 'vegetables', 4),
    ('Nuts & Seeds', 'nuts-seeds', 5),
    ('Spices & Herbs', 'spices-herbs', 6),
    ('Beverage Crops', 'beverage-crops', 7),
    ('Beverages', 'beverages', 8),
    ('Processed Foods', 'processed-foods', 9),
    ('Meat & Poultry', 'meat-poultry', 10),
    ('Dairy Products', 'dairy-products', 11),
    ('Seafood & Fish', 'seafood-fish', 12)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'agriculture-food-products' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c
    where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Maize / Corn', 'maize-corn', 0),
    ('Rice', 'rice', 1),
    ('Wheat', 'wheat', 2),
    ('Barley', 'barley', 3),
    ('Sorghum', 'sorghum', 4),
    ('Millet', 'millet', 5)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'grains-cereals' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Beans (incl. Cowpeas)', 'beans-cowpeas', 0),
    ('Lentils', 'lentils', 1),
    ('Chickpeas', 'chickpeas', 2),
    ('Other Legumes', 'other-legumes', 3)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'pulses-legumes' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Cassava', 'cassava', 0),
    ('Yams', 'yams', 1),
    ('Potatoes (Irish & Sweet)', 'potatoes-irish-sweet', 2),
    ('Other Roots', 'other-roots', 3)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'tubers-roots' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Fresh Fruits (Bananas, Pineapples, Mangoes, Avocados, Citrus, Dates)', 'fresh-fruits', 0),
    ('Dried Fruits', 'dried-fruits', 1),
    ('Frozen Fruits', 'frozen-fruits', 2)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'fruits' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Fresh Vegetables (Tomatoes, Onions, Cabbage, Leafy Greens, Peppers)', 'fresh-vegetables', 0),
    ('Frozen Vegetables', 'frozen-vegetables', 1)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'vegetables' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Groundnuts (Peanuts)', 'groundnuts-peanuts', 0),
    ('Cashew Nuts', 'cashew-nuts', 1),
    ('Sesame Seeds', 'sesame-seeds', 2),
    ('Shea Nuts', 'shea-nuts', 3),
    ('Other Nuts & Seeds', 'other-nuts-seeds', 4)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'nuts-seeds' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Pepper', 'pepper', 0),
    ('Ginger', 'ginger', 1),
    ('Turmeric', 'turmeric', 2),
    ('Garlic', 'garlic', 3),
    ('Other African Spices & Herbs', 'other-african-spices-herbs', 4)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'spices-herbs' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Coffee (Green, Roasted, Instant)', 'coffee-green-roasted-instant', 0),
    ('Tea', 'tea', 1),
    ('Cocoa Beans & Products (Butter, Powder, Chocolate)', 'cocoa-beans-products', 2)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'beverage-crops' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Bottled / Packaged Drinking Water (Still, Mineral, Purified)', 'bottled-packaged-drinking-water', 0),
    ('Bulk Water (10L–20L Jugs, Boxed Water, Large Containers)', 'bulk-water-jugs-boxed-large-containers', 1),
    ('Flavored / Enhanced Water', 'flavored-enhanced-water', 2),
    ('Carbonated Soft Drinks / Soda (Cola, Orange, Lemon, Apple, Mango, Pineapple Flavors; incl. Local & Global Brands)', 'carbonated-soft-drinks-soda', 3),
    ('Fruit Juices & Nectars (Mango, Pineapple, Orange, Citrus, Passion Fruit, Mixed; Fresh, Concentrated, Ready-to-Drink)', 'fruit-juices-nectars', 4),
    ('Energy Drinks (Carbonated & Non-Carbonated; incl. Local Brands & Functional Variants)', 'energy-drinks-non-alcoholic', 5),
    ('Other Non-Alcoholic Beverages (Sports/Isotonic Drinks, Flavored Teas, Malt Drinks)', 'other-non-alcoholic-beverages', 6)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'beverages' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Flour & Grain Products', 'flour-grain-products', 0),
    ('Sugar & Molasses', 'sugar-molasses', 1),
    ('Cooking Oils (Palm, Sunflower, Vegetable)', 'cooking-oils', 2),
    ('Packaged Foods & Snacks', 'packaged-foods-snacks', 3),
    ('Confectionery', 'confectionery', 4),
    ('Honey & Bee Products', 'honey-bee-products', 5)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'processed-foods' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Beef, Goat, Lamb, Poultry', 'beef-goat-lamb-poultry', 0)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'meat-poultry' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Milk, Cheese, Butter, Yogurt', 'milk-cheese-butter-yogurt', 0)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'dairy-products' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Freshwater (Tilapia, Nile Perch, Catfish)', 'seafood-freshwater', 0),
    ('Marine (Tuna, Sardines, Mackerel)', 'seafood-marine', 1),
    ('Shrimp, Lobster, Crab & Other Seafood', 'shrimp-lobster-crab-seafood', 2)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'seafood-fish' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'agriculture-food-products' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  -- ── 2. Minerals, Metals & Raw Materials ─────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Precious Metals', 'precious-metals', 0),
    ('Industrial Metals', 'industrial-metals', 1),
    ('Steel & Iron', 'steel-iron', 2),
    ('Scrap Materials', 'scrap-materials', 3),
    ('Rare Earth Elements & Other Minerals', 'rare-earth-other-minerals', 4)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'minerals-metals-raw-materials' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Gold', 'gold', 0),
    ('Silver', 'silver', 1),
    ('Platinum & Group Metals', 'platinum-group-metals', 2),
    ('Diamonds & Gemstones', 'diamonds-gemstones', 3)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'precious-metals' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'minerals-metals-raw-materials' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Copper', 'copper', 0),
    ('Cobalt', 'cobalt', 1),
    ('Aluminum / Bauxite', 'aluminum-bauxite', 2),
    ('Zinc', 'zinc', 3),
    ('Lead', 'lead', 4),
    ('Manganese', 'manganese', 5),
    ('Chromium', 'chromium', 6)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'industrial-metals' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'minerals-metals-raw-materials' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Iron Ore', 'iron-ore', 0),
    ('Steel Products', 'steel-products', 1)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'steel-iron' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'minerals-metals-raw-materials' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Scrap Metals', 'scrap-metals-under-scrap-materials', 0)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'scrap-materials' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'minerals-metals-raw-materials' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Phosphates & Fertilizers', 'phosphates-fertilizers', 0),
    ('Industrial Raw Materials (Salt, Sulfur)', 'industrial-raw-materials-salt-sulfur', 1)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'rare-earth-other-minerals' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'minerals-metals-raw-materials' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  -- ── 3. Energy & Fuels ───────────────────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Crude Oil & Petroleum', 'crude-oil-petroleum', 0),
    ('Refined Petroleum (Petrol, Diesel, Kerosene)', 'refined-petroleum', 1),
    ('Natural Gas', 'natural-gas', 2),
    ('Coal', 'coal', 3),
    ('Renewable Energy', 'renewable-energy', 4)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'energy-fuels' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 3, c2.id, true, v.sort_order
  from (values
    ('Solar Panels & Components', 'solar-panels-components', 0),
    ('Wind Equipment', 'wind-equipment', 1),
    ('Biofuels', 'biofuels', 2)
  ) as v(name, slug, sort_order)
  inner join public.product_categories c2 on c2.slug = 'renewable-energy' and c2.level = 2
  inner join public.product_categories c1 on c1.id = c2.parent_id and c1.slug = 'energy-fuels' and c1.level = 1
  where not exists (
    select 1 from public.product_categories x where x.level = 3 and x.parent_id = c2.id and x.slug = v.slug
  );

  -- ── 4. Chemicals & Industrial Supplies ──────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Industrial Chemicals', 'industrial-chemicals', 0),
    ('Fertilizers', 'fertilizers', 1),
    ('Petrochemicals', 'petrochemicals', 2),
    ('Paints & Coatings', 'paints-coatings', 3),
    ('Adhesives & Sealants', 'adhesives-sealants', 4),
    ('Cleaning Chemicals', 'cleaning-chemicals', 5),
    ('Plastic Raw Materials', 'plastic-raw-materials', 6)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'chemicals-industrial-supplies' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 5. Construction & Building Materials ───────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Cement & Concrete', 'cement-concrete', 0),
    ('Bricks & Blocks', 'bricks-blocks', 1),
    ('Roofing Materials', 'roofing-materials', 2),
    ('Tiles & Flooring', 'tiles-flooring', 3),
    ('Glass & Windows', 'glass-windows', 4),
    ('Plumbing Materials', 'plumbing-materials', 5),
    ('Electrical Fittings', 'electrical-fittings', 6),
    ('Doors & Windows', 'doors-windows', 7),
    ('Insulation Materials', 'insulation-materials', 8)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'construction-building-materials' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 6. Machinery & Industrial Equipment ─────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Agricultural Machinery & Tools', 'agricultural-machinery-tools', 0),
    ('Construction Machinery', 'construction-machinery', 1),
    ('Manufacturing Equipment', 'manufacturing-equipment', 2),
    ('Food Processing Machines', 'food-processing-machines', 3),
    ('Packaging Machines', 'packaging-machines', 4),
    ('Pumps & Compressors', 'pumps-compressors', 5),
    ('Tools & Hardware', 'tools-hardware', 6)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'machinery-industrial-equipment' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 7. Electronics & Electrical ─────────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Consumer Electronics (Phones, TVs, Audio)', 'consumer-electronics', 0),
    ('Computer Equipment (Laptops, Accessories)', 'computer-equipment', 1),
    ('Electrical Equipment (Cables, Switches, Transformers)', 'electrical-equipment', 2),
    ('Components (Semiconductors, Circuit Boards)', 'electronic-components', 3)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'electronics-electrical' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 8. Textiles, Apparel & Footwear ─────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Raw Materials (Cotton, Wool, Silk)', 'textile-raw-materials', 0),
    ('Fabrics (incl. African Prints: Ankara, Kitenge, Kente, Bogolan, Adire)', 'fabrics-african-prints', 1),
    ('Garments (Men''s, Women''s, Children''s, Traditional Wear)', 'garments-traditional-wear', 2),
    ('Footwear', 'footwear', 3),
    ('Fashion Accessories (Scarves, Bags)', 'fashion-accessories', 4)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'textiles-apparel-footwear' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 9. Home, Furniture & Interior ───────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Furniture (Office, Home, Wooden Handcrafted)', 'furniture', 0),
    ('Home Decor', 'home-decor', 1),
    ('Kitchenware', 'kitchenware', 2),
    ('Bedding & Mattresses', 'bedding-mattresses', 3),
    ('Lighting Fixtures', 'lighting-fixtures', 4)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'home-furniture-interior' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 10. Automotive & Transport ──────────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Vehicles (Cars, Trucks, Motorcycles)', 'vehicles', 0),
    ('Spare Parts', 'spare-parts', 1),
    ('Tires & Accessories', 'tires-accessories', 2)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'automotive-transport' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 11. Health, Pharma & Medical ────────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Medicines & Herbal Products', 'medicines-herbal-products', 0),
    ('Medical Equipment', 'medical-equipment', 1),
    ('Laboratory Supplies', 'laboratory-supplies', 2),
    ('PPE & Safety Gear', 'ppe-safety-gear', 3)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'health-pharma-medical' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 12. Beauty & Personal Care ──────────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Skincare (Shea Butter, Natural Oils)', 'skincare-shea-natural-oils', 0),
    ('Hair Products', 'hair-products', 1),
    ('Cosmetics', 'cosmetics', 2),
    ('Fragrances', 'fragrances', 3),
    ('Hygiene Products (Black Soap, etc.)', 'hygiene-products', 4)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'beauty-personal-care' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 13. Handicrafts & Cultural Products ─────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Art & Paintings', 'art-paintings', 0),
    ('Sculptures & Carvings', 'sculptures-carvings', 1),
    ('Beaded Products & Jewelry', 'beaded-products-jewelry', 2),
    ('Traditional Items (Masks, Baskets, Woven Goods, Pottery)', 'traditional-items', 3),
    ('Leather Goods', 'leather-goods', 4),
    ('Musical Instruments', 'musical-instruments', 5)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'handicrafts-cultural-products' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 14. Packaging & Printing ──────────────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Packaging Materials (Paper, Plastic)', 'packaging-materials', 0),
    ('Printing Services', 'printing-services', 1),
    ('Labels & Branding Materials', 'labels-branding-materials', 2)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'packaging-printing' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 15. Recycling & Environmental Products ──────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Scrap Metals', 'scrap-metals-recycling', 0),
    ('Recycled Plastics', 'recycled-plastics', 1),
    ('Waste Management Equipment', 'waste-management-equipment', 2),
    ('Eco-Friendly Products', 'eco-friendly-products', 3)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'recycling-environmental-products' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 16. Sports, Toys & Recreation ───────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Sports Equipment', 'sports-equipment', 0),
    ('Gym Equipment', 'gym-equipment', 1),
    ('Toys & Games', 'toys-games', 2)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'sports-toys-recreation' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 17. Office, School & Business Supplies ───────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Stationery', 'stationery', 0),
    ('Office Equipment', 'office-equipment', 1),
    ('School Supplies', 'school-supplies', 2)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'office-school-business-supplies' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 18. Logistics & Industrial Services ─────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Freight & Shipping', 'freight-shipping', 0),
    ('Warehousing', 'warehousing', 1),
    ('Customs Clearing', 'customs-clearing', 2),
    ('Distribution Services', 'distribution-services', 3)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'logistics-industrial-services' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 19. Digital & Professional Services ─────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Software Development', 'software-development', 0),
    ('Web & App Development', 'web-app-development', 1),
    ('IT Services', 'it-services', 2),
    ('Marketing Services', 'marketing-services', 3),
    ('Consulting Services', 'consulting-services', 4),
    ('Financial Services', 'financial-services', 5)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'digital-professional-services' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );

  -- ── 20. Raw Materials by Industry ───────────────────────────
  insert into public.product_categories (name, slug, level, parent_id, is_active, sort_order)
  select v.name, v.slug, 2, p.id, true, v.sort_order
  from (values
    ('Textile Raw Materials', 'textile-raw-materials-industry', 0),
    ('Construction Raw Materials', 'construction-raw-materials', 1),
    ('Chemical Raw Materials', 'chemical-raw-materials', 2),
    ('Food Processing Inputs', 'food-processing-inputs', 3)
  ) as v(name, slug, sort_order)
  cross join lateral (
    select id from public.product_categories
    where level = 1 and parent_id is null and slug = 'raw-materials-by-industry' limit 1
  ) p
  where not exists (
    select 1 from public.product_categories c where c.level = 2 and c.parent_id = p.id and c.slug = v.slug
  );
end $$;
