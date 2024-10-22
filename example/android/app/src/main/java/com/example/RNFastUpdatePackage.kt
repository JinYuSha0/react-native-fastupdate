package com.example

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager


class RNFastUpdatePackage(private val serverHost: String = RNFastUpdateDefaultConfig.serverHost) : ReactPackage {
  override fun createNativeModules(reactApplicationContext: ReactApplicationContext): List<NativeModule> {
    return setOf<NativeModule>(RNFastUpdateModule(reactApplicationContext, serverHost)).toList()
  }

  override fun createViewManagers(reactApplicationContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
