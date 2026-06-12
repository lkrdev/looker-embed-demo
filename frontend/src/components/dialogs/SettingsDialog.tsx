import { useState } from 'react'
import { X, ChevronRight, ArrowLeft, User, Globe, Building, Code, Check } from 'lucide-react'
import { usePortal } from '../../context/PortalContext'
import { LANGUAGE_OPTIONS, BRAND_OPTIONS } from '../../config/constants'
import type { ViewType } from '../../types'

export function SettingsDialog() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    selectedType,
    setEmbedType,
    language,
    setLanguage,
    brand,
    setBrand,
    sourceEnabled,
    setSourceEnabled,
    isCollapsed
  } = usePortal()

  const [currentView, setCurrentView] = useState<ViewType>('main')

  if (!isSettingsOpen) return null

  const handleClose = () => {
    setIsSettingsOpen(false)
    setCurrentView('main')
  }

  const handleBack = () => {
    setCurrentView('main')
  }

  const languageOptions = LANGUAGE_OPTIONS
  const brandOptions = BRAND_OPTIONS

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className={`modal-container ${isCollapsed ? 'collapsed' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          {currentView !== 'main' && (
            <button className="modal-back-btn" onClick={handleBack} aria-label="Go back">
              <ArrowLeft size={18} />
            </button>
          )}
          <h2 className="modal-title">
            {currentView === 'main' && 'Settings'}
            {currentView === 'userType' && 'User Type'}
            {currentView === 'language' && 'Language'}
            {currentView === 'brand' && 'Brand'}
          </h2>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {currentView === 'main' && (
            <div className="settings-list">
              {/* User Type Row */}
              <button className="settings-row" onClick={() => setCurrentView('userType')}>
                <div className="settings-row-icon bg-primary-light text-primary">
                  <User size={18} />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-label">User Type</span>
                  <span className="settings-row-value">
                    {selectedType === 'simple' ? 'Simple User' : 'Advanced User'}
                  </span>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </button>

              {/* Language Row */}
              <button className="settings-row" onClick={() => setCurrentView('language')}>
                <div className="settings-row-icon bg-accent-light text-accent">
                  <Globe size={18} />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-label">Language</span>
                  <span className="settings-row-value">{language}</span>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </button>

              {/* Brand Row */}
              <button className="settings-row" onClick={() => setCurrentView('brand')}>
                <div className="settings-row-icon bg-success-light text-success">
                  <Building size={18} />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-label">Brand</span>
                  <span className="settings-row-value">{brand}</span>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </button>

              <div className="settings-divider" />

              {/* Source Row (Toggle) */}
              <div className="settings-row no-hover">
                <div className="settings-row-icon bg-info-light text-info">
                  <Code size={18} />
                </div>
                <div className="settings-row-content">
                  <span className="settings-row-label">Source</span>
                  <span className="settings-row-desc font-normal">Enable development source data</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={sourceEnabled}
                    onChange={(e) => setSourceEnabled(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          )}

          {/* User Type Sub-dialog */}
          {currentView === 'userType' && (
            <div className="sub-settings-list">
              <button
                className={`sub-settings-option ${selectedType === 'simple' ? 'selected' : ''}`}
                onClick={() => {
                  setEmbedType('simple')
                  handleBack()
                }}
              >
                <div className="sub-option-details">
                  <span className="sub-option-title">Simple Embed User</span>
                  <span className="sub-option-desc">
                    View and query metrics with standard dashboard interaction levels.
                  </span>
                </div>
                {selectedType === 'simple' && <Check size={18} className="text-primary" />}
              </button>

              <button
                className={`sub-settings-option ${selectedType === 'advanced' ? 'selected' : ''}`}
                onClick={() => {
                  setEmbedType('advanced')
                  handleBack()
                }}
              >
                <div className="sub-option-details">
                  <span className="sub-option-title">Advanced Embed User</span>
                  <span className="sub-option-desc">
                    Create, customize layouts, perform drill downs and save agent templates.
                  </span>
                </div>
                {selectedType === 'advanced' && <Check size={18} className="text-primary" />}
              </button>
            </div>
          )}

          {/* Language Sub-dialog */}
          {currentView === 'language' && (
            <div className="sub-settings-list">
              {languageOptions.map((lang) => (
                <button
                  key={lang}
                  className={`sub-settings-option-item ${language === lang ? 'selected' : ''}`}
                  onClick={() => {
                    setLanguage(lang)
                    handleBack()
                  }}
                >
                  <span className="sub-option-item-title">{lang}</span>
                  {language === lang && <Check size={18} className="text-accent" />}
                </button>
              ))}
            </div>
          )}

          {/* Brand Sub-dialog */}
          {currentView === 'brand' && (
            <div className="sub-settings-list">
              {brandOptions.map((brnd) => (
                <button
                  key={brnd}
                  className={`sub-settings-option-item ${brand === brnd ? 'selected' : ''}`}
                  onClick={() => {
                    setBrand(brnd)
                    handleBack()
                  }}
                >
                  <span className="sub-option-item-title">{brnd}</span>
                  {brand === brnd && <Check size={18} className="text-success" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
