import * as React from 'react'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { usePortal } from '../../../context/PortalContext'
import { useLingui } from '@lingui/react'
import { DateRangePicker as DateRangePickerText } from '../../../config/DateRangePicker'
import styles from './DateRangePicker.module.css'

export interface DateRangePickerProps {
  value: string // Looker filter expression: e.g. "7 days", "2026/06/01 to 2026/06/10", or ""
  onChange: (value: string) => void
  placeholder?: any
  align?: 'left' | 'right'
  disabled?: boolean
  visible?: boolean
}

interface Preset {
  label: any
  value: string
}

const PRESETS: Preset[] = [
  { label: DateRangePickerText.PRESET_ALL_TIME, value: '' },
  { label: DateRangePickerText.PRESET_TODAY, value: 'today' },
  { label: DateRangePickerText.PRESET_YESTERDAY, value: 'yesterday' },
  { label: DateRangePickerText.PRESET_7_DAYS, value: '7 days' },
  { label: DateRangePickerText.PRESET_30_DAYS, value: '30 days' },
  { label: DateRangePickerText.PRESET_THIS_MONTH, value: 'this month' },
  { label: DateRangePickerText.PRESET_LAST_MONTH, value: 'last month' },
]

// Helper to format Date as YYYY/MM/DD
const formatDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

// Helper to parse Looker filter string into JS Dates if absolute
const parseLookerFilter = (val: string): { start: Date | null; end: Date | null; relativeLabel: any } => {
  if (!val) return { start: null, end: null, relativeLabel: DateRangePickerText.PRESET_ALL_TIME }
  
  const preset = PRESETS.find(p => p.value === val)
  if (preset) {
    return { start: null, end: null, relativeLabel: preset.label }
  }

  // Check if it matches absolute format: YYYY/MM/DD to YYYY/MM/DD
  const match = val.match(/^(\d{4})[/-](\d{2})[/-](\d{2})\s+to\s+(\d{4})[/-](\d{2})[/-](\d{2})$/)
  if (match) {
    const start = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    const end = new Date(Number(match[4]), Number(match[5]) - 1, Number(match[6]))
    return { start, end, relativeLabel: '' }
  }

  return { start: null, end: null, relativeLabel: DateRangePickerText.CUSTOM_FILTER }
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = DateRangePickerText.PLACEHOLDER,
  align = 'left',
  disabled = false,
  visible = true,
}) => {
  const { setIsFiltering } = usePortal()
  const { i18n } = useLingui()
  const getLabel = (lbl: any) => (typeof lbl === "string" ? lbl : i18n._(lbl));
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left?: number; right?: number } | null>(null)

  const updatePopoverPosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const top = rect.bottom + 8
    if (align === 'right') {
      const right = window.innerWidth - rect.right
      setPopoverCoords({ top, right })
    } else {
      setPopoverCoords({ top, left: rect.left })
    }
  }, [align])

  useEffect(() => {
    if (isOpen) {
      updatePopoverPosition()
      window.addEventListener('resize', updatePopoverPosition)
      window.addEventListener('scroll', updatePopoverPosition, true)
      return () => {
        window.removeEventListener('resize', updatePopoverPosition)
        window.removeEventListener('scroll', updatePopoverPosition, true)
      }
    }
  }, [isOpen, updatePopoverPosition])

  // Synchronize filter active state with global context
  useEffect(() => {
    setIsFiltering(isOpen)
    return () => {
      setIsFiltering(false)
    }
  }, [isOpen, setIsFiltering])

  // Parse current value
  const parsed = useMemo(() => parseLookerFilter(value), [value])

  // Local state for picker
  const [startDate, setStartDate] = useState<Date | null>(parsed.start)
  const [endDate, setEndDate] = useState<Date | null>(parsed.end)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  
  // Track currently viewed month/year in calendar
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    return parsed.start || new Date()
  })

  // Synchronize local states when prop changes or modal opens/closes
  useEffect(() => {
    setStartDate(parsed.start)
    setEndDate(parsed.end)
    if (parsed.start) {
      setCurrentMonth(parsed.start)
    }
  }, [parsed, isOpen])

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedTrigger = containerRef.current && containerRef.current.contains(event.target as Node)
      const clickedPopover = popoverRef.current && popoverRef.current.contains(event.target as Node)
      if (!clickedTrigger && !clickedPopover) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Quick select preset handler
  const handlePresetSelect = (presetVal: string) => {
    onChange(presetVal)
    setIsOpen(false)
  }

  // Calendar click handler
  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date)
      setEndDate(null)
    } else if (startDate && !endDate) {
      if (date < startDate) {
        setStartDate(date)
      } else {
        setEndDate(date)
      }
    }
  }

  // Handle Apply button
  const handleApply = () => {
    if (startDate && endDate) {
      const formatted = `${formatDate(startDate)} to ${formatDate(endDate)}`
      onChange(formatted)
      setIsOpen(false)
    }
  }

  // Handle Cancel/Clear
  const handleClear = () => {
    setStartDate(null)
    setEndDate(null)
    setHoveredDate(null)
    onChange('')
    setIsOpen(false)
  }

  // Month navigation
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDayIndex = new Date(year, month, 1).getDay()
    const numDays = new Date(year, month + 1, 0).getDate()
    const prevNumDays = new Date(year, month, 0).getDate()

    const days: { date: Date; isCurrentMonth: boolean }[] = []

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevNumDays - i),
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let i = 1; i <= numDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    // Next month padding (to make grid uniform 6 rows * 7 days = 42 cells)
    const remainingCells = 42 - days.length
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }, [currentMonth])

  // Text display for current selection
  const displayText = useMemo(() => {
    if (parsed.relativeLabel) {
      return getLabel(parsed.relativeLabel)
    }
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    }
    if (startDate) {
      return `${formatDate(startDate)} - ...`
    }
    return getLabel(placeholder)
  }, [parsed, startDate, endDate, placeholder, i18n])

  const isSelected = (date: Date) => {
    if (startDate && date.getTime() === startDate.getTime()) return true
    if (endDate && date.getTime() === endDate.getTime()) return true
    return false
  }

  const isInRange = (date: Date) => {
    if (startDate && endDate) {
      return date > startDate && date < endDate
    }
    if (startDate && hoveredDate && !endDate) {
      return date > startDate && date < hoveredDate
    }
    return false
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    top: popoverCoords ? `${popoverCoords.top}px` : '-9999px',
    ...(popoverCoords?.right !== undefined ? { right: `${popoverCoords.right}px` } : {}),
    ...(popoverCoords?.left !== undefined ? { left: `${popoverCoords.left}px` } : {}),
    zIndex: 9999,
  }

  return (
    <div className={`${styles.datePickerContainer} ${visible ? styles.open : ''}`} ref={containerRef}>
      <button
        type="button"
        className={`${styles.datePickerTrigger} ${isOpen ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <CalendarIcon size={16} className={styles.datePickerIcon} />
        <span className={styles.datePickerValue}>{displayText}</span>
        {value && (
          <span
            className={styles.datePickerClearBtn}
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            role="button"
            tabIndex={0}
            aria-label="Clear date filter"
          >
            <X size={12} />
          </span>
        )}
      </button>
        
      {typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={popoverStyle}
          className={`${styles.datePickerPopover} ${align === 'right' ? styles.alignRight : styles.alignLeft} ${isOpen ? styles.open : ''}`}
        >
          <div className={styles.datePickerPresets}>
            {PRESETS.map((preset) => (
              <button
                key={preset.value || 'all'}
                type="button"
                className={`${styles.presetBtn} ${value === preset.value ? styles.active : ''}`}
                onClick={() => handlePresetSelect(preset.value)}
              >
                {getLabel(preset.label)}
              </button>
            ))}
          </div>

          <div className={styles.datePickerCalendarSection}>
            <div className={styles.datePickerCalendarHeader}>
              <button type="button" className={styles.navBtn} onClick={prevMonth}>
                <ChevronLeft size={16} />
              </button>
              <span className={styles.currentMonthYear}>
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button type="button" className={styles.navBtn} onClick={nextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className={styles.datePickerCalendarGrid}>
              {[DateRangePickerText.DAY_SU, DateRangePickerText.DAY_MO, DateRangePickerText.DAY_TU, DateRangePickerText.DAY_WE, DateRangePickerText.DAY_TH, DateRangePickerText.DAY_FR, DateRangePickerText.DAY_SA].map((day, idx) => (
                <div key={idx} className={styles.gridHeaderCell}>
                  {getLabel(day)}
                </div>
              ))}
              {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                const selected = isSelected(date)
                const inRange = isInRange(date)
                const start = startDate && date.getTime() === startDate.getTime()
                const end = endDate && date.getTime() === endDate.getTime()
                const today = isToday(date)

                return (
                  <button
                    key={`${date.getTime()}-${idx}`}
                    type="button"
                    className={`${styles.dayCell} ${!isCurrentMonth ? styles.differentMonth : ''} ${
                      selected ? styles.selected : ''
                    } ${inRange ? styles.inRange : ''} ${start ? styles.rangeStart : ''} ${
                      end ? styles.rangeEnd : ''
                    } ${today ? styles.today : ''}`}
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => startDate && !endDate && setHoveredDate(date)}
                  >
                    <span>{date.getDate()}</span>
                  </button>
                )
              })}
            </div>

            <div className={styles.datePickerFooter}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleClear}>
                {i18n._(DateRangePickerText.CLEAR_BTN)}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!startDate || !endDate}
                onClick={handleApply}
              >
                {i18n._(DateRangePickerText.APPLY_BTN)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
