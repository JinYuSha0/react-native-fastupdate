import React, { createContext, useEffect, useContext } from 'react';
import { SmartAssets } from './smartAssets';
import { NativeConstants, hideSplashScreen } from './index';

const FastUpdateContext = createContext<INativeConstants>({
  serverHost: '',
  version: '',
});

export const FastUpdateProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  useEffect(() => {
    SmartAssets.init();
    hideSplashScreen();
  }, []);
  return (
    <FastUpdateContext.Provider value={NativeConstants}>
      {children}
    </FastUpdateContext.Provider>
  );
};

export const useFastUpdateContext = () => useContext(FastUpdateContext);
