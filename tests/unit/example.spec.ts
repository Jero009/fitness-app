import { describe, expect, test } from 'vitest'
import { formatDuration, formatTime } from '@/utils/timeFormat'

describe('timeFormat utils', () => {
  test('formats elapsed seconds as hh:mm:ss', () => {
    expect(formatTime(3661)).toBe('01:01:01')
  })

  test('formats duration between two timestamps', () => {
    expect(formatDuration('2026-01-01 10:00:00', '2026-01-01 10:45:20')).toBe('0h 45m 20s')
  })
})
