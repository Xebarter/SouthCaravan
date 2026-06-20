export type ServiceTaxonomySection = { title: string; items: string[] }

/** Mirrors `additems.txt` — categories and pickable service names. */
export const DEFAULT_SERVICES_TAXONOMY: ServiceTaxonomySection[] = [
  {
    title: 'Business & Professional Services',
    items: [
      'Accounting, Bookkeeping & Financial Reporting',
      'Auditing & Assurance',
      'Tax Advisory & Compliance',
      'Legal Advisory & Corporate Law',
      'Business Registration & Licensing',
      'Company Secretarial Services',
      'Business Consulting & Strategy',
      'Risk & Compliance Consulting',
      'Procurement & Supply Consulting',
    ],
  },
  {
    title: 'Technology & Digital Services',
    items: [
      'Website Design & Development',
      'Mobile App Development (Android & iOS)',
      'Custom Software Development',
      'E-commerce Development & Management',
      'IT Support & Helpdesk Services',
      'Network Setup & Administration',
      'Cybersecurity & Data Protection',
      'Cloud Computing & DevOps',
      'Data Analytics & AI Solutions',
      'System Integration & API Development',
    ],
  },
  {
    title: 'Marketing & Creative Services',
    items: [
      'Digital Marketing (SEO, SEM, Social Media Ads)',
      'Social Media Management',
      'Branding & Identity Design',
      'Graphic Design (Logos, Flyers, UI/UX)',
      'Content Creation & Copywriting',
      'Video Production & Editing',
      'Photography Services',
      'Public Relations (PR)',
      'Influencer & Campaign Management',
      'Market Research & Consumer Insights',
    ],
  },
  {
    title: 'Logistics & Supply Chain',
    items: [
      'Transportation & Haulage',
      'Fleet Management',
      'Warehousing & Inventory Management',
      'Freight Forwarding (Air, Sea, Land)',
      'Customs Clearing & Documentation',
      'Last-Mile Delivery & Courier Services',
      'Packaging & Distribution',
      'Cold Chain Logistics',
      'Import & Export Consultancy',
    ],
  },
  {
    title: 'Construction & Engineering',
    items: [
      'Building Construction (Residential & Commercial)',
      'Civil Engineering Projects',
      'Architectural Design & Planning',
      'Quantity Surveying',
      'Electrical Installation & Maintenance',
      'Plumbing & Water Systems',
      'HVAC (Heating, Ventilation, Air Conditioning)',
      'Interior Design & Fit-outs',
      'Renovation & Property Maintenance',
      'Surveying & Land Mapping',
    ],
  },
  {
    title: 'Human Resources & Training',
    items: [
      'Recruitment & Talent Acquisition',
      'Temporary & Outsourced Staffing',
      'HR Consulting & Policy Development',
      'Payroll Processing & Management',
      'Employee Training & Development',
      'Corporate Workshops & Seminars',
      'Performance Management Systems',
      'Organizational Development',
      'Occupational Health & Safety Training',
    ],
  },
  {
    title: 'Financial Services',
    items: [
      'Insurance Brokerage & Advisory',
      'Financial Planning & Advisory',
      'Investment Consulting',
      'Wealth Management',
      'Loan Facilitation & Credit Services',
      'Microfinance Services',
      'Payment Processing & Fintech Solutions',
      'Asset Financing & Leasing',
      'Grant Writing & Fundraising Support',
    ],
  },
  {
    title: 'Sales & Customer Support',
    items: [
      'Sales Outsourcing & Field Sales Teams',
      'Lead Generation & Prospecting',
      'Telemarketing Services',
      'Customer Support (Call Centers, Live Chat)',
      'CRM Setup & Management',
      'After-Sales Support Services',
      'Market Expansion & Distribution Support',
    ],
  },
  {
    title: 'Facility & Operational Services',
    items: [
      'Cleaning & Janitorial Services',
      'Security & Guard Services',
      'Pest Control & Fumigation',
      'Waste Collection & Recycling',
      'Landscaping & Gardening',
      'Building & Office Maintenance',
      'Office Setup & Space Management',
      'Utilities Management (Water, Power)',
      'Laundry & Office Hygiene Services',
    ],
  },
  {
    title: 'Hospitality, Events & Lifestyle Services',
    items: [
      'Event Planning & Management',
      'Catering & Corporate Catering',
      'Conference & Exhibition Services',
      'Travel Management & Corporate Travel',
      'Hotel & Accommodation Booking',
      'Car Hire & Transport Services',
      'Corporate Gifting & Merchandise',
    ],
  },
  {
    title: 'Agriculture & Specialized Services',
    items: [
      'Agricultural Consultancy & Advisory',
      'Farm Management Services',
      'Irrigation System Design & Installation',
      'Agro-input Supply & Distribution',
      'Veterinary Services',
      'Agribusiness Training',
      'Produce Handling & Post-Harvest Services',
      'Food Processing & Packaging',
      'Environmental & Sustainability Consulting',
    ],
  },
]

export function serviceCatalogKey(category: string, item: string) {
  return `${category.trim().toLowerCase()}|||${item.trim().toLowerCase()}`
}

export function filterTaxonomy(
  sections: ServiceTaxonomySection[],
  query: string,
): ServiceTaxonomySection[] {
  const q = query.trim().toLowerCase()
  if (!q) return sections
  return sections
    .map((s) => ({
      title: s.title,
      items: s.items.filter(
        (item) =>
          item.toLowerCase().includes(q) || s.title.toLowerCase().includes(q),
      ),
    }))
    .filter((s) => s.items.length > 0)
}
