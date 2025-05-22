export interface Request {
  id: number
  name?: string
  type: string
  url: string
  body?: string
  response?: string
  status?: number
  headers?: Record<string, string>
  responseHeaders?: Record<string, string>
  error?: string
  errorMessage?: string
  errorData?: string
  responseType?: string
}