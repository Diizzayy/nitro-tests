import { describe, expect, it } from 'vitest'
import { $fetch } from '../setup'

describe('health route', () => {
  it('returns health status', async () => {
    const res = await $fetch('/health')

    expect(res).toEqual({ system: 'operational' })
  })
})
