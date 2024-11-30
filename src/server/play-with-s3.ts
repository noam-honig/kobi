import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Remult } from 'remult'
import type { Response } from 'express'

import { pipeline } from 'stream'
import { promisify } from 'util'

export const config = {
  schema: 'kobi',
  folder: 'kobi',
}

export async function base64ToS3(key: string, image: string) {
  const s3Client = new S3Client({ region: 'eu-west-1' })
  let split = image.split(',')
  let type = split[0].substring(5).replace(';base64', '')
  const buffer = Buffer.from(split[1], 'base64')
  const result = await s3Client.send(
    new PutObjectCommand({
      Bucket: 'menb',
      Key: config.schema + '/' + config.folder + '/' + key,
      ContentType: type,
      Body: buffer,
    })
  )
  return result
}

export async function getFromS3(key: string) {
  const s3Client = new S3Client({ region: 'eu-west-1' })
  const result = await s3Client.send(
    new GetObjectCommand({
      Bucket: 'menb',
      Key: config.schema + '/' + config.folder + '/' + key,
    })
  )
  return {
    ContentType: result.ContentType,

    async getBuffer() {
      return Buffer.from(await result.Body?.transformToByteArray()!)
    },
    writeToResponse(response: Response) {
      response.contentType(result.ContentType!)
      const pipelinePromise = promisify(pipeline)
      return pipelinePromise(
        result.Body!.transformToWebStream() as any as NodeJS.ReadableStream,
        response
      )
    },
  }
}
