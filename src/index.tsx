import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-fastupdate' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const Fastupdate = NativeModules.Fastupdate
  ? NativeModules.Fastupdate
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export const NativeConstants: INativeConstants =
  Fastupdate?.getConstants() ?? {};

export async function checkUpdate(): Promise<void> {
  return Fastupdate.checkUpdate();
}

export async function openModule(moduleName: string): Promise<void> {
  return Fastupdate.openModule(moduleName);
}

export function hideSplashScreen() {
  return Fastupdate.hideSplashScreen();
}

export function getExternalFilesDir(): string {
  return Fastupdate.hideSplashScreen();
}
