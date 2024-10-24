import { Platform } from 'react-native';
import { getExternalFilesDir } from './index';
// @ts-ignore
import { setCustomSourceTransformer } from 'react-native/Libraries/Image/resolveAssetSource';

class SmartAssetsImpl {
  private externalFilesDir: string | null;

  constructor() {
    this.externalFilesDir = getExternalFilesDir();
  }

  init() {
    setCustomSourceTransformer((resolver: any) => {
      if (resolver.isLoadedFromServer()) {
        return resolver.assetServerURL();
      }

      if (Platform.OS === 'android') {
        if (resolver.asset.package && this.externalFilesDir) {
          resolver.jsbundleUrl = `file://${this.externalFilesDir}${resolver.asset.package}`;
          return resolver.drawableFolderInBundle();
        } else {
          return resolver.resourceIdentifierWithoutScale();
        }
      } else {
        return resolver.scaledAssetURLNearBundle();
      }
    });
  }
}

export const SmartAssets = new SmartAssetsImpl();
