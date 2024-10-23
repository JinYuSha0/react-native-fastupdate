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
    if ((application as RNFastUpdateApplication).showSplash) {
      RNFastUpdateModuleImpl.showSplashScreen(this)
    }
    super.onCreate(savedInstanceState)
  }

  override fun getMainComponentName(): String? {
    return intent.getStringExtra("moduleName")
  }
}
