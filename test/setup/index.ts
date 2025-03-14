import { inject, beforeAll, afterAll } from 'vitest'
import { ofetch, type FetchOptions } from 'ofetch'
import { setupContext, resetContext, setupServer, stopServer, type SetupContextOptions, getContext } from './server'

export const setup = async (config?: SetupContextOptions) => {
  const server = inject('server')

  if (server) {
    throw new Error('Nitro server already started')
  }

  await setupContext(config)

  beforeAll(async () => {
    await setupServer()
  })

  afterAll(async () => {
    await stopServer()
    resetContext()
  })
}

export function getServerUrl () {
  let serverUrl = getContext()?.server?.url

  if (!serverUrl) {
    serverUrl = inject('server')?.url
  }

  if (!serverUrl) {
    throw new Error('Nitro server is not running.')
  }

  return serverUrl
}

export const $fetch = <T> (url: string, options?: FetchOptions<'json'>) => {
  const serverUrl = getServerUrl()

  return ofetch<T>(url, {
    baseURL: serverUrl,
    ignoreResponseError: true,
    redirect: 'manual',
    retry: 0,
    headers: {
      accept: 'application/json',
      ...options?.headers
    },
    ...options
  })
}
