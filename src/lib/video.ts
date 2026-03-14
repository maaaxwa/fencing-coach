import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import path from 'path'
import fs from 'fs'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

export function getVideoPath(filename: string): string {
  return path.join(UPLOADS_DIR, 'videos', filename)
}

export function getThumbnailPath(videoId: number): string {
  return path.join(UPLOADS_DIR, 'thumbnails', `${videoId}.jpg`)
}

export function getFramesDir(videoId: number): string {
  return path.join(UPLOADS_DIR, 'frames', String(videoId))
}

export async function extractThumbnail(videoPath: string, videoId: number): Promise<string> {
  const thumbnailPath = getThumbnailPath(videoId)
  const thumbnailDir = path.dirname(thumbnailPath)

  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true })
  }

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['10%'],
        filename: `${videoId}.jpg`,
        folder: thumbnailDir,
        size: '480x?',
      })
      .on('end', () => resolve(thumbnailPath))
      .on('error', reject)
  })
}

export async function extractFrames(videoPath: string, videoId: number): Promise<string[]> {
  const framesDir = getFramesDir(videoId)

  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true })
  }

  // Extract 1 frame per second
  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions(['-vf', 'fps=1', '-q:v', '3'])
      .output(path.join(framesDir, 'frame-%03d.jpg'))
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run()
  })

  const files = fs
    .readdirSync(framesDir)
    .filter((f) => f.endsWith('.jpg'))
    .sort()

  return files.map((f) => path.join(framesDir, f))
}

export function framePathToBase64(framePath: string): string {
  const buffer = fs.readFileSync(framePath)
  return buffer.toString('base64')
}

export function cleanupFrames(videoId: number): void {
  const framesDir = getFramesDir(videoId)
  if (fs.existsSync(framesDir)) {
    fs.rmSync(framesDir, { recursive: true, force: true })
  }
}
