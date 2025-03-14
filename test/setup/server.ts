import { tmpdir } from 'node:os'
import { promises as fsp } from 'node:fs'
import { formatDate } from 'compatx'
import { defu } from 'defu'
import { join, resolve } from 'pathe'
import { listen, type Listener } from 'listhen'
import { build, copyPublicAssets, createDevServer, createNitro, prepare, prerender } from 'nitropack/core'
import type { Nitro, NitroConfig, NitroOptions } from 'nitropack/types'

type Context = {
  preset: NitroOptions['preset']
  nitro?: Nitro
  rootDir?: string
  outDir?: string
  server?: Listener
  isDev?: boolean
  env: Record<string, string>
}

export type SetupContextOptions = {
  preset: NitroOptions['preset'],
  opts: { config?: NitroConfig }
}

let currentContext: Context | undefined
export const getContext = () => currentContext
export const setContext = (ctx: Context) => (currentContext = ctx)
export const resetContext = () => (currentContext = undefined)

const rootDir = new URL('..', import.meta.url).href

const getPresetTmpDir = (preset: string) => {
  return resolve(
    process.env.NITRO_TEST_TMP_DIR || join(tmpdir(), 'nitro-tests'),
    preset
  )
}

export const setupContext = async (args: SetupContextOptions = { preset: 'node', opts: {} }) => {
  const presetTmpDir = getPresetTmpDir(args?.preset)

  await fsp.rm(presetTmpDir, { recursive: true }).catch(() => {
    // Ignore
  })
  await fsp.mkdir(presetTmpDir, { recursive: true })

  const ctx: Context = {
    preset: args.preset,
    isDev: args.preset === 'nitro-dev',
    env: {},
    rootDir,
    outDir: resolve(rootDir, presetTmpDir, '.output')
  }

  for (const [k, v] of Object.entries(ctx.env)) {
    process.env[k] = v
  }

  const config = defu(args?.opts?.config, {
    dev: ctx.isDev,
    preset: ctx.preset,
    logLevel: 1,
    sourceMap: 'hidden',
    runtimeConfig: {
      nitro: {
        envPrefix: 'CUSTOM_'
      },
      hello: '',
      helloThere: ''
    },
    buildDir: resolve(rootDir, presetTmpDir, '.nitro'),
    output: { dir: ctx.outDir }
  } satisfies NitroConfig)

  ctx.nitro = await createNitro(config, {
    compatibilityDate: args?.opts?.config?.compatibilityDate || formatDate(new Date())
  })

  setContext(ctx)

  return ctx
}

export const setupServer = async () => {
  const ctx = getContext()

  if (!ctx) {
    throw new Error('Nitro test context not set up')
  }
  

  if (ctx?.isDev) {
    // Setup development server
    const devServer = createDevServer(ctx.nitro)
    ctx.server = await devServer.listen({})
    await prepare(ctx.nitro)
    const ready = new Promise<void>((resolve) => {
        ctx.nitro!.hooks.hook('dev:reload', () => resolve())
    })
    await build(ctx.nitro)
    await ready
  } else {
    // Production build
    await prepare(ctx.nitro)
    await copyPublicAssets(ctx.nitro)
    await prerender(ctx.nitro)
    await build(ctx.nitro)

    const entryPath = resolve(ctx.nitro.options.output.dir, 'server', 'index.mjs')
    const { listener } = await import(entryPath)
    ctx.server = await listen(listener)
  }

  return ctx
}

export const stopServer = async () => {
  const ctx = getContext()

  if (ctx.server) {
    await ctx.server.close()
  }
  if (ctx.nitro) {
    await ctx.nitro.close()
  }
}
