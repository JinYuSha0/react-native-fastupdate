import { NativeModules, Platform } from 'react-native';
export { FastUpdateProvider, useFastUpdateContext } from './provider';

const LINKING_ERROR =
  `The package 'react-native-fastupdate' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const FastUpdate = NativeModules.FastUpdate
  ? NativeModules.FastUpdate
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export const NativeConstants: INativeConstants =
  FastUpdate?.getConstants() ?? {};

export async function checkUpdate(): Promise<void> {
  return FastUpdate?.checkUpdate();
}

export async function openModule(
  moduleName: string,
  initialProps?: Record<string, any>
): Promise<void> {
  return FastUpdate?.openModule(moduleName, initialProps);
}

export function hideSplashScreen() {
  return FastUpdate?.hideSplashScreen();
}

export function getExternalFilesDir(): string {
  return FastUpdate?.getExternalFilesDir();
}
