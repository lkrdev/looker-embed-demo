import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'

import { PageHeader, EmbedPlaceholder, DateRangePicker } from '../components'
import { usePortal } from '../context/PortalContext'
import { getLookerPath } from '../config/constants'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const { connection, connectionState, dateFilter, setDateFilter, isNavigating, resetConnection, setDashboardUrl, embedTheme } = usePortal()
  const [showFilters, setShowFilters] = useState(true)

  useEffect(() => {
    return () => {
      setDateFilter('')
      setDashboardUrl(getLookerPath('/dashboard', embedTheme))
    }
  }, [setDateFilter, setDashboardUrl, embedTheme])

  const handleDateChange = (newVal: string) => {
    setDateFilter(newVal)
    if (connection && connectionState === 'connected' && !isNavigating) {
      console.log('Updating Date filter in Looker:', newVal)
      try {
        connection.asDashboardConnection().updateFilters({ 'Date': newVal })
        connection.asDashboardConnection().run()
      } catch (err) {
        console.error('Failed to update dashboard filters:', err)
      }
    }
  }

  const handleToggleFilters = () => {
    const nextState = !showFilters
    setShowFilters(nextState)
    if (connection && connectionState === 'connected' && !isNavigating) {
      const baseUrl = getLookerPath('/dashboard', embedTheme)
      const targetUrl = nextState
        ? baseUrl
        : `${baseUrl}&_theme={"show_filters_bar":true}`
      setDashboardUrl(targetUrl)
      resetConnection()
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        subtitle="Visual analytical dashboards and reports."
        actions={
          <button
            type="button"
            className={`btn btn-secondary rounded-full flex-center gap-2 ${showFilters ? 'active' : ''}`}
            onClick={handleToggleFilters}
            disabled={isNavigating}
            aria-label="Toggle Filters"
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>
        }
      />

      {showFilters && (
        <div className="filter-bar glass">
          <DateRangePicker value={dateFilter} onChange={handleDateChange} disabled={isNavigating} />
        </div>
      )}

      <EmbedPlaceholder />
    </div>
  )
}
