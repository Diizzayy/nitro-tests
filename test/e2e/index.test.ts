import { describe, expect, it } from 'vitest'
import { $fetch } from '../setup'

describe('index route', () => {
  it('returns index data', async () => {
    const res = await $fetch('/')

    expect(res).toHaveProperty('id')
  })
})
