package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class GameBridgeTest {

  @Test
  fun `prefs roundtrip stores and returns saved json`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val bridge = GameBridge(context)

    assertNull(bridge.getPref("missing_key"))

    val sampleSave = """{"gold":150,"crystals":8,"activeEvoForm":"glow_eyes"}"""
    bridge.setPref("snake_save_v1", sampleSave)

    assertEquals(sampleSave, bridge.getPref("snake_save_v1"))
  }

  @Test
  fun `vibrate handles single duration waveform and malformed payloads safely`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val bridge = GameBridge(context)

    bridge.vibrate("25")
    bridge.vibrate("[15, 25, 15]")
    bridge.vibrate("[]")
    bridge.vibrate("not-a-number")
    bridge.vibrate("")
  }

  @Test
  fun `bundled snake html asset exists and contains game markers`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val html = context.assets.open("snake.html").bufferedReader().use { it.readText() }

    assertTrue(html.contains("SNAKE: PIXEL RUSH"))
    assertTrue(html.contains("generateForestStage"))
    assertTrue(html.contains("door_open"))
    assertTrue(html.contains("startStage"))
    assertTrue(html.contains("validateReachable"))
  }
}
