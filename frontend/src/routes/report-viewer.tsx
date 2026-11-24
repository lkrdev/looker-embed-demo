import { useState, useEffect, useMemo, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LookerEmbedExSDK } from '@looker/embed-sdk'

import {
  ArrowLeft,
  Plus,
  RefreshCw,
  LayoutDashboard,
  FileBarChart,
  Sparkles,
  RotateCw,
  ChevronDown,
  Trash2,
} from 'lucide-react'

import { EmbedPlaceholder, AccessDenied, SourceHighlighter } from '../components'
import { usePortal } from '../context/PortalContext'
import { EXPLORE_PATH, isRouteGated } from '../config/constants'
import { configureCookielessSDK } from '../services'
import type { ReportItem } from '../types'
import { useSharedReports, usePersonalReports } from '../hooks'
import { useLingui } from '@lingui/react'
import { ReportViewer as ReportViewerText } from '../config/ReportViewer'
import styles from './report-viewer.module.css'

export interface ReportViewerSearch {
  dashboard?: string | number
  look?: string | number
  explore?: string
}

const toSearchKey = (v: unknown): string | number | undefined =>
  typeof v === 'number' && Number.isFinite(v)
    ? v
    : typeof v === 'string' && v
      ? /^\d+$/.test(v)
        ? Number(v)
        : v
      : undefined

export function validateReportViewerSearch(search: Record<string, unknown>): ReportViewerSearch {
  const dashboard = toSearchKey(search.dashboard)
  const look = toSearchKey(search.look)
  const explore = typeof search.explore === 'string' && search.explore ? search.explore : undefined
  return {
    ...(dashboard !== undefined ? { dashboard } : {}),
    ...(look !== undefined ? { look } : {}),
    ...(explore !== undefined ? { explore } : {}),
  }
}

export const Route = createFileRoute('/report-viewer')({
  validateSearch: validateReportViewerSearch,
  component: ReportViewer,
})

// ponytail: Looker evaluates inline `_theme` overrides via Turboload ONLY on initial iframe document load
// (not on SPA `loadUrl` from `/embed/preload`); mounting Data Apps directly with `createDashboardWithId`
// applies `_theme` on boot and hides Looker's native extension-layout dashboard header (b/589962418).
const DATA_APP_THEME_OVERRIDE = JSON.stringify({
  show_dashboard_header: false,
  show_title: false,
  show_filters_bar: false,
  tile_shadow: false,
  page_margin_top: '0px',
  page_margin_bottom: '0px',
  page_margin_sides: '0px',
})

function DataAppEmbedFrame({ reportId, embedTheme }: { reportId: string; embedTheme: string }) {
  const { lookerHost, authTrigger, isLoadingConfig } = usePortal()
  const hostRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [embedError, setEmbedError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let fallbackTimer: number | undefined
    const el = hostRef.current
    if (isLoadingConfig || !lookerHost || !el) return

    el.replaceChildren()
    setIsReady(false)
    setEmbedError(null)

    const markReady = () => {
      if (!active) return
      window.clearTimeout(fallbackTimer)
      setIsReady(true)
    }

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'embed-demo-theme-request') {
        markReady()
      }
    }
    window.addEventListener('message', onMessage)

    const sdk = new LookerEmbedExSDK()
    configureCookielessSDK(sdk, lookerHost, () => active)

    sdk
      .createDashboardWithId(reportId)
      .appendTo(el)
      .withAllowAttr('fullscreen')
      .withTheme(embedTheme)
      .withParams({ _theme: DATA_APP_THEME_OVERRIDE })
      .build()
      .connect({ waitUntilLoaded: true })
      .then(() => {
        if (!active) {
          el.replaceChildren()
          return
        }
        // Fallback reveal for Data Apps that don't emit embed-demo-theme-request
        fallbackTimer = window.setTimeout(markReady, 1800)
      })
      .catch((err) => {
        if (!active) return
        console.error('Data App embed connection error:', err)
        setEmbedError(err?.message || 'Failed to load Data App')
        markReady()
      })

    return () => {
      active = false
      window.clearTimeout(fallbackTimer)
      window.removeEventListener('message', onMessage)
      el.replaceChildren()
    }
  }, [reportId, embedTheme, authTrigger, lookerHost, isLoadingConfig])

  return (
    <div className="relative flex-grow flex-col h-full w-full" style={{ backgroundColor: 'var(--background)' }}>
      {!isReady && (
        <div
          className="flex-center gap-2"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            backgroundColor: 'var(--background)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="spinner" />
        </div>
      )}
      {embedError && (
        <div className="flex-center h-full w-full p-6 text-muted">
          <span>{embedError}</span>
        </div>
      )}
      <SourceHighlighter sourceType="iframe" className="flex-grow flex-col h-full w-full">
        <div
          ref={hostRef}
          className="portal-pane looker-iframe-container"
          style={{
            flex: 1,
            minHeight: 0,
            display: embedError ? 'none' : undefined,
            backgroundColor: 'var(--background)',
            opacity: isReady ? 1 : 0,
            transition: 'opacity 160ms ease-out',
          }}
        />
      </SourceHighlighter>
    </div>
  )
}

function getReportTargetUrl(report: ReportItem, embedTheme: string): string {
  if (report.type === 'dashboard') {
    return `/embed/dashboards/${report.id}?theme=${embedTheme}`
  }
  if (report.type === 'look') {
    return `/embed/looks/${report.id}?theme=${embedTheme}`
  }
  if (report.type === 'explore') {
    return `/embed/explore/${report.id}?theme=${embedTheme}`
  }
  return report.id
}

const sortByTitle = <T extends { title?: string | null }>(items?: T[] | null): T[] =>
  items ? [...items].sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })) : []

function ReportViewer() {
  const {
    lookerBrowserSdk,
    connectionState,
    navigateIframe,
    setIframeAnchor,
    embedTheme,
    selectedType,
    isLoadingConfig,
    authTrigger,
  } = usePortal()
  const { i18n } = useLingui()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const lastLoadedUrlRef = useRef('')

  // Collapsible Headers State
  const [isDashboardsOpen, setIsDashboardsOpen] = useState(true)
  const [isDataAppsOpen, setIsDataAppsOpen] = useState(true)
  const [isUserCreatedOpen, setIsUserCreatedOpen] = useState(true)
  const [isLooksOpen, setIsLooksOpen] = useState(false)

  // Fetch Dashboards and Looks from shared folder and user personal folder
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const canQueryFolders = !isLoadingConfig && !isRouteGated('/report-viewer', selectedType)

  const {
    data: sharedReportsData,
    isPending: isSharedLoading,
    isRefetching: isSharedRefetching,
    refetch: refetchShared,
  } = useSharedReports(lookerBrowserSdk, canQueryFolders, authTrigger)

  const {
    data: personalReportsData,
    isPending: isPersonalLoading,
    isRefetching: isPersonalRefetching,
    refetch: refetchPersonal,
  } = usePersonalReports(lookerBrowserSdk, canQueryFolders, authTrigger)

  const sortedDashboards = useMemo(() => sortByTitle(sharedReportsData?.dashboards), [sharedReportsData?.dashboards])
  const sortedDataApps = useMemo(() => sortByTitle(sharedReportsData?.dataApps), [sharedReportsData?.dataApps])
  const sortedPersonalReports = useMemo(() => sortByTitle(personalReportsData), [personalReportsData])
  const sortedLooks = useMemo(() => sortByTitle(sharedReportsData?.looks), [sharedReportsData?.looks])

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
        navigate({ search: {} })
      }
      await Promise.all([refetchShared(), refetchPersonal()])
    } catch (err) {
      console.error('Failed to delete report:', err)
      alert('Failed to delete report. Check browser console.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSelectReport = (report: ReportItem, forceReload = false) => {
    setSelectedReport(report)
    const nextSearch: ReportViewerSearch =
      report.type === 'dashboard' || report.type === 'data_app'
        ? { dashboard: toSearchKey(report.slug || String(report.id)) }
        : report.type === 'look'
          ? { look: toSearchKey(String(report.id)) }
          : report.type === 'explore'
            ? { explore: String(report.id) }
            : {}
    navigate({ search: nextSearch })

    if (report.type === 'data_app') {
      lastLoadedUrlRef.current = ''
      setIframeAnchor(null)
      return
    }
    const targetUrl = getReportTargetUrl(report, embedTheme)
    if (forceReload || lastLoadedUrlRef.current !== targetUrl) {
      lastLoadedUrlRef.current = targetUrl
      console.log('ReportViewer selecting report and navigating iframe:', report, targetUrl)
      navigateIframe(targetUrl)
    }
  }

  // Hydrate & synchronize selectedReport from URL search params (?dashboard=<slug|id>, ?look=<id>, ?explore=<path>)
  useEffect(() => {
    const dashKey = search.dashboard !== undefined ? String(search.dashboard) : ''
    const lookKey = search.look !== undefined ? String(search.look) : ''
    const matchesDashKey = (d: { id: string; slug?: string | null }, key: string) =>
      (d.slug && String(d.slug) === key) || d.id === key

    if (dashKey) {
      const appMatch = sortedDataApps.find((d) => matchesDashKey(d, dashKey))
      if (appMatch) {
        setIsDataAppsOpen(true)
        setSelectedReport((prev) =>
          prev?.type === 'data_app' && prev.id === appMatch.id
            ? prev
            : { type: 'data_app', id: appMatch.id, slug: appMatch.slug || undefined, title: appMatch.title }
        )
        return
      }
      const dashMatch =
        sortedDashboards.find((d) => matchesDashKey(d, dashKey)) ||
        sortedPersonalReports.find((d) => d.type === 'dashboard' && matchesDashKey(d, dashKey))
      if (dashMatch) {
        setSelectedReport((prev) =>
          prev?.type === 'dashboard' && prev.id === dashMatch.id
            ? prev
            : { type: 'dashboard', id: dashMatch.id, slug: dashMatch.slug || undefined, title: dashMatch.title }
        )
      } else if (!isSharedLoading && !isPersonalLoading) {
        setSelectedReport(null)
      }
      return
    }

    if (lookKey) {
      const sharedLook = sortedLooks.find((l) => l.id === lookKey)
      const lookMatch = sharedLook || sortedPersonalReports.find((l) => l.type === 'look' && l.id === lookKey)
      if (lookMatch) {
        if (sharedLook) setIsLooksOpen(true)
        setSelectedReport((prev) =>
          prev?.type === 'look' && prev.id === lookMatch.id
            ? prev
            : { type: 'look', id: lookMatch.id, title: lookMatch.title }
        )
      } else if (!isSharedLoading && !isPersonalLoading) {
        setSelectedReport(null)
      }
      return
    }

    if (search.explore) {
      setSelectedReport((prev) =>
        prev?.type === 'explore' && prev.id === search.explore
          ? prev
          : { type: 'explore', id: search.explore!, title: i18n._(ReportViewerText.NEW_REPORT_PREFIX) }
      )
      return
    }

    setSelectedReport(null)
  }, [
    search.dashboard,
    search.look,
    search.explore,
    isSharedLoading,
    isPersonalLoading,
    sortedDataApps,
    sortedDashboards,
    sortedPersonalReports,
    sortedLooks,
    i18n,
  ])

  // Re-navigate active non-Data-App report when connection warmboots (e.g., on Light/Dark or Brand theme switch)
  useEffect(() => {
    if (!selectedReport || selectedReport.type === 'data_app') {
      lastLoadedUrlRef.current = ''
      setIframeAnchor(null)
      return
    }
    if (connectionState !== 'connected') {
      lastLoadedUrlRef.current = ''
      return
    }
    const targetUrl = getReportTargetUrl(selectedReport, embedTheme)
    if (lastLoadedUrlRef.current !== targetUrl) {
      lastLoadedUrlRef.current = targetUrl
      navigateIframe(targetUrl)
    }
  }, [selectedReport, connectionState, embedTheme, navigateIframe, setIframeAnchor, lastLoadedUrlRef])

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
    <div className={`${styles.reportViewerContainer} ${selectedReport ? styles.hasSelection : ''}`}>
      <div className={styles.reportViewerSidebar}>
        <SourceHighlighter sourceType="api" className="h-full flex-col justify-between overflow-hidden" style={{ minHeight: 0 }}>
          <div className={styles.reportViewerSidebarContent}>
          {/* Header */}
          <div className={styles.reportViewerHeader}>
            <h1 className={styles.reportViewerTitle}>{i18n._(ReportViewerText.TITLE)}</h1>
            <p className={styles.reportViewerTimestamp}>
              {i18n._(ReportViewerText.AS_OF)} {formattedDate} | {formattedTime}
            </p>
          </div>

          <div className={styles.reportSectionsScroll}>
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
                    sortedDashboards.map((d) => {
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
                            handleSelectReport({ type: 'dashboard', id: d.id, slug: d.slug || undefined, title: d.title })
                          }
                        />
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Apps Section (Collapsible, shown only when Data Apps subfolder has items) */}
          {sortedDataApps.length > 0 && (
            <div className={`${styles.reportSection} ${isDataAppsOpen ? styles.isOpen : styles.isClosed}`}>
              <button
                onClick={() => setIsDataAppsOpen(!isDataAppsOpen)}
                className={styles.reportSectionHeaderBtn}
                aria-expanded={isDataAppsOpen}
              >
                <h4 className={styles.reportSectionTitle}>{i18n._(ReportViewerText.SECTION_DATA_APPS)}</h4>
                <div className={`${styles.reportSectionChevron} ${isDataAppsOpen ? styles.isOpen : styles.isClosed}`}>
                  <ChevronDown size={14} />
                </div>
              </button>
              <div
                className={`${styles.reportSectionContentWrapper} ${isDataAppsOpen ? styles.isOpen : styles.isClosed}`}
                aria-hidden={!isDataAppsOpen}
              >
                <div className={styles.reportSectionContentInner}>
                  <div className={styles.reportSectionList}>
                    {sortedDataApps.map((d) => {
                      const isSelected =
                        selectedReport?.type === 'data_app' && selectedReport?.id === d.id
                      return (
                        <ReportItemRow
                          key={`data-app-${d.id}`}
                          id={d.id}
                          title={d.title}
                          type="data_app"
                          isSelected={isSelected}
                          isDeleting={deletingId === d.id}
                          onSelect={() =>
                            handleSelectReport({ type: 'data_app', id: d.id, slug: d.slug || undefined, title: d.title })
                          }
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    sortedPersonalReports.map((item) => {
                      const isSelected =
                        selectedReport?.type === item.type && selectedReport?.id === item.id
                      return (
                        <ReportItemRow
                          key={`${item.type}-${item.id}`}
                          id={item.id}
                          title={item.title}
                          type={item.type}
                          isSelected={isSelected}
                          isDeleting={deletingId === item.id}
                          onSelect={() =>
                            handleSelectReport({ type: item.type, id: item.id, slug: item.slug || undefined, title: item.title })
                          }
                          onDelete={(e) =>
                            handleDeleteReport(e, item.type, item.id, item.title)
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
                    sortedLooks.map((l) => {
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
        </div>

        {/* Refresh Folders Footer */}
        <div className={styles.reportViewerFooter}>
          <button
            onClick={() => Promise.all([refetchShared(), refetchPersonal()])}
            disabled={isPersonalRefetching || isSharedRefetching}
            className={styles.reportRefreshBtn}
          >
            <RefreshCw size={12} className={`${styles.refreshIcon} ${isPersonalRefetching || isSharedRefetching ? styles.spinning : ''}`} />
            <span>{i18n._(ReportViewerText.REFRESH_FOLDERS)}</span>
          </button>
        </div>
        </SourceHighlighter>
      </div>

      {/* Right Content / iFrame Viewer Column */}
      <div className={styles.reportViewerContent}>
        {!selectedReport ? (
          (search.dashboard !== undefined || search.look !== undefined || search.explore !== undefined) &&
          (isSharedLoading || isPersonalLoading) ? (
            <div className="flex-center h-full w-full">
              <div className="spinner" />
            </div>
          ) : (
            /* Initial Screenshot Placeholder State */
            <div className={styles.reportViewerPlaceholder}>
              <span className={styles.reportViewerPlaceholderText}>
                {i18n._(ReportViewerText.SELECT_PLACEHOLDER)}
              </span>
            </div>
          )
        ) : (
          /* Active Embed iFrame Container */
          <div className={styles.reportViewerActiveCard}>
            <div className={styles.mobileBackBar}>
              <button
                type="button"
                onClick={() => {
                  setSelectedReport(null)
                  navigate({ search: {} })
                }}
                className={styles.mobileBackBtn}
              >
                <ArrowLeft size={14} />
                <span>{i18n._(ReportViewerText.BACK_TO_REPORTS)}</span>
              </button>
              <span className={styles.mobileReportTitle}>{selectedReport.title}</span>
            </div>
            {selectedReport.type !== 'data_app' && (
              <div className={styles.reportViewerActiveHeader}>
                <div className={styles.reportViewerActiveTitleGroup}>
                  <span className={styles.reportBadge}>
                    {selectedReport.type === 'url'
                      ? i18n._(ReportViewerText.BADGE_REPORT)
                      : selectedReport.type}
                  </span>
                  <h3 className={styles.reportActiveTitle}>{selectedReport.title}</h3>
                </div>
                <button
                  onClick={() => handleSelectReport(selectedReport, true)}
                  className={styles.reportReloadBtn}
                  title={i18n._(ReportViewerText.RELOAD_TITLE)}
                >
                  <RotateCw size={12} />
                  <span>{i18n._(ReportViewerText.RELOAD_BTN)}</span>
                </button>
              </div>
            )}
            <div className={styles.reportViewerIframeWrapper}>
              {selectedReport.type === 'data_app' ? (
                <DataAppEmbedFrame reportId={selectedReport.id} embedTheme={embedTheme} />
              ) : (
                <EmbedPlaceholder style={{ flexGrow: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }} />
              )}
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
  type: 'dashboard' | 'data_app' | 'look'
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
        {type === 'data_app' ? (
          <Sparkles size={14} className="shrink-0" />
        ) : type === 'dashboard' ? (
          <LayoutDashboard size={14} className="shrink-0" />
        ) : (
          <FileBarChart size={14} className="shrink-0" />
        )}
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
