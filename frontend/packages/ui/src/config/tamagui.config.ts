import { defaultConfig } from '@tamagui/config/v4'
import { createFont, createTamagui } from 'tamagui'

const interFont = createFont({
  family:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    heading: '700',
    subheading: '600',
    body: '400',
    label: '500',
    button: '600',
    caption: '400',
    true: '400',
  },
  letterSpacing: {
    heading: -0.02,
    body: 0,
    button: 0.01,
    true: 0,
  },
})

export const config = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    heading: interFont,
    body: interFont,
  },
})

export default config

type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
