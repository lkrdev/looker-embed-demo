import { useState } from 'react'
import { X, ChevronRight, ArrowLeft, User, Globe, Building, Code, Check } from 'lucide-react'
import { usePortal } from '../../context/PortalContext'
import { LANGUAGE_OPTIONS, BRAND_OPTIONS, USER_ROLE_MAPPINGS, getRoleUserObject } from '../../config/constants'
import type { ViewType, EmbedType } from '../../types'
import { useLingui } from '@lingui/react'
import { UserObjectFlyout } from '../ui/UserObjectFlyout'
import { SettingsDialog as SettingsDialogText } from '../../config/SettingsDialog'

export function SettingsDialog() {
  const { i18n } = useLingui()
  const getLabel = (lbl: any) => (typeof lbl === "string" ? lbl : i18n._(lbl));
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
    isCollapsed,
    lookerUser
  } = usePortal()

  const [currentView, setCurrentView] = useState<ViewType>('main')
  const [hoveredRole, setHoveredRole] = useState<EmbedType | null>(null)

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
            {currentView === 'main' && i18n._(SettingsDialogText.TITLE_MAIN)}
            {currentView === 'userType' && i18n._(SettingsDialogText.TITLE_USER_TYPE)}
            {currentView === 'language' && i18n._(SettingsDialogText.TITLE_LANGUAGE)}
            {currentView === 'brand' && i18n._(SettingsDialogText.TITLE_BRAND)}
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
                  <span className="settings-row-label">{i18n._(SettingsDialogText.LABEL_USER_TYPE)}</span>
                  <span className="settings-row-value">
                    {getLabel(USER_ROLE_MAPPINGS[selectedType])}
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
                  <span className="settings-row-label">{i18n._(SettingsDialogText.LABEL_LANGUAGE)}</span>
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
                  <span className="settings-row-label">{i18n._(SettingsDialogText.LABEL_BRAND)}</span>
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
                  <span className="settings-row-label">{i18n._(SettingsDialogText.LABEL_SOURCE)}</span>
                  <span className="settings-row-desc font-normal">{i18n._(SettingsDialogText.DESC_SOURCE)}</span>
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
            <div className="sub-settings-list" onMouseLeave={() => setHoveredRole(null)}>
              <button
                className={`sub-settings-option ${selectedType === 'simple' ? 'selected' : ''}`}
                onMouseEnter={() => setHoveredRole('simple')}
                onClick={() => {
                  setEmbedType('simple')
                  handleBack()
                }}
              >
                <div className="sub-option-details">
                  <span className="sub-option-title">{i18n._(SettingsDialogText.OPT_SIMPLE_TITLE)}</span>
                  <span className="sub-option-desc">
                    {i18n._(SettingsDialogText.OPT_SIMPLE_DESC)}
                  </span>
                </div>
                {selectedType === 'simple' && <Check size={18} className="text-primary" />}
              </button>

              <button
                className={`sub-settings-option ${selectedType === 'gemini' ? 'selected' : ''}`}
                onMouseEnter={() => setHoveredRole('gemini')}
                onClick={() => {
                  setEmbedType('gemini')
                  handleBack()
                }}
              >
                <div className="sub-option-details">
                  <span className="sub-option-title">{i18n._(SettingsDialogText.OPT_GEMINI_TITLE)}</span>
                  <span className="sub-option-desc">
                    {i18n._(SettingsDialogText.OPT_GEMINI_DESC)}
                  </span>
                </div>
                {selectedType === 'gemini' && <Check size={18} className="text-primary" />}
              </button>

              <button
                className={`sub-settings-option ${selectedType === 'advanced' ? 'selected' : ''}`}
                onMouseEnter={() => setHoveredRole('advanced')}
                onClick={() => {
                  setEmbedType('advanced')
                  handleBack()
                }}
              >
                <div className="sub-option-details">
                  <span className="sub-option-title">{i18n._(SettingsDialogText.OPT_ADVANCED_TITLE)}</span>
                  <span className="sub-option-desc">
                    {i18n._(SettingsDialogText.OPT_ADVANCED_DESC)}
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
        {currentView === 'userType' && hoveredRole && (
          <UserObjectFlyout
            userObject={getRoleUserObject(hoveredRole, lookerUser, language, brand)}
            title={`${getLabel(USER_ROLE_MAPPINGS[hoveredRole])} ${i18n._(SettingsDialogText.PAYLOAD_SUFFIX)}`}
          />
        )}
      </div>
    </div>
  )
}
