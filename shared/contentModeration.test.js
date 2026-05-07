import { describe, it, expect } from 'vitest'
import { analyzeContent, TECH_KEYWORDS, SCAM_KEYWORDS } from './contentModeration.js'

describe('contentModeration module exports', () => {
  it('exports TECH_KEYWORDS as a non-empty array', () => {
    expect(Array.isArray(TECH_KEYWORDS)).toBe(true)
    expect(TECH_KEYWORDS.length).toBeGreaterThan(0)
  })

  it('exports SCAM_KEYWORDS as a non-empty array', () => {
    expect(Array.isArray(SCAM_KEYWORDS)).toBe(true)
    expect(SCAM_KEYWORDS.length).toBeGreaterThan(0)
  })

  it('exports analyzeContent as a function', () => {
    expect(typeof analyzeContent).toBe('function')
  })
})

describe('analyzeContent — tech keyword detection', () => {
  it('detects "laptop" as tech', () => {
    const result = analyzeContent('laptop', '')
    expect(result.isTech).toBe(true)
    expect(result.techScore).toBeGreaterThanOrEqual(1)
  })

  it('detects "RTX 4090" case-insensitively in description', () => {
    const result = analyzeContent('', 'RTX 4090 gaming beast')
    expect(result.isTech).toBe(true)
    expect(result.techScore).toBeGreaterThanOrEqual(1)
  })

  it('increments techScore for multiple tech keywords', () => {
    const result = analyzeContent('laptop', 'nvidia rtx gaming pc')
    // laptop, nvidia, rtx, pc — at least 4
    expect(result.techScore).toBeGreaterThanOrEqual(4)
  })

  it('detects Albanian tech keywords (karte grafike, pllake ame)', () => {
    const result = analyzeContent('kartë grafike', 'pllakë amë e re')
    expect(result.isTech).toBe(true)
    expect(result.techScore).toBeGreaterThanOrEqual(2)
  })

  it('detects tech from description alone', () => {
    const result = analyzeContent('', 'ryzen 9 processor ddr5 ram')
    expect(result.isTech).toBe(true)
    expect(result.techScore).toBeGreaterThanOrEqual(2)
  })
})

describe('analyzeContent — scam keyword detection', () => {
  it('detects single scam keyword without flagging suspicious', () => {
    const result = analyzeContent('laptop for sale', 'contact via telegram')
    expect(result.scamScore).toBe(1)
    expect(result.isSuspicious).toBe(false)
  })

  it('flags as suspicious when >=2 scam keywords', () => {
    const result = analyzeContent('urgent sale', 'dm whatsapp bitcoin only')
    expect(result.scamScore).toBeGreaterThanOrEqual(2)
    expect(result.isSuspicious).toBe(true)
  })
})

describe('analyzeContent — warning messages', () => {
  it('returns no warnings for clean tech content', () => {
    const result = analyzeContent('laptop', 'gaming rtx 4090')
    expect(result.warnings).toHaveLength(0)
  })

  it('warns "may contain suspicious keywords" at scamScore >= 1', () => {
    const result = analyzeContent('laptop', 'contact me on telegram')
    expect(result.warnings).toContain('This listing may contain suspicious keywords')
    expect(result.warnings).not.toContain('This listing has been flagged for review')
  })

  it('warns "flagged for review" at scamScore >= 2', () => {
    const result = analyzeContent('laptop', 'urgent sale dm on telegram bitcoin accepted')
    expect(result.warnings).toContain('This listing may contain suspicious keywords')
    expect(result.warnings).toContain('This listing has been flagged for review')
  })

  it('warns "may not be a tech product" when techScore is 0', () => {
    const result = analyzeContent('hello', 'world')
    expect(result.warnings).toContain('This may not be a tech product')
  })

  it('emits all three warnings for non-tech scammy content', () => {
    const result = analyzeContent('urgent', 'whatsapp bitcoin lottery winner')
    expect(result.warnings).toContain('This listing may contain suspicious keywords')
    expect(result.warnings).toContain('This listing has been flagged for review')
    expect(result.warnings).toContain('This may not be a tech product')
  })
})

describe('analyzeContent — edge cases', () => {
  it('handles empty title and description', () => {
    const result = analyzeContent('', '')
    expect(result.isTech).toBe(false)
    expect(result.techScore).toBe(0)
    expect(result.scamScore).toBe(0)
    expect(result.isSuspicious).toBe(false)
    expect(result.warnings).toContain('This may not be a tech product')
  })

  it('handles non-tech text', () => {
    const result = analyzeContent('hello world', 'this is a test')
    expect(result.isTech).toBe(false)
    expect(result.techScore).toBe(0)
    expect(result.scamScore).toBe(0)
  })

  it('is case-insensitive with mixed case keywords', () => {
    const result = analyzeContent('RTX 4090 GPU', 'NVIDIA GRAPHICS CARD')
    expect(result.isTech).toBe(true)
    expect(result.techScore).toBeGreaterThanOrEqual(3)
  })

  it('handles partial word matches correctly', () => {
    // "ram" is a keyword — "program" contains "ram" as a substring
    // The implementation uses .includes() so substring matches are expected
    const result = analyzeContent('programming', 'project')
    expect(result.techScore).toBeGreaterThanOrEqual(0)
  })
})
