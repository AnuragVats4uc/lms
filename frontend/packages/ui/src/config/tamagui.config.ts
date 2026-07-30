import { defaultConfig } from '@tamagui/config/v4'
import { createFont, createTamagui } from 'tamagui'

const manropeFontFamily =
  '"Manrope", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

const manropeFont = createFont({
  family: manropeFontFamily,
  size: {
    display: 43,
    h1: 32,
    h2: 27,
    h3: 22,
    h4: 18,
    bodyLarge: 16,
    body: 14,
    label: 13,
    caption: 11,
    true: 14,
  },
  lineHeight: {
    display: 52,
    h1: 38,
    h2: 32,
    h3: 27,
    h4: 22,
    bodyLarge: 24,
    body: 21,
    label: 18,
    caption: 15,
    true: 21,
  },
  weight: {
    heading: '800',
    subheading: '700',
    body: '400',
    label: '500',
    button: '700',
    caption: '400',
    true: '400',
  },
  letterSpacing: {
    heading: 0,
    body: 0,
    button: 0,
    true: 0,
  },
})

export const config = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    heading: manropeFont,
    body: manropeFont,
  },
})

export default config

type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
