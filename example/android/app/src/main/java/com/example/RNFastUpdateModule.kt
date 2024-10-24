package com.example

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RNFastUpdateModule(private val reactContext: ReactApplicationContext, private val serverHost: String) : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "FastUpdate"

  override fun getConstants(): MutableMap<String, Any> {
    val constants: MutableMap<String, Any> = mutableMapOf()
    constants["serverHost"] = serverHost
    constants["version"] = RNFastUpdateDefaultConfig.version
    return constants
  }

  @ReactMethod
  fun checkUpdate(promise: Promise) {
    RNFastUpdateModuleImpl.checkUpdate()
  }

  @ReactMethod
  fun openModule(moduleName: String, promise: Promise) {
    try {
      RNFastUpdateModuleImpl.openModule(reactContext, moduleName)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun hideSplashScreen() {
    RNFastUpdateModuleImpl.hideSplashScreen()
  }
}
