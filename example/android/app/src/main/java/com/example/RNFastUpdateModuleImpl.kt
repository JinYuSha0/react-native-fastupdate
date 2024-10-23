package com.example

import android.app.Activity
import android.app.Dialog
import android.content.Intent
import com.example.splash.RNFastUpdateSplashDialog
import com.facebook.react.bridge.ReactApplicationContext
import java.lang.ref.WeakReference

object RNFastUpdateModuleImpl {
  private var mActivity: WeakReference<Activity> = WeakReference(null)
  private var mDialog: WeakReference<RNFastUpdateSplashDialog> = WeakReference(null)

  fun checkUpdate() {
    mDialog.get()?.setProgress(50)
  }

  fun openModule(reactContext: ReactApplicationContext, moduleName: String) {
    val activity = reactContext.currentActivity
    if (RNFastUpdateUtil.isActivityAlive(activity)) {
      val intent = Intent(reactContext, RNFastUpdateSingleActivity::class.java)
      intent.putExtra("moduleName", moduleName)
      activity?.startActivity(intent)
    }
  }

  fun showSplashScreen(activity: Activity, layoutResId: Int = R.layout.splash_dialog_layout) {
    if (!RNFastUpdateUtil.isActivityAlive(activity) || mDialog.get()?.isShowing == true) return
    val dialog = RNFastUpdateSplashDialog(activity, layoutResId)
    dialog.show()
    mActivity = WeakReference(activity)
    mDialog = WeakReference(dialog)
  }

  fun hideSplashScreen() {
    val activity = mActivity.get()
    val dialog = mDialog.get()
    if (!RNFastUpdateUtil.isActivityAlive(activity) || dialog?.isShowing != true) return
    activity?.runOnUiThread {
      dialog.dismiss()
    }
  }
}
