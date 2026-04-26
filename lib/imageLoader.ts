type ImageLoaderProps = {
  src: string
  width: number
  quality?: number
}

export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Local uploads — serve directly, no optimization
  if (src.startsWith('/uploads/')) {
    return src
  }

  // Unsplash — use their built-in resizing
  if (src.includes('unsplash.com')) {
    return `${src}&w=${width}&q=${quality || 75}`
  }

  // Everything else — return as-is
  return src
}