export interface Currency {
  code: string;
  name: string;
  symbol: string;
  country: string;
}

export const CURRENCIES: Currency[] = [
  // Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', country: 'Egypt' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'Nigeria' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', country: 'Ghana' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'Sh', country: 'Kenya' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', country: 'Ethiopia' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'Sh', country: 'Tanzania' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'Sh', country: 'Uganda' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', country: 'Morocco' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', country: 'Tunisia' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', country: 'Algeria' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', country: 'Mauritius' },
  { code: 'XOF', name: 'West African Franc', symbol: 'Fr', country: 'Multiple West African Countries' },
  { code: 'XAF', name: 'Central African Franc', symbol: 'Fr', country: 'Multiple Central African Countries' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', country: 'Angola' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', country: 'Mozambique' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', country: 'Botswana' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: '$', country: 'Zimbabwe' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'Fr', country: 'Rwanda' },

  // Asia - East & Southeast
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', country: 'South Korea' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: '$', country: 'Taiwan' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', country: 'Hong Kong' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$', country: 'Singapore' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', country: 'Malaysia' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', country: 'Thailand' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', country: 'Philippines' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', country: 'Indonesia' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', country: 'Vietnam' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', country: 'Myanmar' },
  { code: 'LAK', name: 'Laotian Kip', symbol: '₭', country: 'Laos' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', country: 'Cambodia' },

  // Asia - South & Central
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', country: 'Pakistan' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', country: 'Bangladesh' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', country: 'Sri Lanka' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', country: 'Nepal' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', country: 'Maldives' },
  { code: 'BHT', name: 'Bhutanese Ngultrum', symbol: 'Nu.', country: 'Bhutan' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', country: 'Kazakhstan' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: "so'm", country: 'Uzbekistan' },
  { code: 'TJG', name: 'Tajikistani Somoni', symbol: 'ЅМ', country: 'Tajikistan' },
  { code: 'TKM', name: 'Turkmenistani Manat', symbol: 'm', country: 'Turkmenistan' },
  { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'с', country: 'Kyrgyzstan' },

  // Asia - Middle East
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', country: 'Saudi Arabia' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'United Arab Emirates' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', country: 'Qatar' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', country: 'Kuwait' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', country: 'Bahrain' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', country: 'Oman' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', country: 'Jordan' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', country: 'Lebanon' },
  { code: 'SYP', name: 'Syrian Pound', symbol: 'ل.س', country: 'Syria' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', country: 'Iraq' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', country: 'Iran' },
  { code: 'YER', name: 'Yemeni Rial', symbol: 'ر.ي', country: 'Yemen' },
  { code: 'AFS', name: 'Afghan Afghani', symbol: '؋', country: 'Afghanistan' },

  // Europe - EU
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union (19 countries)' },

  // Europe - Non-EU
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', country: 'Switzerland' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', country: 'Sweden' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', country: 'Norway' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', country: 'Denmark' },
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', country: 'Iceland' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', country: 'Russia' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', country: 'Ukraine' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', country: 'Belarus' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', country: 'Moldova' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', country: 'Romania' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', country: 'Bulgaria' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', country: 'Croatia' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', country: 'Serbia' },
  { code: 'BAM', name: 'Bosnia and Herzegovina Mark', symbol: 'KM', country: 'Bosnia and Herzegovina' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', country: 'North Macedonia' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', country: 'Albania' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', country: 'Turkey' },

  // Americas - North & Central
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', country: 'Canada' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', country: 'Mexico' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', country: 'Guatemala' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', country: 'Honduras' },
  { code: 'SVC', name: 'El Salvadoran Colón', symbol: '₡', country: 'El Salvador' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', country: 'Nicaragua' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', country: 'Costa Rica' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', country: 'Panama' },
  { code: 'BZD', name: 'Belizean Dollar', symbol: '$', country: 'Belize' },

  // Americas - South
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', country: 'Argentina' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', country: 'Chile' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', country: 'Colombia' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', country: 'Peru' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$', country: 'Uruguay' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.', country: 'Bolivia' },
  { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', country: 'Paraguay' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.S.', country: 'Venezuela' },
  { code: 'GYD', name: 'Guyanese Dollar', symbol: '$', country: 'Guyana' },
  { code: 'SRD', name: 'Surinamese Dollar', symbol: '$', country: 'Suriname' },

  // Americas - Caribbean
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', country: 'Dominican Republic' },
  { code: 'CUP', name: 'Cuban Peso', symbol: '₱', country: 'Cuba' },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: '$', country: 'Trinidad and Tobago' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: '$', country: 'Jamaica' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: '$', country: 'Barbados' },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: '$', country: 'Bahamas' },

  // Oceania
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', country: 'Australia' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', country: 'New Zealand' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: '$', country: 'Fiji' },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', country: 'Papua New Guinea' },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: '$', country: 'Solomon Islands' },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'Vt', country: 'Vanuatu' },
  { code: 'WST', name: 'Samoan Tala', symbol: 'T', country: 'Samoa' },
  { code: 'TOP', name: 'Tongan Paanga', symbol: 'T$', country: 'Tonga' },
  { code: 'KID', name: 'Kiribati Dollar', symbol: '$', country: 'Kiribati' },
  { code: 'XPF', name: 'CFP Franc', symbol: 'Fr', country: 'French Polynesia, Réunion' },
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(c => c.code === code);
};

export const formatCurrencyOption = (currency: Currency): string => {
  return `${currency.code} - ${currency.name}`;
};

export const getCurrenciesByRegion = (region: string): Currency[] => {
  const regionMap: Record<string, string[]> = {
    'Africa': ['ZAR', 'EGP', 'NGN', 'GHS', 'KES', 'ETB', 'TZS', 'UGX', 'MAD', 'TND', 'DZD', 'MUR', 'XOF', 'XAF', 'AOA', 'MZN', 'BWP', 'ZWL', 'RWF'],
    'Asia': ['CNY', 'JPY', 'KRW', 'TWD', 'HKD', 'SGD', 'MYR', 'THB', 'PHP', 'IDR', 'VND', 'MMK', 'LAK', 'KHR', 'INR', 'PKR', 'BDT', 'LKR', 'NPR', 'MVR', 'BHT', 'KZT', 'UZS', 'TJG', 'TKM', 'KGS', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'SYP', 'IQD', 'IRR', 'YER', 'AFS'],
    'Europe': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'ISK', 'RUB', 'UAH', 'BYN', 'MDL', 'RON', 'BGN', 'HRK', 'RSD', 'BAM', 'MKD', 'ALL', 'TRY'],
    'Americas': ['USD', 'CAD', 'MXN', 'GTQ', 'HNL', 'SVC', 'NIO', 'CRC', 'PAB', 'BZD', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'BOB', 'PYG', 'VES', 'GYD', 'SRD', 'DOP', 'CUP', 'TTD', 'JMD', 'BBD', 'BSD'],
    'Oceania': ['AUD', 'NZD', 'FJD', 'PGK', 'SBD', 'VUV', 'WST', 'TOP', 'KID', 'XPF'],
  };

  const codes = regionMap[region] || [];
  return CURRENCIES.filter(c => codes.includes(c.code));
};
