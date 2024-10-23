package com.example

import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import android.view.ViewTreeObserver.OnGlobalLayoutListener
import com.example.db.AppDatabase
import com.example.db.Module
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactDelegate
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.ReactSurfaceView
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant

class RNFastActivityDelegate(
  private val activity: ReactActivity,
  private val mainComponentName: String?,
  private val fabricEnabled: Boolean = false,
) : ReactActivityDelegate(activity, mainComponentName) {
  private val dbSelectResult = CompletableDeferred<Module?>()
  private var appProperties: Bundle? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    appProperties = savedInstanceState

    val mainComponentName = this.mainComponentName
    val launchOptions = this.composeLaunchOptions()
    if (Build.VERSION.SDK_INT >= 26 && this.isWideColorGamutEnabled) {
      activity.window.colorMode = ActivityInfo.COLOR_MODE_WIDE_COLOR_GAMUT
    };

    CoroutineScope(Dispatchers.IO).launch {
      val moduleRepository = AppDatabase.getModuleRepository(this@RNFastActivityDelegate.context)
      if (mainComponentName != null) {
        val module = moduleRepository.findAvailableModuleByName(mainComponentName)
        dbSelectResult.complete(module)
      } else {
        dbSelectResult.complete(null)
      }
    }

    val mReactDelegate: ReactDelegate = if (RNFastUpdateUtil.enabledBridgelessMode) {
      ReactDelegate(
        this.plainActivity,
        this.reactHost, mainComponentName, launchOptions
      )
    } else {
      ReactDelegate(
        this.plainActivity,
        this.reactNativeHost, mainComponentName, launchOptions,
        this.isFabricEnabled
      )
    }

    RNFastUpdateUtil.setPrivateProperty(this, "mReactDelegate", mReactDelegate, ReactActivityDelegate::class)

    if (mainComponentName != null) {
      fastUpdateLoadApp(mainComponentName)
    }
  }

  private fun fastUpdateLoadApp(appKey: String) {
    if (reactNativeHost.useDeveloperSupport) {
      this.loadApp(appKey)
    } else {
      if (RNFastUpdateUtil.enabledBridgelessMode) {
        fastUpdateLoadAppNewArchitecture()
      } else {
        fastUpdateLoadAppOldArchitecture()
      }
    }
  }

  private fun fastUpdateLoadAppNewArchitecture() {
    val reactHostImpl = reactHost as ReactHostImpl
    if (!RNFastUpdateUtil.getIsReactInstanceInitialized(reactHostImpl)) {
      CoroutineScope(Dispatchers.Main).launch {
        reactHostImpl.addReactInstanceEventListener(object :
          ReactInstanceEventListener {
          override fun onReactContextInitialized(context: ReactContext) {
            initView(context)
            reactHostImpl.removeReactInstanceEventListener(this)
          }
        })
        reactHost.start()
      }
    } else {
      val context = RNFastUpdateUtil.getReactContextByReactHostImpl(reactHostImpl)
      initView(context)
    }
  }

  @SuppressLint("VisibleForTests")
  private fun fastUpdateLoadAppOldArchitecture() {
    val manager = reactNativeHost.reactInstanceManager
    if (!manager.hasStartedCreatingInitialContext() || manager.currentReactContext == null) {
      if (manager.hasStartedCreatingInitialContext()) manager.destroy()
      manager.addReactInstanceEventListener(
        object : ReactInstanceEventListener {
          override fun onReactContextInitialized(context: ReactContext) {
            initView(context)
            manager.removeReactInstanceEventListener(this)
          }
        }
      )
      manager.createReactContextInBackground()
    } else {
      initView(manager.currentReactContext!!)
    }
  }

  private fun createFastUpdateSurface(context: ReactContext): ReactSurface {
    val reactSurface = this.reactHost.createSurface(context, mainComponentName!!, appProperties)!!
    return reactSurface
  }

  private fun createFastUpdateRootView(): ReactRootView {
    val reactRootView = ReactRootView(activity)
    reactRootView.setIsFabric(this.isFabricEnabled)
    reactRootView.setEventListener {
      onRenderComplete()
    }
    RNFastUpdateUtil.setPrivateProperty(reactRootView, "mReactInstanceManager", reactInstanceManager)
    RNFastUpdateUtil.setPrivateProperty(reactRootView, "mJSModuleName", mainComponentName)
    RNFastUpdateUtil.setPrivateProperty(reactRootView, "mAppProperties", appProperties)
    return reactRootView
  }

  private fun initView(context: ReactContext) {
    val activity = this.plainActivity
    if (RNFastUpdateUtil.isActivityAlive(activity)) {
      CoroutineScope(Dispatchers.Main).launch {
        val module = dbSelectResult.await()
        if (module != null) RNBundleLoader.loadBundle(context, module.filepath)
        if (RNFastUpdateUtil.enabledBridgelessMode) {
          val reactSurface = this@RNFastActivityDelegate.createFastUpdateSurface(context)
          reactSurface.start()
          activity?.setContentView(reactSurface.view)
        } else {
          val reactRootView = this@RNFastActivityDelegate.createFastUpdateRootView()
          activity?.setContentView(reactRootView)
        }
      }
    } else {
      throw IllegalStateException("Current Activity is not alive")
    }
  }

  private fun onRenderComplete() {}

  override fun isFabricEnabled(): Boolean = fabricEnabled
}
