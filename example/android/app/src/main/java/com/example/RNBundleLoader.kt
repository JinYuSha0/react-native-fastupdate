package com.example

import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactContext

object RNBundleLoader {
  private val loadedBundle: MutableSet<String> = mutableSetOf()

  fun loadBundle(context: ReactContext, filepath: String, isSync: Boolean = false) {
    if (loadedBundle.contains(filepath)) return
    if (filepath.startsWith("assets://")) {
      loadScriptFromAsset(context, filepath, isSync);
    } else if (filepath.startsWith("file://")) {
      loadScriptFromFile(context, filepath, isSync);
    }
    loadedBundle.add(filepath)
  }

  private fun loadScriptFromAsset(context: ReactContext, filepath: String, isSync: Boolean) {
    if (RNFastUpdateUtil.enabledBridgelessMode) {
      bridgelessArchitectureLoadBundle(context, JSBundleLoader.createAssetLoader(context, filepath, isSync))
    } else {
      context.catalystInstance.loadScriptFromAssets(context.assets, filepath, isSync)
    }
  }

  private fun loadScriptFromFile(context: ReactContext, filepath: String, isSync: Boolean) {
    val realFilepath = RNFastUpdateUtil.getFileAbsolutePath(context, filepath)
    if (RNFastUpdateUtil.enabledBridgelessMode) {
      bridgelessArchitectureLoadBundle(context, JSBundleLoader.createFileLoader(realFilepath, realFilepath, isSync))
    } else {
      context.catalystInstance.loadScriptFromFile(realFilepath, realFilepath, isSync)
    }
  }

  private fun bridgelessArchitectureLoadBundle(context: ReactContext, bundleLoader: JSBundleLoader) {
    RNFastUpdateUtil.getReactInstanceByReactContext(context).loadJSBundle(bundleLoader)
  }
}
