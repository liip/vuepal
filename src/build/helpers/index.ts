import fs from 'node:fs'
import { useLogger } from '@nuxt/kit'

export const fileExists = (
  path?: string,
  extensions = ['js', 'ts'],
): string | null => {
  if (!path) {
    return null
  } else if (fs.existsSync(path)) {
    // If path already contains/forces the extension
    return path
  }

  const extension = extensions.find((extension) =>
    fs.existsSync(`${path}.${extension}`),
  )

  return extension ? `${path}.${extension}` : null
}

export const logger = useLogger('vuepal')
