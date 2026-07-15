import React, { useEffect } from 'react'
import {
  X,
  Check,
  Sparkles,
  Compass,
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useLingui } from '@lingui/react'
import { useNavigate } from '@tanstack/react-router'
import { usePortal } from '../../../context/PortalContext'
import { isRouteGated } from '../../../config/constants'
import { UpgradeModalText } from '../../../config/UpgradeModal'
import type { EmbedType } from '../../../types'
import styles from './UpgradeModal.module.css'

interface TierConfig {
  id: EmbedType
  title: any
  roleLabel: any
  description: any
  badge?: any
  badgeVariant?: 'popular' | 'enterprise'
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconBg: string
  iconColor: string
  features: any[]
}

export function UpgradeModal() {
  const { i18n } = useLingui()
  const navigate = useNavigate()
  const {
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    selectedType,
    setEmbedType,
    upgradeModalTargetRoute,
    brand,
  } = usePortal()

  useEffect(() => {
    if (!isUpgradeModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUpgradeModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isUpgradeModalOpen, setIsUpgradeModalOpen])

  if (!isUpgradeModalOpen) return null

  const tiers: TierConfig[] = [
    {
      id: 'simple',
      title: UpgradeModalText.TIER_SIMPLE_TITLE,
      roleLabel: UpgradeModalText.TIER_SIMPLE_ROLE,
      description: UpgradeModalText.TIER_SIMPLE_DESC,
      icon: User,
      iconBg: 'bg-primary-light',
      iconColor: 'text-primary',
      features: [
        UpgradeModalText.FEAT_SIMPLE_1,
        UpgradeModalText.FEAT_SIMPLE_2,
        UpgradeModalText.FEAT_SIMPLE_3,
      ],
    },
    {
      id: 'gemini',
      title: UpgradeModalText.TIER_GEMINI_TITLE,
      roleLabel: UpgradeModalText.TIER_GEMINI_ROLE,
      description: UpgradeModalText.TIER_GEMINI_DESC,
      badge: UpgradeModalText.RECOMMENDED_BADGE,
      badgeVariant: 'popular',
      icon: Sparkles,
      iconBg: 'bg-accent-light',
      iconColor: 'text-accent',
      features: [
        UpgradeModalText.FEAT_GEMINI_1,
        UpgradeModalText.FEAT_GEMINI_2,
        UpgradeModalText.FEAT_GEMINI_3,
        UpgradeModalText.FEAT_GEMINI_4,
      ],
    },
    {
      id: 'advanced',
      title: UpgradeModalText.TIER_ADVANCED_TITLE,
      roleLabel: UpgradeModalText.TIER_ADVANCED_ROLE,
      description: UpgradeModalText.TIER_ADVANCED_DESC,
      badge: UpgradeModalText.FULL_ACCESS_BADGE,
      badgeVariant: 'enterprise',
      icon: Compass,
      iconBg: 'bg-success-light',
      iconColor: 'text-success',
      features: [
        UpgradeModalText.FEAT_ADVANCED_1,
        UpgradeModalText.FEAT_ADVANCED_2,
        UpgradeModalText.FEAT_ADVANCED_3,
        UpgradeModalText.FEAT_ADVANCED_4,
      ],
    },
  ]

  const handleSelectPlan = (planId: EmbedType) => {
    setEmbedType(planId)
    setIsUpgradeModalOpen(false)

    if (
      upgradeModalTargetRoute &&
      !isRouteGated(upgradeModalTargetRoute, planId)
    ) {
      navigate({ to: upgradeModalTargetRoute, viewTransition: true })
    }
  }

  return (
    <div
      className={styles.upgradeModalOverlay}
      onClick={() => setIsUpgradeModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className={styles.upgradeModalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={styles.upgradeModalHeader}>
          <div className={styles.upgradeModalTitleArea}>
            <div className={styles.upgradeHeaderBadge}>
              <Sparkles size={14} className="text-accent" />
              <span>{brand} {i18n._(UpgradeModalText.HEADER_BADGE)}</span>
            </div>
            <h2 id="upgrade-modal-title" className={styles.upgradeModalTitle}>
              {i18n._(UpgradeModalText.TITLE)}
            </h2>
            <p className={styles.upgradeModalSubtitle}>
              {i18n._(UpgradeModalText.SUBTITLE)}
            </p>
          </div>
          <button
            type="button"
            className={styles.upgradeModalCloseBtn}
            onClick={() => setIsUpgradeModalOpen(false)}
            aria-label={i18n._(UpgradeModalText.CTA_CLOSE)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Target Route Notice Alert */}
        {upgradeModalTargetRoute && (
          <div className={styles.upgradeModalAlert}>
            <div className={styles.upgradeModalAlertIcon}>
              <Lock size={16} />
            </div>
            <div className={styles.upgradeModalAlertText}>
              <span>{i18n._(UpgradeModalText.ROUTE_LOCKED_ALERT)}</span>
            </div>
          </div>
        )}

        {/* 3-Column Tier Grid */}
        <div className={styles.upgradePlansGrid}>
          {tiers.map((tier) => {
            const Icon = tier.icon
            const isCurrent = selectedType === tier.id
            const isTargetUnlocked =
              upgradeModalTargetRoute &&
              !isRouteGated(upgradeModalTargetRoute, tier.id)

            return (
              <div
                key={tier.id}
                className={`${styles.upgradePlanCard} ${isCurrent ? styles.currentTier : ''} ${
                  tier.badgeVariant === 'popular' ? styles.popularTier : ''
                } ${tier.badgeVariant === 'enterprise' ? styles.enterpriseTier : ''}`}
              >
                {tier.badge && (
                  <div
                    className={`${styles.upgradePlanBadge} ${
                      tier.badgeVariant === 'popular'
                        ? styles.badgePopular
                        : styles.badgeEnterprise
                    }`}
                  >
                    {tier.badgeVariant === 'popular' && <Zap size={12} />}
                    {tier.badgeVariant === 'enterprise' && (
                      <ShieldCheck size={12} />
                    )}
                    <span>{i18n._(tier.badge)}</span>
                  </div>
                )}

                <div className={styles.upgradePlanHeader}>
                  <div className={`${styles.upgradePlanIcon} ${tier.iconBg}`}>
                    <Icon size={22} className={tier.iconColor} />
                  </div>
                  <div className={styles.upgradePlanMeta}>
                    <span className={styles.upgradePlanRole}>
                      {i18n._(tier.roleLabel)}
                    </span>
                    <h3 className={styles.upgradePlanTitle}>{i18n._(tier.title)}</h3>
                  </div>
                </div>

                <p className={styles.upgradePlanDesc}>
                  {i18n._(tier.description)}
                </p>

                <div className={styles.upgradePlanDivider} />

                <ul className={styles.upgradePlanFeatures}>
                  {tier.features.map((feat, index) => (
                    <li key={index} className={styles.upgradePlanFeatureItem}>
                      <span className={styles.upgradeCheckIcon}>
                        <Check size={15} />
                      </span>
                      <span>{i18n._(feat)}</span>
                    </li>
                  ))}
                </ul>

                <div className={styles.upgradePlanFooter}>
                  {isCurrent ? (
                    <button
                      type="button"
                      className={`btn ${styles.upgradePlanBtn} ${styles.upgradeBtnCurrent}`}
                      disabled
                    >
                      <span>{i18n._(UpgradeModalText.CTA_ACTIVE)}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`btn ${styles.upgradePlanBtn} ${
                        tier.badgeVariant === 'popular'
                          ? styles.upgradeBtnPopular
                          : styles.upgradeBtnPrimary
                      }`}
                      onClick={() => handleSelectPlan(tier.id)}
                    >
                      <span>{i18n._(UpgradeModalText.CTA_SWITCH)}</span>
                      {isTargetUnlocked && <ArrowRight size={16} />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal Footer */}
        <div className={styles.upgradeModalFooter}>
          <button
            type="button"
            className={`btn btn-secondary ${styles.upgradeFooterCloseBtn}`}
            onClick={() => setIsUpgradeModalOpen(false)}
          >
            {i18n._(UpgradeModalText.CTA_CLOSE)}
          </button>
        </div>
      </div>
    </div>
  )
}
