import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { usePortal } from '../../context/PortalContext'

import { DEFAULT_USER_NAME, USER_ROLE_MAPPINGS } from '../../config/constants'
import { useLingui } from '@lingui/react'
import { UserDetailsDialog as UserDetailsDialogText } from '../../config/UserDetailsDialog'

export function UserDetailsDialog() {
  const { i18n } = useLingui()
  const getLabel = (lbl: any) => (typeof lbl === "string" ? lbl : i18n._(lbl));
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    selectedType,
    language,
    brand,
    sourceEnabled,
    activeEndpoint,
    lookerHost,
    isCollapsed,
    lookerUser,
  } = usePortal()

  const [copied, setCopied] = useState(false)

  if (!isProfileModalOpen) return null

  const handleClose = () => {
    setIsProfileModalOpen(false)
    setCopied(false)
  }

  const userSettingsJson = {
    name: DEFAULT_USER_NAME,
    userType: getLabel(USER_ROLE_MAPPINGS[selectedType]),
    language: language,
    brand: brand,
    source: sourceEnabled ? i18n._(UserDetailsDialogText.ENABLED) : i18n._(UserDetailsDialogText.DISABLED),
    activeEndpoint: activeEndpoint,
    lookerHost: lookerHost
  }


  const jsonString = lookerUser
    ? JSON.stringify(lookerUser.looker_user, null, 2)
    : JSON.stringify(userSettingsJson, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className={`modal-container user-details-modal ${isCollapsed ? 'collapsed' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">{i18n._(UserDetailsDialogText.TITLE)}</h2>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close details">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body user-details-body">
          <div className="json-container user-details-json-wrapper">
            <button
              onClick={handleCopy}
              className="copy-btn user-details-copy-btn"
              title={i18n._(UserDetailsDialogText.COPY_TITLE)}
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </button>
            <pre className="user-details-pre">
              {jsonString}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
