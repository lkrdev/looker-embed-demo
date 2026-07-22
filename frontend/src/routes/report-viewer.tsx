import { useState, useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import {
  Plus,
  RefreshCw,
  LayoutDashboard,
  FileBarChart,
  RotateCw,
  ChevronDown,
  Trash2,
} from 'lucide-react'

import { EmbedPlaceholder, AccessDenied, SourceHighlighter } from '../components'
import { usePortal } from '../context/PortalContext'
import { EXPLORE_PATH, isRouteGated } from '../config/constants'
import type { ReportItem } from '../types'
import { useSharedReports, usePersonalReports } from '../hooks'
import { useLingui } from '@lingui/react'
import { ReportViewer as ReportViewerText } from '../config/ReportViewer'
import styles from './report-viewer.module.css'

export const Route = createFileRoute('/report-viewer')({
  component: ReportViewer,
})

function ReportViewer() {
  const { lookerBrowserSdk, navigateIframe, setIframeAnchor, embedTheme, selectedType } = usePortal()
  const { i18n } = useLingui()
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

  // Memoized Alphabetically Sorted Lists
  const sortedDashboards = useMemo(() => {
    if (!sharedReportsData?.dashboards) return []
    return [...sharedReportsData.dashboards].sort((a: any, b: any) =>
      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
    )
  }, [sharedReportsData?.dashboards])

  const sortedPersonalReports = useMemo(() => {
    if (!personalReportsData) return []
    return [...personalReportsData].sort((a: any, b: any) =>
      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
    )
  }, [personalReportsData])

  const sortedLooks = useMemo(() => {
    if (!sharedReportsData?.looks) return []
    return [...sharedReportsData.looks].sort((a: any, b: any) =>
      (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
    )
  }, [sharedReportsData?.looks])

  const handleDeleteReport = async (
    e: React.MouseEvent,
    type: 'dashboard' | 'look',
    id: string,
    title: string
  ) => {
    e.stopPropagation()
    if (!lookerBrowserSdk) return
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    setDeletingId(id)
    try {
      if (type === 'dashboard') {
        await lookerBrowserSdk.ok(lookerBrowserSdk.delete_dashboard(id))
      } else {
        await lookerBrowserSdk.ok(lookerBrowserSdk.delete_look(id))
      }
      if (selectedReport?.id === id) {
        setSelectedReport(null)
      }
      await Promise.all([refetchShared(), refetchPersonal()])
    } catch (err) {
      console.error('Failed to delete report:', err)
      alert('Failed to delete report. Check browser console.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSelectReport = (report: ReportItem) => {
    setSelectedReport(report)

    let targetUrl = ''
    if (report.type === 'dashboard') {
      targetUrl = `/embed/dashboards/${report.id}?theme=${embedTheme}`
    } else if (report.type === 'look') {
      targetUrl = `/embed/looks/${report.id}?theme=${embedTheme}`
    } else if (report.type === 'explore') {
      targetUrl = `/embed/explore/${report.id}?theme=${embedTheme}`
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

  if (isRouteGated('/report-viewer', selectedType)) {
    return <AccessDenied title="Report Viewer" />
  }

  return (
    <div className={styles.reportViewerContainer}>
      <div className={styles.reportViewerSidebar}>
        <SourceHighlighter sourceType="api" className="h-full flex-col justify-between">
          <div className={styles.reportViewerSidebarContent}>
          {/* Header */}
          <div className={styles.reportViewerHeader}>
            <h1 className={styles.reportViewerTitle}>{i18n._(ReportViewerText.TITLE)}</h1>
            <p className={styles.reportViewerTimestamp}>
              {i18n._(ReportViewerText.AS_OF)} {formattedDate} | {formattedTime}
            </p>
          </div>

          {/* Dashboards Section (Collapsible) */}
          <div className={`${styles.reportSection} ${isDashboardsOpen ? styles.isOpen : styles.isClosed}`}>
            <button
              onClick={() => setIsDashboardsOpen(!isDashboardsOpen)}
              className={styles.reportSectionHeaderBtn}
              aria-expanded={isDashboardsOpen}
            >
              <h4 className={styles.reportSectionTitle}>{i18n._(ReportViewerText.SECTION_DASHBOARDS)}</h4>
              <div className={`${styles.reportSectionChevron} ${isDashboardsOpen ? styles.isOpen : styles.isClosed}`}>
                <ChevronDown size={14} />
              </div>
            </button>
            <div
              className={`${styles.reportSectionContentWrapper} ${isDashboardsOpen ? styles.isOpen : styles.isClosed}`}
              aria-hidden={!isDashboardsOpen}
            >
              <div className={styles.reportSectionContentInner}>
                <div className={styles.reportSectionList}>
                  {isSharedLoading ? (
                    <div className="flex-center py-4">
                      <div className="spinner" />
                    </div>
                  ) : sortedDashboards.length === 0 ? (
                    <div className={`${styles.reportItemBtn} text-muted italic`}>{i18n._(ReportViewerText.NO_DASHBOARDS)}</div>
                  ) : (
                    sortedDashboards.map((d: any) => {
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
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Created Section (Collapsible & Empty except CTA) */}
          <div className={`${styles.reportSection} ${isUserCreatedOpen ? styles.isOpen : styles.isClosed}`}>
            <button
              onClick={() => setIsUserCreatedOpen(!isUserCreatedOpen)}
              className={styles.reportSectionHeaderBtn}
              aria-expanded={isUserCreatedOpen}
            >
              <h4 className={styles.reportSectionTitle}>{i18n._(ReportViewerText.SECTION_USER_CREATED)}</h4>
              <div className={`${styles.reportSectionChevron} ${isUserCreatedOpen ? styles.isOpen : styles.isClosed}`}>
                <ChevronDown size={14} />
              </div>
            </button>
            <div
              className={`${styles.reportSectionContentWrapper} ${isUserCreatedOpen ? styles.isOpen : styles.isClosed}`}
              aria-hidden={!isUserCreatedOpen}
            >
              <div className={styles.reportSectionContentInner}>
                <div className={styles.reportSectionList}>
                  {isPersonalLoading ? (
                    <div className="flex-center py-4">
                      <div className="spinner" />
                    </div>
                  ) : (
                    sortedPersonalReports.map((item: any) => {
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
                  <div className={styles.reportCreateBtnWrapper}>
                    <button
                      onClick={() =>
                        handleSelectReport({
                          type: 'explore',
                          id: EXPLORE_PATH,
                          title: i18n._(ReportViewerText.NEW_REPORT_PREFIX),
                        })
                      }
                      className={styles.reportCreateBtn}
                    >
                      <Plus size={14} className="text-primary" />
                      <span>{i18n._(ReportViewerText.CREATE_NEW_REPORT)}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Looks Section (Collapsible) */}
          <div className={`${styles.reportSection} ${isLooksOpen ? styles.isOpen : styles.isClosed}`}>
            <button
              onClick={() => setIsLooksOpen(!isLooksOpen)}
              className={styles.reportSectionHeaderBtn}
              aria-expanded={isLooksOpen}
            >
              <h4 className={styles.reportSectionTitle}>{i18n._(ReportViewerText.SECTION_LOOKS)}</h4>
              <div className={`${styles.reportSectionChevron} ${isLooksOpen ? styles.isOpen : styles.isClosed}`}>
                <ChevronDown size={14} />
              </div>
            </button>
            <div
              className={`${styles.reportSectionContentWrapper} ${isLooksOpen ? styles.isOpen : styles.isClosed}`}
              aria-hidden={!isLooksOpen}
            >
              <div className={styles.reportSectionContentInner}>
                <div className={styles.reportSectionList}>
                  {isSharedLoading ? (
                    <div className="flex-center py-4">
                      <div className="spinner" />
                    </div>
                  ) : sortedLooks.length === 0 ? (
                    <div className={`${styles.reportItemBtn} text-muted italic`}>{i18n._(ReportViewerText.NO_LOOKS)}</div>
                  ) : (
                    sortedLooks.map((l: any) => {
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Folders Footer */}
        <div className={styles.reportViewerFooter}>
          <button
            onClick={() => refetchPersonal()}
            disabled={isPersonalRefetching}
            className={styles.reportRefreshBtn}
          >
            <RefreshCw size={12} className={`${styles.refreshIcon} ${isPersonalRefetching ? styles.spinning : ''}`} />
            <span>{i18n._(ReportViewerText.REFRESH_FOLDERS)}</span>
          </button>
        </div>
        </SourceHighlighter>
      </div>

      {/* Right Content / iFrame Viewer Column */}
      <div className={styles.reportViewerContent}>
        {!selectedReport ? (
          /* Initial Screenshot Placeholder State */
          <div className={styles.reportViewerPlaceholder}>
            <span className={styles.reportViewerPlaceholderText}>
              {i18n._(ReportViewerText.SELECT_PLACEHOLDER)}
            </span>
          </div>
        ) : (
          /* Active Embed iFrame Container */
          <div className={styles.reportViewerActiveCard}>
            <div className={styles.reportViewerActiveHeader}>
              <div className={styles.reportViewerActiveTitleGroup}>
                <span className={styles.reportBadge}>{selectedReport.type === 'url' ? i18n._(ReportViewerText.BADGE_REPORT) : selectedReport.type}</span>
                <h3 className={styles.reportActiveTitle}>{selectedReport.title}</h3>
              </div>
              <button
                onClick={() => handleSelectReport(selectedReport)}
                className={styles.reportReloadBtn}
                title={i18n._(ReportViewerText.RELOAD_TITLE)}
              >
                <RotateCw size={12} />
                <span>{i18n._(ReportViewerText.RELOAD_BTN)}</span>
              </button>
            </div>
            <div className={styles.reportViewerIframeWrapper}>
              <EmbedPlaceholder style={{ flexGrow: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }} />
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
    <div className={`${styles.reportItemRow} ${isSelected ? styles.selected : ''}`}>
      <button
        onClick={onSelect}
        className={styles.reportItemMainBtn}
        title={title}
      >
        {type === 'dashboard' ? <LayoutDashboard size={16} /> : <FileBarChart size={16} />}
        <span className={styles.reportItemLabel}>{title}</span>
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className={styles.reportItemDeleteBtn}
          title={`Delete ${type}`}
          aria-label={`Delete ${type}`}
        >
          {isDeleting ? (
            <RefreshCw size={14} className={`${styles.refreshIcon} ${styles.spinning}`} />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      )}
    </div>
  )
}
