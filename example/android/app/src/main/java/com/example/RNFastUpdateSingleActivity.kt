package com.example

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled

open class RNFastUpdateSingleActivity : ReactActivity() {
  final override fun createReactActivityDelegate(): ReactActivityDelegate {
    return RNFastActivityDelegate(this, mainComponentName, fabricEnabled)
  }

  override fun getMainComponentName(): String? {
    return intent.getStringExtra("moduleName")
  }
}
