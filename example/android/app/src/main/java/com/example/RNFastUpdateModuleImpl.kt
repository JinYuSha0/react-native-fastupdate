package com.example

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext

object RNFastUpdateModuleImpl {
  fun checkUpdate() {}

  fun openModule(reactContext: ReactApplicationContext, moduleName: String) {
    val activity = reactContext.currentActivity
    if (RNFastUpdateUtil.isActivityAlive(activity)) {
      val intent = Intent(reactContext, RNFastUpdateSingleActivity::class.java)
      intent.putExtra("moduleName", moduleName)
      activity!!.startActivity(intent)
    }
  }


}
