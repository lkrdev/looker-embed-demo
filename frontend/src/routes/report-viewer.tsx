import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import {
  Plus,
  RefreshCw,
  LayoutDashboard,
  FileBarChart,
  RotateCw,
  ChevronDown,
  ChevronRight,
  Trash2,
} from 'lucide-react'

import { EmbedPlaceholder } from '../components'
import { usePortal } from '../context/PortalContext'
import { EMBD_THEME, EXPLORE_PATH } from '../config/constants'
import type { ReportItem } from '../types'
import { useSharedReports, usePersonalReports } from '../hooks'
import '../report-viewer.css'

export const Route = createFileRoute('/report-viewer')({
  component: ReportViewer,
})

function ReportViewer() {
  const { lookerBrowserSdk, navigateIframe, setIframeAnchor } = usePortal()
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)

  // Collapsible Headers State
  const [isDashboardsOpen, setIsDashboardsOpen] = useState(true)
  const [isUserCreatedOpen, setIsUserCreatedOpen] = useState(true)
  const [isLooksOpen, setIsLooksOpen] = useState(false)

  // Fetch Dashboards and Looks from shared folder and user personal folder
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch Dashboards and Looks from shared folder and user personal folder
  const {
    data: sharedReportsData,
    isLoading: isSharedLoading,
    refetch: refetchShared,
  } = useSharedReports(lookerBrowserSdk)

  const {
    data: personalReportsData,
    isLoading: isPersonalLoading,
    isRefetching: isPersonalRefetching,
    refetch: refetchPersonal,
  } = usePersonalReports(lookerBrowserSdk)

  const handleDeleteReport = async (
    e: React.MouseEvent,
    type: 'dashboard' | 'look',
    id: string,
    title: string
  ) => {
    e.stopPropagation()
    e.preventDefault()
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }
    setDeletingId(id)
    try {
      if (type === 'dashboard') {
        console.log('Deleting dashboard with id:', id)
        await lookerBrowserSdk.ok(lookerBrowserSdk.delete_dashboard(id))
      } else if (type === 'look') {
        console.log('Deleting look with id:', id)
        await lookerBrowserSdk.ok(lookerBrowserSdk.delete_look(id))
      }
      if (selectedReport?.id === id) {
        setSelectedReport(null)
      }
      refetchShared()
      refetchPersonal()
    } catch (err) {
      console.error(`Failed to delete ${type} ${id}:`, err)
      alert(`Failed to delete ${type}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSelectReport = (report: ReportItem) => {
    setSelectedReport(report)

    let targetUrl = ''
    if (report.type === 'dashboard') {
      targetUrl = `/embed/dashboards/${report.id}?theme=${EMBD_THEME}`
    } else if (report.type === 'look') {
      targetUrl = `/embed/looks/${report.id}?theme=${EMBD_THEME}`
    } else if (report.type === 'explore') {
      targetUrl = `/embed/explore/${report.id}?theme=${EMBD_THEME}`
    } else {
      targetUrl = report.id
    }

    console.log('ReportViewer selecting report and navigating iframe:', report, targetUrl)
    navigateIframe(targetUrl)
  }

  // Ensure iframeAnchor is unset when no report is selected
  useEffect(() => {
    if (!selectedReport) {
      setIframeAnchor(null)
    }
  }, [selectedReport, setIframeAnchor])

  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="report-viewer-container">
      {/* Left Sidebar / List Column */}
      <div className="report-viewer-sidebar">
        <div className="report-viewer-sidebar-content">
          {/* Header */}
          <div className="report-viewer-header">
            <h1 className="report-viewer-title">Reports</h1>
            <p className="report-viewer-timestamp">
              as of {formattedDate} | {formattedTime}
            </p>
          </div>

          {/* Dashboards Section (Collapsible) */}
          <div className="report-section">
            <button
              onClick={() => setIsDashboardsOpen(!isDashboardsOpen)}
              className="report-section-header-btn"
              aria-expanded={isDashboardsOpen}
            >
              <h4 className="report-section-title">Dashboards</h4>
              <div className="report-section-chevron">
                {isDashboardsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </button>
            {isDashboardsOpen && (
              isSharedLoading ? (
                <div className="flex-center py-4">
                  <div className="spinner" />
                </div>
              ) : sharedReportsData?.dashboards.length === 0 ? (
                <div className="report-item-btn text-muted italic">No dashboards</div>
              ) : (
                sharedReportsData?.dashboards.map((d: any) => {
                  const isSelected =
                    selectedReport?.type === 'dashboard' && selectedReport?.id === d.id
                  return (
                    <ReportItemRow
                      key={`dashboard-${d.id}`}
                      id={d.id}
                      title={d.title}
                      type="dashboard"
                      isSelected={isSelected}
                      isDeleting={deletingId === d.id}
                      onSelect={() =>
                        handleSelectReport({ type: 'dashboard', id: d.id, title: d.title })
                      }
                    />
                  )
                })
              )
            )}
          </div>

          {/* User Created Section (Collapsible & Empty except CTA) */}
          <div className="report-section">
            <button
              onClick={() => setIsUserCreatedOpen(!isUserCreatedOpen)}
              className="report-section-header-btn"
              aria-expanded={isUserCreatedOpen}
            >
              <h4 className="report-section-title">User Created</h4>
              <div className="report-section-chevron">
                {isUserCreatedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </button>
            {isUserCreatedOpen && (
              <>
                {isPersonalLoading ? (
                  <div className="flex-center py-4">
                    <div className="spinner" />
                  </div>
                ) : (
                  personalReportsData?.map((item: any) => {
                    const isSelected =
                      selectedReport?.type === item.type && selectedReport?.id === item.id
                    return (
                      <ReportItemRow
                        key={`${item.type}-${item.id}`}
                        id={item.id}
                        title={item.title}
                        type={item.type as 'dashboard' | 'look'}
                        isSelected={isSelected}
                        isDeleting={deletingId === item.id}
                        onSelect={() =>
                          handleSelectReport({ type: item.type, id: item.id, title: item.title })
                        }
                        onDelete={(e) =>
                          handleDeleteReport(e, item.type as 'dashboard' | 'look', item.id, item.title)
                        }
                      />
                    )
                  })
                )}
                <div className="report-create-btn-wrapper">
                  <button
                    onClick={() =>
                      handleSelectReport({
                        type: 'explore',
                        id: EXPLORE_PATH,
                        title: `New Report (${EXPLORE_PATH})`,
                      })
                    }
                    className="report-create-btn"
                  >
                    <Plus size={14} className="text-primary" />
                    <span>Create new report</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Looks Section (Collapsible) */}
          <div className="report-section">
            <button
              onClick={() => setIsLooksOpen(!isLooksOpen)}
              className="report-section-header-btn"
              aria-expanded={isLooksOpen}
            >
              <h4 className="report-section-title">Looks</h4>
              <div className="report-section-chevron">
                {isLooksOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            </button>
            {isLooksOpen && (
              isSharedLoading ? (
                <div className="flex-center py-4">
                  <div className="spinner" />
                </div>
              ) : sharedReportsData?.looks.length === 0 ? (
                <div className="report-item-btn text-muted italic">No looks</div>
              ) : (
                sharedReportsData?.looks.map((l: any) => {
                  const isSelected =
                    selectedReport?.type === 'look' && selectedReport?.id === l.id
                  return (
                    <ReportItemRow
                      key={`look-${l.id}`}
                      id={l.id}
                      title={l.title}
                      type="look"
                      isSelected={isSelected}
                      isDeleting={deletingId === l.id}
                      onSelect={() =>
                        handleSelectReport({ type: 'look', id: l.id, title: l.title })
                      }
                    />
                  )
                })
              )
            )}
          </div>
        </div>

        {/* Refresh Folders Footer */}
        <div className="report-viewer-footer">
          <button
            onClick={() => refetchPersonal()}
            disabled={isPersonalRefetching}
            className="report-refresh-btn"
          >
            <RefreshCw size={12} className={`refresh-icon ${isPersonalRefetching ? 'spinning' : ''}`} />
            <span>Refresh folders</span>
          </button>
        </div>
      </div>

      {/* Right Content / iFrame Viewer Column */}
      <div className="report-viewer-content">
        {!selectedReport ? (
          /* Initial Screenshot Placeholder State */
          <div className="report-viewer-placeholder">
            <span className="report-viewer-placeholder-text">
              Select a look or a dashboard
            </span>
          </div>
        ) : (
          /* Active Embed iFrame Container */
          <div className="report-viewer-active-card">
            <div className="report-viewer-active-header">
              <div className="report-viewer-active-title-group">
                <span className="report-badge">{selectedReport.type === 'url' ? 'report' : selectedReport.type}</span>
                <h3 className="report-active-title">{selectedReport.title}</h3>
              </div>
              <button
                onClick={() => handleSelectReport(selectedReport)}
                className="report-reload-btn"
                title="Reload Current Report"
              >
                <RotateCw size={12} />
                <span>Reload</span>
              </button>
            </div>
            <div className="report-viewer-iframe-wrapper">
              <EmbedPlaceholder style={{ flexGrow: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ReportItemRowProps {
  id: string
  title: string
  type: 'dashboard' | 'look'
  isSelected: boolean
  isDeleting: boolean
  onSelect: () => void
  onDelete?: (e: React.MouseEvent) => void
}

function ReportItemRow({
  title,
  type,
  isSelected,
  isDeleting,
  onSelect,
  onDelete,
}: ReportItemRowProps) {
  return (
    <div className={`report-item-row ${isSelected ? 'selected' : ''}`}>
      <button
        onClick={onSelect}
        className="report-item-main-btn"
        title={title}
      >
        {type === 'dashboard' ? <LayoutDashboard size={16} /> : <FileBarChart size={16} />}
        <span className="report-item-label">{title}</span>
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="report-item-delete-btn"
          title={`Delete ${type}`}
          aria-label={`Delete ${type}`}
        >
          {isDeleting ? (
            <RefreshCw size={14} className="spinning" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      )}
    </div>
  )
}
