import { describe, expect, it } from 'vitest'
import { validateReportViewerSearch } from '../../routes/report-viewer'

describe('validateReportViewerSearch', () => {
  it('parses numeric dashboard/look IDs, string slugs, and explore paths', () => {
    expect(validateReportViewerSearch({ dashboard: '177' })).toEqual({ dashboard: 177 })
    expect(validateReportViewerSearch({ dashboard: 'K4HQpuwgccbcTrVvB8Z37l' })).toEqual({
      dashboard: 'K4HQpuwgccbcTrVvB8Z37l',
    })
    expect(validateReportViewerSearch({ look: '42', explore: 'embed_demo/order_items' })).toEqual({
      look: 42,
      explore: 'embed_demo/order_items',
    })
    expect(validateReportViewerSearch({ dashboard: '', look: null, explore: 123 })).toEqual({})
  })
})
