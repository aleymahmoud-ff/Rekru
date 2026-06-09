import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

// S3-compatible object storage (Cranl Storage). Configured via env vars; the
// app degrades gracefully (uploads disabled) when they are absent.
const endpoint = process.env.S3_ENDPOINT
const bucket = process.env.S3_BUCKET
const accessKeyId = process.env.S3_ACCESS_KEY_ID
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
const region = process.env.S3_REGION || 'auto'

export function isS3Configured(): boolean {
  return Boolean(endpoint && bucket && accessKeyId && secretAccessKey)
}

let cachedClient: S3Client | null = null
function client(): S3Client {
  if (!isS3Configured()) throw new Error('S3 storage is not configured')
  if (!cachedClient) {
    cachedClient = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      forcePathStyle: true,
    })
  }
  return cachedClient
}

// Accepted CV types → file extension.
const ALLOWED_CV_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

export const MAX_CV_BYTES = 8 * 1024 * 1024 // 8 MB
export const CV_ACCEPT = '.pdf,.doc,.docx'

/** Returns the extension for an accepted CV mime type, or null if unsupported. */
export function cvExtForType(type: string): string | null {
  return ALLOWED_CV_TYPES[type] ?? null
}

/** True if the stored value is an S3 object key (vs. a legacy external URL). */
export function isS3Key(value: string | null | undefined): value is string {
  return Boolean(value && !/^https?:\/\//i.test(value))
}

/** Validates a CV file's type and size. Returns an error message, or null if valid. */
export function validateCvFile(file: File): string | null {
  if (!cvExtForType(file.type)) return 'Unsupported file type. Upload a PDF or Word document.'
  if (file.size === 0) return 'The uploaded file is empty.'
  if (file.size > MAX_CV_BYTES) return 'File too large. Maximum size is 8 MB.'
  return null
}

/**
 * Validates and uploads a CV file to S3, returning the object key to persist.
 * Throws on unsupported type or oversized file.
 */
export async function uploadCv(orgId: string, candidateId: string, file: File): Promise<string> {
  const error = validateCvFile(file)
  if (error) throw new Error(error)
  const ext = cvExtForType(file.type)!

  const key = `cv/${orgId}/${candidateId}/${randomUUID()}.${ext}`
  const body = Buffer.from(await file.arrayBuffer())
  await client().send(
    new PutObjectCommand({ Bucket: bucket!, Key: key, Body: body, ContentType: file.type })
  )
  return key
}

/** Generates a short-lived signed URL to view/download a stored CV. */
export async function getCvSignedUrl(key: string, filename?: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket!,
    Key: key,
    ...(filename ? { ResponseContentDisposition: `inline; filename="${filename}"` } : {}),
  })
  return getSignedUrl(client(), command, { expiresIn: 600 }) // 10 minutes
}

/** Deletes a stored CV object. Best-effort; ignores missing keys. */
export async function deleteCv(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: bucket!, Key: key }))
}

/**
 * Resolves a stored cvLink value to a usable URL: a signed URL for S3 keys,
 * the value itself for legacy external URLs, or null if it's an unreachable
 * key while S3 is unconfigured.
 */
export async function resolveCvUrl(
  cvLink: string | null | undefined,
  filename?: string
): Promise<string | null> {
  if (!cvLink) return null
  if (!isS3Key(cvLink)) return cvLink // legacy external URL
  if (!isS3Configured()) return null
  return getCvSignedUrl(cvLink, filename)
}
