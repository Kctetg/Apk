package com.example

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import org.json.JSONArray

class GameBridge(private val context: Context) {

  private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  @JavascriptInterface
  fun getPref(key: String): String? {
    return prefs.getString(key, null)
  }

  @JavascriptInterface
  fun setPref(key: String, value: String) {
    prefs.edit().putString(key, value).apply()
  }

  @JavascriptInterface
  fun vibrate(jsonPayload: String) {
    val vibrator = getVibrator() ?: return
    if (!vibrator.hasVibrator()) return

    val trimmed = jsonPayload.trim()
    try {
      if (trimmed.startsWith("[")) {
        val array = JSONArray(trimmed)
        if (array.length() == 0) return
        val timings = LongArray(array.length() + 1)
        timings[0] = 0L
        for (i in 0 until array.length()) {
          timings[i + 1] = array.optLong(i, 0L).coerceAtLeast(0L)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
        } else {
          @Suppress("DEPRECATION")
          vibrator.vibrate(timings, -1)
        }
      } else {
        val ms = trimmed.toDoubleOrNull()?.toLong()?.coerceAtLeast(1L) ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          vibrator.vibrate(
            VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE)
          )
        } else {
          @Suppress("DEPRECATION")
          vibrator.vibrate(ms)
        }
      }
    } catch (_: Exception) {
      // Ignore malformed vibration payloads
    }
  }

  private fun getVibrator(): Vibrator? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
      manager?.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
  }

  private companion object {
    const val PREFS_NAME = "neon_snake_prefs"
  }
}
