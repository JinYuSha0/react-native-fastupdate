package com.example

import com.facebook.react.bridge.JSBundleLoader

class RNFastUpdateReactInstance(reactInstance: Any) {
  private var mReactInstance: Any = reactInstance

  fun loadJSBundle(bundleLoader: JSBundleLoader) {
    RNFastUpdateUtil.callMethod(mReactInstance, "loadJSBundle", bundleLoader)
  }
}
