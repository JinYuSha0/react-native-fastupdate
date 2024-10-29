package com.example

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled

open class RNFastUpdateSingleActivity : ReactActivity() {
  final override fun createReactActivityDelegate(): ReactActivityDelegate {
    return RNFastActivityDelegate(this, mainComponentName, fabricEnabled)
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    val noSplash = intent.getBooleanExtra("noSplash",false)
    val moduleName = intent.getStringExtra("moduleName")
    val initialProps = intent.getBundleExtra("initialProps")
    if ((application as RNFastUpdateApplication).showSplash && !noSplash) {
      RNFastUpdateModuleImpl.showSplashScreen(this)
    }
    if (mainComponentName == null) {
      if (moduleName != null) {
         (reactActivityDelegate as RNFastActivityDelegate).apply {
           setAppProperties(initialProps)
           mainComponentName = moduleName
         }
      } else {
        finish()
      }
    }
    super.onCreate(savedInstanceState)
  }
}
