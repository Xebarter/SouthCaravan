import { useState, useCallback } from 'react';
import { CURRENCIES, Currency, getCurrencyByCode } from '@/lib/currencies';
import { detectUserCurrencyCode } from '@/lib/currency-detection';

export const useCurrency = (initialCurrency: string = 'AUTO') => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(initialCurrency);
  
  const effectiveCurrencyCode =
    selectedCurrency === 'AUTO'
      ? detectUserCurrencyCode(typeof navigator !== 'undefined' ? navigator.language : undefined, 'USD')
      : selectedCurrency;

  const currency = getCurrencyByCode(effectiveCurrencyCode);

  const formatPrice = useCallback((amount: number, includeSymbol = true) => {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    if (includeSymbol && currency) {
      return `${currency.symbol}${formatted}`;
    }
    return formatted;
  }, [currency]);

  const convertCurrency = useCallback((amount: number, fromCode: string, toCode: string) => {
    // This is a placeholder. In production, use a real exchange rate API
    const exchangeRates: Record<string, number> = {
      'USD': 1,
      'EUR': 0.92,
      'GBP': 0.79,
      'JPY': 149.50,
      'AUD': 1.53,
      'CAD': 1.36,
      'CHF': 0.88,
      'CNY': 7.24,
      'INR': 83.12,
      'BRL': 4.97,
    };
    
    const fromRate = exchangeRates[fromCode] || 1;
    const toRate = exchangeRates[toCode] || 1;
    
    return (amount / fromRate) * toRate;
  }, []);

  return {
    selectedCurrency: effectiveCurrencyCode,
    setSelectedCurrency,
    currency,
    formatPrice,
    convertCurrency,
    allCurrencies: CURRENCIES,
  };
};
