package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val NeonSnakeColorScheme =
  darkColorScheme(
    primary = NeonGreen,
    onPrimary = VoidBlack,
    secondary = CrimsonAccent,
    onSecondary = NeonMint,
    tertiary = GoldAccent,
    onTertiary = VoidBlack,
    background = VoidBlack,
    onBackground = NeonMint,
    surface = DeepStage,
    onSurface = NeonMint,
    surfaceVariant = DeepStage,
    onSurfaceVariant = NeonGreenDim,
    outline = StageBorder,
  )

@Composable
fun NeonSnakeTheme(content: @Composable () -> Unit) {
  MaterialTheme(
    colorScheme = NeonSnakeColorScheme,
    typography = Typography,
    content = content,
  )
}
