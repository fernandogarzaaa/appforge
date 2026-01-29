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
