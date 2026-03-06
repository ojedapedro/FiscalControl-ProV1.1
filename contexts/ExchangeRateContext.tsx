import React from 'react';

interface ExchangeRateContextType {
  exchangeRate: number;
}

const ExchangeRateContext = React.createContext<ExchangeRateContextType>({ exchangeRate: 1 });

export const useExchangeRate = () => React.useContext(ExchangeRateContext);

export const ExchangeRateProvider: React.FC<{ exchangeRate: number; children: React.ReactNode }> = ({ exchangeRate, children }) => {
  return (
    <ExchangeRateContext.Provider value={{ exchangeRate }}>
      {children}
    </ExchangeRateContext.Provider>
  );
};
