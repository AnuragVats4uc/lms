import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../..'),
  transpilePackages: [
    '@repo/ui',
    '@repo/api',
    '@repo/auth',
    '@repo/validation',
    '@repo/types',
  ],
}

export default nextConfig
