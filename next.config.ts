import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['fluent-ffmpeg', 'better-sqlite3', '@ffmpeg-installer/ffmpeg'],
}

export default nextConfig
