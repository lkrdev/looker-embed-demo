import { useState } from 'react'
import { X, ChevronRight, ArrowLeft, User, Globe, Building, Code, Check } from 'lucide-react'
import { usePortal } from '../../../context/PortalContext'
import { LANGUAGE_OPTIONS, BRAND_OPTIONS, USER_ROLE_MAPPINGS, getRoleUserObject } from '../../../config/constants'
import type { ViewType, EmbedType } from '../../../types'
import { useLingui } from '@lingui/react'
import { UserObjectFlyout } from '../../ui/UserObjectFlyout'
import { SettingsDialog as SettingsDialogText } from '../../../config/SettingsDialog'
import styles from './SettingsDialog.module.css'

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
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={`${styles.modalContainer} ${isCollapsed ? styles.collapsed : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          {currentView !== 'main' && (
            <button className={styles.modalBackBtn} onClick={handleBack} aria-label="Go back">
              <ArrowLeft size={18} />
            </button>
          )}
          <h2 className={styles.modalTitle}>
            {currentView === 'main' && i18n._(SettingsDialogText.TITLE_MAIN)}
            {currentView === 'userType' && i18n._(SettingsDialogText.TITLE_USER_TYPE)}
            {currentView === 'language' && i18n._(SettingsDialogText.TITLE_LANGUAGE)}
            {currentView === 'brand' && i18n._(SettingsDialogText.TITLE_BRAND)}
          </h2>
          <button className={styles.modalCloseBtn} onClick={handleClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {currentView === 'main' && (
            <div className={styles.settingsList}>
              {/* User Type Row */}
              <button className={styles.settingsRow} onClick={() => setCurrentView('userType')}>
                <div className={`${styles.settingsRowIcon} bg-primary-light text-primary`}>
                  <User size={18} />
                </div>
                <div className={styles.settingsRowContent}>
                  <span className={styles.settingsRowLabel}>{i18n._(SettingsDialogText.LABEL_USER_TYPE)}</span>
                  <span className={styles.settingsRowValue}>
                    {getLabel(USER_ROLE_MAPPINGS[selectedType])}
                  </span>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </button>

              {/* Language Row */}
              <button className={styles.settingsRow} onClick={() => setCurrentView('language')}>
                <div className={`${styles.settingsRowIcon} bg-accent-light text-accent`}>
                  <Globe size={18} />
                </div>
                <div className={styles.settingsRowContent}>
                  <span className={styles.settingsRowLabel}>{i18n._(SettingsDialogText.LABEL_LANGUAGE)}</span>
                  <span className={styles.settingsRowValue}>{language}</span>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </button>

              {/* Brand Row */}
              <button className={styles.settingsRow} onClick={() => setCurrentView('brand')}>
                <div className={`${styles.settingsRowIcon} bg-success-light text-success`}>
                  <Building size={18} />
                </div>
                <div className={styles.settingsRowContent}>
                  <span className={styles.settingsRowLabel}>{i18n._(SettingsDialogText.LABEL_BRAND)}</span>
                  <span className={styles.settingsRowValue}>{brand}</span>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </button>

              <div className={styles.settingsDivider} />

              {/* Source Row (Toggle) */}
              <div className={`${styles.settingsRow} ${styles.noHover}`}>
                <div className={`${styles.settingsRowIcon} bg-info-light text-info`}>
                  <Code size={18} />
                </div>
                <div className={styles.settingsRowContent}>
                  <span className={styles.settingsRowLabel}>{i18n._(SettingsDialogText.LABEL_SOURCE)}</span>
                  <span className={`${styles.settingsRowDesc} font-normal`}>{i18n._(SettingsDialogText.DESC_SOURCE)}</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={sourceEnabled}
                    onChange={(e) => setSourceEnabled(e.target.checked)}
                  />
                  <span className={`${styles.slider} ${styles.round}`}></span>
                </label>
              </div>
            </div>
          )}

          {/* User Type Sub-dialog */}
          {currentView === 'userType' && (
            <div className={styles.subSettingsList} onMouseLeave={() => setHoveredRole(null)}>
              <button
                className={`${styles.subSettingsOption} ${selectedType === 'simple' ? styles.selected : ''}`}
                onMouseEnter={() => setHoveredRole('simple')}
                onClick={() => {
                  setEmbedType('simple')
                  handleBack()
                }}
              >
                <div className={styles.subOptionDetails}>
                  <span className={styles.subOptionTitle}>{i18n._(SettingsDialogText.OPT_SIMPLE_TITLE)}</span>
                  <span className={styles.subOptionDesc}>
                    {i18n._(SettingsDialogText.OPT_SIMPLE_DESC)}
                  </span>
                </div>
                {selectedType === 'simple' && <Check size={18} className="text-primary" />}
              </button>

              <button
                className={`${styles.subSettingsOption} ${selectedType === 'gemini' ? styles.selected : ''}`}
                onMouseEnter={() => setHoveredRole('gemini')}
                onClick={() => {
                  setEmbedType('gemini')
                  handleBack()
                }}
              >
                <div className={styles.subOptionDetails}>
                  <span className={styles.subOptionTitle}>{i18n._(SettingsDialogText.OPT_GEMINI_TITLE)}</span>
                  <span className={styles.subOptionDesc}>
                    {i18n._(SettingsDialogText.OPT_GEMINI_DESC)}
                  </span>
                </div>
                {selectedType === 'gemini' && <Check size={18} className="text-primary" />}
              </button>

              <button
                className={`${styles.subSettingsOption} ${selectedType === 'advanced' ? styles.selected : ''}`}
                onMouseEnter={() => setHoveredRole('advanced')}
                onClick={() => {
                  setEmbedType('advanced')
                  handleBack()
                }}
              >
                <div className={styles.subOptionDetails}>
                  <span className={styles.subOptionTitle}>{i18n._(SettingsDialogText.OPT_ADVANCED_TITLE)}</span>
                  <span className={styles.subOptionDesc}>
                    {i18n._(SettingsDialogText.OPT_ADVANCED_DESC)}
                  </span>
                </div>
                {selectedType === 'advanced' && <Check size={18} className="text-primary" />}
              </button>
            </div>
          )}

          {/* Language Sub-dialog */}
          {currentView === 'language' && (
            <div className={styles.subSettingsList}>
              {languageOptions.map((lang) => (
                <button
                  key={lang}
                  className={`${styles.subSettingsOptionItem} ${language === lang ? styles.selected : ''}`}
                  onClick={() => {
                    setLanguage(lang)
                    handleBack()
                  }}
                >
                  <span className={styles.subOptionItemTitle}>{lang}</span>
                  {language === lang && <Check size={18} className="text-accent" />}
                </button>
              ))}
            </div>
          )}

          {/* Brand Sub-dialog */}
          {currentView === 'brand' && (
            <div className={styles.subSettingsList}>
              {brandOptions.map((brnd) => (
                <button
                  key={brnd}
                  className={`${styles.subSettingsOptionItem} ${brand === brnd ? styles.selected : ''}`}
                  onClick={() => {
                    setBrand(brnd)
                    handleBack()
                  }}
                >
                  <span className={styles.subOptionItemTitle}>{brnd}</span>
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
