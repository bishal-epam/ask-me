// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { cn } from '@/utils/cn'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'excluded', 'included')).toBe('base included')
  })

  it('resolves tailwind conflicts', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('handles undefined/null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })
})
