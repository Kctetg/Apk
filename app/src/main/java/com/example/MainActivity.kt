package com.example

import android.annotation.SuppressLint
import android.graphics.Color as AndroidColor
import android.os.Bundle
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.example.ui.theme.NeonSnakeTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge(
      statusBarStyle = SystemBarStyle.dark(AndroidColor.TRANSPARENT),
      navigationBarStyle = SystemBarStyle.dark(AndroidColor.TRANSPARENT),
    )
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    setContent {
      NeonSnakeTheme {
        NeonSnakeScreen(onExitApp = { finish() })
      }
    }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun NeonSnakeScreen(onExitApp: () -> Unit) {
  val context = LocalContext.current
  val lifecycleOwner = LocalLifecycleOwner.current
  var isPageReady by remember { mutableStateOf(false) }
  var showExitDialog by remember { mutableStateOf(false) }

  val webView = remember {
    WebView(context).apply {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      )
      setBackgroundColor(AndroidColor.parseColor("#050807"))
      isVerticalScrollBarEnabled = false
      isHorizontalScrollBarEnabled = false
      overScrollMode = WebView.OVER_SCROLL_NEVER

      settings.apply {
        javaScriptEnabled = true
        domStorageEnabled = true
        useWideViewPort = true
        loadWithOverviewMode = true
        setSupportZoom(false)
        builtInZoomControls = false
        displayZoomControls = false
        mediaPlaybackRequiresUserGesture = false
        allowFileAccess = false
        cacheMode = WebSettings.LOAD_DEFAULT
      }

      addJavascriptInterface(GameBridge(context.applicationContext), "AndroidBridge")

      webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView?, url: String?) {
          isPageReady = true
        }
      }

      loadUrl("file:///android_asset/snake.html")
    }
  }

  DisposableEffect(lifecycleOwner, webView) {
    val observer = LifecycleEventObserver { _, event ->
      when (event) {
        Lifecycle.Event.ON_PAUSE -> {
          webView.evaluateJavascript(
            "if(window.pauseFromAndroid) window.pauseFromAndroid();",
            null,
          )
          webView.onPause()
        }
        Lifecycle.Event.ON_RESUME -> {
          webView.onResume()
        }
        else -> Unit
      }
    }
    lifecycleOwner.lifecycle.addObserver(observer)
    onDispose {
      lifecycleOwner.lifecycle.removeObserver(observer)
      webView.destroy()
    }
  }

  BackHandler(enabled = true) {
    webView.evaluateJavascript(
      "(function(){ return window.handleAndroidBack ? window.handleAndroidBack() : 'exit'; })()"
    ) { result ->
      val action = result?.trim('"')
      if (action == "exit") {
        showExitDialog = true
      }
    }
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(MaterialTheme.colorScheme.background)
      .windowInsetsPadding(WindowInsets.safeDrawing)
  ) {
    AndroidView(
      factory = { webView },
      modifier = Modifier
        .fillMaxSize()
        .testTag("snake_game_webview"),
    )

    AnimatedVisibility(
      visible = !isPageReady,
      enter = fadeIn(),
      exit = fadeOut(),
    ) {
      Box(
        modifier = Modifier
          .fillMaxSize()
          .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center,
      ) {
        CircularProgressIndicator(
          color = MaterialTheme.colorScheme.primary,
          strokeWidth = 3.dp,
        )
      }
    }
  }

  if (showExitDialog) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
      AlertDialog(
        onDismissRequest = { showExitDialog = false },
        containerColor = MaterialTheme.colorScheme.surface,
        titleContentColor = MaterialTheme.colorScheme.primary,
        textContentColor = MaterialTheme.colorScheme.onSurface,
        title = {
          Text(
            text = stringResource(R.string.exit_dialog_title),
            fontWeight = FontWeight.Bold,
          )
        },
        text = {
          Text(text = stringResource(R.string.exit_dialog_message))
        },
        confirmButton = {
          Button(
            onClick = {
              showExitDialog = false
              onExitApp()
            },
            colors = ButtonDefaults.buttonColors(
              containerColor = MaterialTheme.colorScheme.secondary,
              contentColor = MaterialTheme.colorScheme.onSecondary,
            ),
            modifier = Modifier.testTag("confirm_exit_button"),
          ) {
            Text(text = stringResource(R.string.exit_dialog_confirm))
          }
        },
        dismissButton = {
          OutlinedButton(
            onClick = { showExitDialog = false },
            modifier = Modifier.testTag("cancel_exit_button"),
          ) {
            Text(
              text = stringResource(R.string.exit_dialog_cancel),
              color = MaterialTheme.colorScheme.primary,
            )
          }
        },
      )
    }
  }
}
