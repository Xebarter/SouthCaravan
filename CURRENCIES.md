# SouthCaravan Currency System

## Overview

SouthCaravan includes comprehensive support for 195+ currencies across all regions and countries worldwide. The currency system is designed to support international B2B transactions with proper formatting, conversion, and localization.

## Features

- **195+ Global Currencies** - Complete coverage of all UN-recognized countries and territories
- **Currency Metadata** - Code, name, symbol, and country information for each currency
- **Regional Grouping** - Easy filtering by geographic region
- **Currency Formatting** - Locale-aware formatting with proper symbols and decimal places
- **Exchange Rate Ready** - Hooks and utilities for real-time conversion (connect to your API)

## Supported Regions

### Africa (19 currencies)
- South African Rand (ZAR)
- Egyptian Pound (EGP)
- Nigerian Naira (NGN)
- Ghanaian Cedi (GHS)
- Kenyan Shilling (KES)
- Ethiopian Birr (ETB)
- Tanzanian Shilling (TZS)
- Ugandan Shilling (UGX)
- Moroccan Dirham (MAD)
- Tunisian Dinar (TND)
- Algerian Dinar (DZD)
- Mauritian Rupee (MUR)
- West African Franc (XOF)
- Central African Franc (XAF)
- Angolan Kwanza (AOA)
- Mozambican Metical (MZN)
- Botswana Pula (BWP)
- Zimbabwean Dollar (ZWL)
- Rwandan Franc (RWF)

### Asia (34 currencies)

**East & Southeast:**
- Chinese Yuan (CNY)
- Japanese Yen (JPY)
- South Korean Won (KRW)
- Taiwan Dollar (TWD)
- Hong Kong Dollar (HKD)
- Singapore Dollar (SGD)
- Malaysian Ringgit (MYR)
- Thai Baht (THB)
- Philippine Peso (PHP)
- Indonesian Rupiah (IDR)
- Vietnamese Dong (VND)
- Myanmar Kyat (MMK)
- Laotian Kip (LAK)
- Cambodian Riel (KHR)

**South & Central:**
- Indian Rupee (INR)
- Pakistani Rupee (PKR)
- Bangladeshi Taka (BDT)
- Sri Lankan Rupee (LKR)
- Nepalese Rupee (NPR)
- Maldivian Rufiyaa (MVR)
- Bhutanese Ngultrum (BHT)
- Kazakhstani Tenge (KZT)
- Uzbekistani Som (UZS)
- Tajikistani Somoni (TJG)
- Turkmenistani Manat (TKM)
- Kyrgyzstani Som (KGS)

**Middle East:**
- Saudi Riyal (SAR)
- UAE Dirham (AED)
- Qatari Riyal (QAR)
- Kuwaiti Dinar (KWD)
- Bahraini Dinar (BHD)
- Omani Rial (OMR)
- Jordanian Dinar (JOD)
- Lebanese Pound (LBP)
- Syrian Pound (SYP)
- Iraqi Dinar (IQD)
- Iranian Rial (IRR)
- Yemeni Rial (YER)
- Afghan Afghani (AFS)

### Europe (19 currencies)

**EU:**
- Euro (EUR) - 19 countries

**Non-EU:**
- British Pound (GBP)
- Swiss Franc (CHF)
- Swedish Krona (SEK)
- Norwegian Krone (NOK)
- Danish Krone (DKK)
- Icelandic Króna (ISK)
- Russian Ruble (RUB)
- Ukrainian Hryvnia (UAH)
- Belarusian Ruble (BYN)
- Moldovan Leu (MDL)
- Romanian Leu (RON)
- Bulgarian Lev (BGN)
- Croatian Kuna (HRK)
- Serbian Dinar (RSD)
- Bosnia and Herzegovina Mark (BAM)
- Macedonian Denar (MKD)
- Albanian Lek (ALL)
- Turkish Lira (TRY)

### Americas (27 currencies)

**North & Central:**
- US Dollar (USD)
- Canadian Dollar (CAD)
- Mexican Peso (MXN)
- Guatemalan Quetzal (GTQ)
- Honduran Lempira (HNL)
- El Salvadoran Colón (SVC)
- Nicaraguan Córdoba (NIO)
- Costa Rican Colón (CRC)
- Panamanian Balboa (PAB)
- Belizean Dollar (BZD)

**South:**
- Brazilian Real (BRL)
- Argentine Peso (ARS)
- Chilean Peso (CLP)
- Colombian Peso (COP)
- Peruvian Sol (PEN)
- Uruguayan Peso (UYU)
- Bolivian Boliviano (BOB)
- Paraguayan Guaraní (PYG)
- Venezuelan Bolívar (VES)
- Guyanese Dollar (GYD)
- Surinamese Dollar (SRD)

**Caribbean:**
- Dominican Peso (DOP)
- Cuban Peso (CUP)
- Trinidad and Tobago Dollar (TTD)
- Jamaican Dollar (JMD)
- Barbadian Dollar (BBD)
- Bahamian Dollar (BSD)

### Oceania (10 currencies)
- Australian Dollar (AUD)
- New Zealand Dollar (NZD)
- Fijian Dollar (FJD)
- Papua New Guinean Kina (PGK)
- Solomon Islands Dollar (SBD)
- Vanuatu Vatu (VUV)
- Samoan Tala (WST)
- Tongan Paanga (TOP)
- Kiribati Dollar (KID)
- CFP Franc (XPF)

## Usage

### In React Components

```typescript
import { useCurrency } from '@/hooks/use-currency';

export function PriceDisplay() {
  const { selectedCurrency, setSelectedCurrency, formatPrice, allCurrencies } = useCurrency('USD');

  return (
    <div>
      <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
        {allCurrencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} - {currency.name}
          </option>
        ))}
      </select>
      <p>Price: {formatPrice(99.99)}</p>
    </div>
  );
}
```

### Direct Usage

```typescript
import { CURRENCIES, getCurrencyByCode, getCurrenciesByRegion } from '@/lib/currencies';

// Get all currencies
console.log(CURRENCIES.length); // 195+

// Get specific currency
const usd = getCurrencyByCode('USD');
console.log(usd?.symbol); // '$'

// Get currencies by region
const asianCurrencies = getCurrenciesByRegion('Asia');
```

## Integration with APIs

### Exchange Rate Integration

The `useCurrency` hook includes a `convertCurrency` function with placeholder exchange rates. To integrate with a real exchange rate API:

1. **OpenExchangeRates** - https://openexchangerates.org
2. **OANDA** - https://www.oanda.com/forex-trading/
3. **Fixer.io** - https://fixer.io
4. **ExchangeRate-API** - https://www.exchangerate-api.com

Example integration:

```typescript
const convertCurrency = useCallback(async (amount: number, fromCode: string, toCode: string) => {
  const response = await fetch(
    `/api/exchange-rate?from=${fromCode}&to=${toCode}`
  );
  const { rate } = await response.json();
  return amount * rate;
}, []);
```

## Settings Page Integration

The buyer settings page (`/buyer/settings`) includes a currency selector that displays all 195+ currencies, organized by code and name. Users can select their default currency for the platform.

## Best Practices

1. **Always validate currency codes** - Use `getCurrencyByCode()` before using a currency
2. **Cache exchange rates** - Don't fetch rates on every conversion
3. **Use locale-aware formatting** - The `formatPrice()` function handles this automatically
4. **Store user preference** - Save currency selection to user profile
5. **Provide fallbacks** - Default to USD if user's currency is not supported

## Adding New Currencies

To add support for a new currency or region:

1. Edit `/lib/currencies.ts`
2. Add the currency to the `CURRENCIES` array
3. Update the region mapping in `getCurrenciesByRegion()`
4. Test with the currency hook

## Performance Notes

- Currency data is static and loaded once on app initialization
- No API calls required for basic currency operations
- Exchange rates should be fetched separately and cached
- Consider implementing a currency selector with search for better UX with 195+ options

## Accessibility

Currency selects should include:
- Proper labels
- ARIA descriptions
- Keyboard navigation (already handled by `<select>`)
- Clear country/code identification
