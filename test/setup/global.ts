import type { TestProject } from 'vitest/node'
import { setupContext, setupServer, stopServer, type SetupContextOptions } from './server'

type TestProjectWithNitro = TestProject & {
  config: { nitro: SetupContextOptions }
}

export default async function ({ config, provide }: TestProjectWithNitro) {
  await setupContext(config.nitro)

  const { server } = await setupServer()

  provide('server', { url: server.url })

  return async function () {
    await stopServer()
  }
}

declare module 'vitest' {
  export interface ProvidedContext {
    server: { url: string }
  }
}
