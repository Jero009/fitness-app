import { describe, expect, test } from 'vitest'
import { formatDuration, formatTime } from '@/utils/timeFormat'

describe('timeFormat utils', () => {
  test('formats hh:mm:ss values correctly', () => {
    expect(formatTime(3661)).toBe('01:01:01')
  })

  test('parses ISO end timestamps with timezone correctly', () => {
    const start = '2026-04-22 10:00:00'
    const end = '2026-04-22T10:30:00.000Z'
    expect(formatDuration(start, end)).toBe('0h 30m 0s')
  })
})
