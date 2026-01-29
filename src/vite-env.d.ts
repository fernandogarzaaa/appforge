/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_ENV: string
  readonly VITE_BASE44_USERNAME: string
  readonly VITE_BASE44_PASSWORD: string
  readonly VITE_BASE44_API_URL: string
  readonly VITE_ENABLE_ERROR_TRACKING: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SENTRY_ENVIRONMENT: string
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_GITHUB_CLIENT_SECRET: string
  readonly VITE_STRIPE_PUBLIC_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_ANTHROPIC_API_KEY: string
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_XAI_API_KEY: string
  readonly VITE_CACHE_TTL: string
  readonly VITE_ENABLE_SERVICE_WORKER: string
  readonly VITE_ENABLE_CSP: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_DEBUG: string
  readonly VITE_MOCK_API: string
  readonly VITE_SHOW_PERF_METRICS: string
  readonly VITE_FEATURE_VOICE_INPUT: string
  readonly VITE_FEATURE_CODE_REVIEW: string
  readonly VITE_FEATURE_MOBILE_BUILDER: string
  readonly VITE_FEATURE_WEB3: string
  readonly VITE_FEATURE_COLLABORATION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Window extensions
interface Window {
  Sentry?: {
    captureException(error: Error, context?: any): void
    captureMessage(message: string, context?: any): void
    setUser(user: { id?: string; email?: string; username?: string } | null): void
  }
  gtag?: (command: string, action: string, params?: any) => void
  __showAuthError?: (message: string) => void
  errorTracker?: {
    capture(error: Error | string, context?: any): void
    captureException(error: Error, context?: any): void
    captureMessage(message: string, level?: string, context?: any): void
    clearErrors(): void
  }
}

// Performance API extensions
interface Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

interface PerformanceEntry {
  type?: string
  domContentLoadedEventEnd?: number
  domContentLoadedEventStart?: number
  loadEventEnd?: number
  loadEventStart?: number
  initiatorType?: string
  transferSize?: number
  renderTime?: number
  loadTime?: number
  element?: Element
  processingStart?: number
  domInteractive?: number
  fetchStart?: number
}

// User type definitions
interface User {
  id?: string
  email?: string
  name?: string
  username?: string
  role?: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

// Analytics event types
interface AnalyticsEvent {
  userId: any
  sessionId: string
  userAgent: string
  url: string
  event?: string
  message?: string
  page?: string
  metricName?: string
  value?: number
  unit?: string
  properties?: Record<string, any>
}

// Axios error type extension
interface AxiosError extends Error {
  response?: {
    data?: {
      message?: string
      error?: string
    }
    status?: number
  }
  request?: any
  config?: any
}

// Base44 SDK type extensions
interface EntityCRUD {
  get(id: string): Promise<any>
  list(): Promise<any[]>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  delete(id: string): Promise<void>
  filter(filters: any): Promise<any[]>
}

interface Base44Client {
  auth: {
    me(): Promise<User | null>
    login(credentials: any): Promise<any>
    logout(): Promise<void>
  }
  entities: {
    Project: EntityCRUD
    Entity: EntityCRUD
    [key: string]: EntityCRUD
  }
  asServiceRole: {
    entities: {
      [key: string]: EntityCRUD
    }
  }
  integrations: {
    get(id: string): Promise<any>
    list(): Promise<any[]>
    create(data: any): Promise<any>
    update(id: string, data: any): Promise<any>
    delete(id: string): Promise<void>
  }
}
