/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_ENVIRONMENT: string
  readonly DEV: boolean
  readonly MODE: string
  readonly PROD: boolean
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

