import { describe, expect, it } from 'vitest'

import { formatDesktopLogLine } from './desktop-log-line'

describe('formatDesktopLogLine', () => {
  it('prefixes each line with an ISO-8601 timestamp and the xinyuan tag', () => {
    const line = formatDesktopLogLine('[boot] Resolving Xinyuan backend')

    // Shape contract (not a snapshot): every desktop log line starts with
    // an ISO timestamp so multi-surface logs are chronologically readable.
    // See #84405.
    expect(line).toMatch(
      /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[xinyuan\] \[boot\] Resolving Xinyuan backend$/
    )
  })

  it('keeps the message verbatim after the prefix', () => {
    const line = formatDesktopLogLine('Xinyuan backend exited (0)')

    expect(line).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[xinyuan\] Xinyuan backend exited \(0\)$/)
  })
})
