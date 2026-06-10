import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { usePortal } from '../context/PortalContext'

export function UserDetailsDialog() {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    selectedType,
    language,
    company,
    sourceEnabled,
    activeEndpoint,
    lookerHost,
    isCollapsed
  } = usePortal()

  const [copied, setCopied] = useState(false)

  if (!isProfileModalOpen) return null

  const handleClose = () => {
    setIsProfileModalOpen(false)
    setCopied(false)
  }

  const userSettingsJson = {
    name: 'Demo User',
    userType: selectedType === 'simple' ? 'Simple User' : 'Advanced User',
    language: language,
    company: company,
    source: sourceEnabled ? 'Enabled' : 'Disabled',
    activeEndpoint: activeEndpoint,
    lookerHost: lookerHost
  }

  const jsonString = JSON.stringify(userSettingsJson, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className={`modal-container ${isCollapsed ? 'collapsed' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '40vw', height: '40vh' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">User Details</h2>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close details">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: 'var(--space-4) var(--space-5) var(--space-5) var(--space-5)', height: '100%' }}>
          <div className="json-container" style={{ position: 'relative', height: '100%' }}>
            <button
              onClick={handleCopy}
              className="copy-btn"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: 'var(--text-muted)',
                padding: 'var(--space-1-5)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Copy JSON to clipboard"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </button>
            <pre
              style={{
                margin: 0,
                padding: 'var(--space-4)',
                backgroundColor: 'var(--background)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                overflowX: 'auto',
                fontSize: 'var(--text-lg)',
                fontFamily: 'monospace',
                color: 'var(--text)',
                lineHeight: '1.5',
                height: '100%'
              }}
            >
              {jsonString}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
