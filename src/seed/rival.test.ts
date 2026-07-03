import { describe, expect, it } from 'vitest'
import { reverseName } from './rival'

describe('reverseName', () => {
  it('reverses letters and title-cases the result', () => {
    expect(reverseName('Tommy')).toBe('Ymmot')
  })

  it('trims whitespace before reversing', () => {
    expect(reverseName('  Sarah  ')).toBe('Haras')
  })

  it('falls back to Ymmot for an empty name', () => {
    expect(reverseName('')).toBe('Ymmot')
    expect(reverseName('   ')).toBe('Ymmot')
  })

  it('handles near-palindromic names without special-casing', () => {
    expect(reverseName('Hannah')).toBe('Hannah')
  })
})
