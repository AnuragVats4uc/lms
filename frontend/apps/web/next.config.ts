import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: [
    '@repo/ui',
    'tamagui',
    '@tamagui/core',
    '@tamagui/themes',
    '@tamagui/font-inter',
  ],
}

export default nextConfig
