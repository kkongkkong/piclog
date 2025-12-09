declare module 'exif-parser' {
  interface ExifTags {
    DateTimeOriginal?: number
    CreateDate?: number
    [key: string]: any
  }

  interface ExifResult {
    tags?: ExifTags
    [key: string]: any
  }

  interface ExifParser {
    parse(): ExifResult
  }

  function create(buffer: Buffer): ExifParser

  export = {
    create
  }
}
