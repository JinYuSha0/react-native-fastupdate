package com.example.splash

import android.app.Dialog
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.ProgressBar
import com.example.R

class RNFastUpdateSplashDialog(context: Context, private val layoutResId: Int = R.layout.splash_dialog_layout) : Dialog(context, R.style.SplashTheme) {
  private var progressBar: ProgressBar? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
    window?.addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS)
    if (Build.VERSION.SDK_INT >= 28) {
      val layoutParams = window?.attributes
      layoutParams?.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
      window?.attributes = layoutParams
    }

    setContentView(layoutResId)
    setCancelable(false)

    progressBar = findViewById(R.id.progress)
  }

  fun setProgress(progress: Int) {
    if (progressBar?.visibility != View.VISIBLE) {
      progressBar?.visibility = View.VISIBLE
    }

    val progressCoerce = progress.coerceIn(0, 100)
    if (Build.VERSION.SDK_INT >= 24) {
      progressBar?.setProgress(progressCoerce, true)
    } else {
      progressBar?.progress = progressCoerce
    }
  }
}
