import * as React from 'react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { usePortal } from '../../context/PortalContext'
export interface DateRangePickerProps {
  value: string // Looker filter expression: e.g. "7 days", "2026/06/01 to 2026/06/10", or ""
  onChange: (value: string) => void
  placeholder?: string
  align?: 'left' | 'right'
}

interface Preset {
  label: string
  value: string
}

const PRESETS: Preset[] = [
  { label: 'All Time', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7 days' },
  { label: 'Last 30 Days', value: '30 days' },
  { label: 'This Month', value: 'this month' },
  { label: 'Last Month', value: 'last month' },
]

// Helper to format Date as YYYY/MM/DD
const formatDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}/${m}/${d}`
}

// Helper to parse Looker filter string into JS Dates if absolute
const parseLookerFilter = (val: string): { start: Date | null; end: Date | null; relativeLabel: string } => {
  if (!val) return { start: null, end: null, relativeLabel: 'All Time' }
  
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

  return { start: null, end: null, relativeLabel: 'Custom Filter' }
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select Date Range',
  align = 'left',
}) => {
  const { setIsFiltering } = usePortal()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Synchronize local states when prop changes
  useEffect(() => {
    setStartDate(parsed.start)
    setEndDate(parsed.end)
    if (parsed.start) {
      setCurrentMonth(parsed.start)
    }
  }, [parsed])

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
      return parsed.relativeLabel
    }
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    }
    if (startDate) {
      return `${formatDate(startDate)} - ...`
    }
    return placeholder
  }, [parsed, startDate, endDate, placeholder])

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

  return (
    <div className="date-picker-container" ref={containerRef}>
      <button
        type="button"
        className={`date-picker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CalendarIcon size={16} className="date-picker-icon" />
        <span className="date-picker-value">{displayText}</span>
        {value && (
          <span
            className="date-picker-clear-btn"
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

      {isOpen && (
        <div className={`date-picker-popover card glass shadow-lg align-${align}`}>
          <div className="date-picker-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`preset-btn ${value === preset.value ? 'active' : ''}`}
                onClick={() => handlePresetSelect(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="date-picker-calendar-section">
            <div className="date-picker-calendar-header">
              <button type="button" className="nav-btn" onClick={prevMonth}>
                <ChevronLeft size={16} />
              </button>
              <span className="current-month-year">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button type="button" className="nav-btn" onClick={nextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="date-picker-calendar-grid">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="grid-header-cell">
                  {day}
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
                    className={`day-cell ${!isCurrentMonth ? 'different-month' : ''} ${
                      selected ? 'selected' : ''
                    } ${inRange ? 'in-range' : ''} ${start ? 'range-start' : ''} ${
                      end ? 'range-end' : ''
                    } ${today ? 'today' : ''}`}
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => startDate && !endDate && setHoveredDate(date)}
                  >
                    <span>{date.getDate()}</span>
                  </button>
                )
              })}
            </div>

            <div className="date-picker-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleClear}>
                Clear
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!startDate || !endDate}
                onClick={handleApply}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
