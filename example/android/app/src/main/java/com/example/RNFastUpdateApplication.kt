package com.example

import android.app.Application
import com.example.db.AppDatabase
import com.example.db.Module
import com.example.db.ModuleDeserializer
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.google.gson.GsonBuilder
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.InputStreamReader

open class RNFastUpdateApplication : Application(), ReactApplication {
  open val showSplash = true

  val initialModule = CompletableDeferred<Boolean>()

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(RNFastUpdatePackage()) // fixme
        }

      override fun getBundleAssetName(): String {
        return "common.android.bundle"
      }

      override fun getJSExceptionHandler(): JSExceptionHandler {
        return JSExceptionHandler { e ->
          println("Exception handled: ${e.message}")
        }
      }

      override fun getJSMainModuleName(): String {
        return "index"
      }

      override fun getUseDeveloperSupport(): Boolean = false // BuildConfig.DEBUG

      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    initialModulesConfig()
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load(bridgelessEnabled = true)
    }
  }

  private fun initialModulesConfig() {
    CoroutineScope(Dispatchers.IO).launch {
      val moduleRepository = AppDatabase.getModuleRepository(this@RNFastUpdateApplication)
      val count = moduleRepository.countModulesByVersionCode()
      if (count == 0) {
        try {
          val assetManager = this@RNFastUpdateApplication.assets
          val inputStream = assetManager.open("modules.config.json")
          val bufferedReader = BufferedReader(InputStreamReader(inputStream))
          val jsonString = bufferedReader.use { it.readText() }
          val listType = object : TypeToken<List<Module>>() {}.type
          val gson = GsonBuilder()
            .registerTypeAdapter(Module::class.java, ModuleDeserializer())
            .create()
          val modules = gson.fromJson<List<Module>>(jsonString, listType)
          moduleRepository.insertModuleBatch(modules)
        } catch (ignore: Exception) { }
      }
      initialModule.complete(true)
    }
  }
}
