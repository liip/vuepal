export class FileCache<T> {
  private cache: Map<string, T> = new Map()

  public get(filePath: string): T | undefined {
    return this.cache.get(filePath)
  }

  public set(filePath: string, value: T): void {
    this.cache.set(filePath, value)
  }

  public clear(filePath: string): void {
    this.cache.delete(filePath)
  }
}
