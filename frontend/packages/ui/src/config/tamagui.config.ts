import { defaultConfig } from '@tamagui/config/v4'
import { createFont, createTamagui } from 'tamagui'

const robotoFontFamily =
  'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

const robotoFont = createFont({
  family: robotoFontFamily,
  size: {
    display: 48,
    h1: 36,
    h2: 30,
    h3: 24,
    h4: 20,
    bodyLarge: 18,
    body: 16,
    label: 14,
    caption: 12,
    true: 16,
  },
  lineHeight: {
    display: 58,
    h1: 43,
    h2: 36,
    h3: 29,
    h4: 24,
    bodyLarge: 27,
    body: 24,
    label: 20,
    caption: 17,
    true: 24,
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
    heading: robotoFont,
    body: robotoFont,
  },
})

export default config

type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
