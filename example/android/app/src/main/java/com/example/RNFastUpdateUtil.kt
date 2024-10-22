package com.example

import android.app.Activity
import android.content.Context
import com.facebook.react.bridge.ReactContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.runtime.ReactHostImpl
import kotlin.reflect.KClass
import kotlin.reflect.KMutableProperty1
import kotlin.reflect.KProperty1
import kotlin.reflect.full.declaredMemberFunctions
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.jvm.isAccessible

object RNFastUpdateUtil {
  val enabledBridgelessMode = ReactNativeFeatureFlags.useNativeViewConfigsInBridgelessMode()

  fun <T: Any, R> setPrivateProperty(instance: T, propertyName: String, value: R, clazz: KClass<*>? = null) {
    val property = (clazz ?: instance::class).declaredMemberProperties
      .find { it.name == propertyName }

    property?.let {
      it.isAccessible = true
      @Suppress("UNCHECKED_CAST")
      (it as KMutableProperty1<T, R>).set(instance, value)
    } ?: throw NoSuchFieldException("Property $propertyName not found.")
  }

  fun <T: Any, R> getPrivateProperty(instance: T, propertyName: String, clazz: KClass<*>? = null): R? {
    val property = (clazz ?: instance::class).declaredMemberProperties
      .find { it.name == propertyName }

    property?.let {
      it.isAccessible = true
      @Suppress("UNCHECKED_CAST")
      return (it as KProperty1<T, R>).get(instance)
    } ?: throw NoSuchFieldException("Property $propertyName not found.")
  }

  fun callMethod(instance: Any, methodName: String, vararg args: Any?): Any? {
    val method = instance::class.declaredMemberFunctions
      .find { it.name == methodName }

    method?.let {
      it.isAccessible = true
      return it.call(instance, *args)
    } ?: throw NoSuchMethodException("Method $methodName not found in class ${instance::class.simpleName}.")
  }

  fun isActivityAlive(activity: Activity?): Boolean {
    return activity != null && !activity.isFinishing && !activity.isDestroyed
  }

  fun getIsReactInstanceInitialized(reactHostImpl: ReactHostImpl): Boolean {
    val reactInstance = getPrivateProperty<Any, Any>(reactHostImpl, "mReactInstance")
    return reactInstance != null
  }

  fun getReactInstanceByReactContext(context: ReactContext): RNFastUpdateReactInstance {
    val reactHostImpl: ReactHostImpl? = getPrivateProperty<Any, ReactHostImpl>(context, "mReactHost")
    reactHostImpl?.let {
      val reactInstance = getPrivateProperty<Any, Any>(reactHostImpl, "mReactInstance")
      reactInstance?.let {
        return RNFastUpdateReactInstance(reactInstance)
      } ?: throw NoSuchFieldException("Property reactInstance not found.")
    } ?: throw NoSuchFieldException("Property reactHostImpl not found.")
  }

  fun getReactContextByReactHostImpl(reactHostImpl: ReactHostImpl): ReactContext {
    val reactInstance = getPrivateProperty<Any, Any>(reactHostImpl, "mReactInstance")
    reactInstance?.let {
      val reactContext = getPrivateProperty<Any, ReactContext>(reactInstance, "mBridgelessReactContext")
      reactContext?.let {
        return reactContext
      }  ?: throw NoSuchFieldException("Property reactContext not found.")
    } ?: throw NoSuchFieldException("Property reactInstance not found.")
  }

  fun getFileAbsolutePath(context: Context, filepath: String): String {
    val absolutePath = context.getExternalFilesDir(null)?.absolutePath ?: throw Exception("Unable to get absolutePath")
    return filepath.replace("file://", "$absolutePath/")
  }
}
