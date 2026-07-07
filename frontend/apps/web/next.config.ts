import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@repo/ui',
    'tamagui',
    '@tamagui/core',
    '@tamagui/themes',
    '@tamagui/font-inter',
  ],
}

export default nextConfig