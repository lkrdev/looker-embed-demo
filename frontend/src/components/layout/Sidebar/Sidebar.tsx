import { Link } from "@tanstack/react-router";
import { useLingui } from "@lingui/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Compass,
  FileSpreadsheet,
  FileText,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { useState } from "react";
import {
  DEFAULT_USER_NAME,
  getRoleUserObject,
  isRouteGated,
  PORTAL_NAV_ITEMS,
  USER_ROLE_MAPPINGS,
} from "../../../config/constants";
import { usePortal } from "../../../context/PortalContext";
import { clearAuthSession } from "../../../utils/auth";
import { LookerLogo } from "../LookerLogo";
import { UserObjectFlyout } from "../../ui/UserObjectFlyout";
import { SettingsDialog as SettingsDialogText } from "../../../config/SettingsDialog";
import { Sidebar as SidebarText } from "../../../config/Sidebar";
import styles from "./Sidebar.module.css";

const ICON_MAP = {
  Home,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Compass,
  FileSpreadsheet,
  FileText,
} as const;

export function Sidebar() {
  const { i18n } = useLingui();
  const getLabel = (lbl: any) => (typeof lbl === "string" ? lbl : i18n._(lbl));
  const {
    isCollapsed,
    setIsCollapsed,
    selectedType,
    theme,
    toggleTheme,
    setIsSettingsOpen,
    setIsProfileModalOpen,
    lookerUser,
    language,
    brand,
    openUpgradeModal,
  } = usePortal();
  const queryClient = useQueryClient();
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);
  const [isThemeHovered, setIsThemeHovered] = useState(false);
  const [isSettingsHovered, setIsSettingsHovered] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

  const handleLogout = () => {
    queryClient.clear();
    clearAuthSession();
    window.location.href = "/login";
  };

  // Toggle Widget Icon Component (Gemini style)
  const ToggleIcon = ({
    collapsed,
    hovered,
  }: {
    collapsed: boolean;
    hovered: boolean;
  }) => (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="4.5" />
      <line x1="9" y1="3" x2="9" y2="21" />
      {hovered &&
        (collapsed ? (
          <path d="M12 9l3 3-3 3" strokeWidth="1.5" />
        ) : (
          <path d="M16 9l-3 3 3 3" strokeWidth="1.5" />
        ))}
    </svg>
  );

  return (
    <aside className={`${styles.portalSidebar} portal-sidebar ${isCollapsed ? styles.collapsed : ""}`}>
      {/* Brand Header */}
      <div
        className={styles.sidebarBrand}
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => {
          setIsHeaderHovered(false);
          setIsBtnHovered(false);
        }}
      >
        {isCollapsed ? (
          <div className={styles.sidebarToggleWrapper}>
            <button
              className={styles.sidebarToggleWidgetBtn}
              onClick={() => setIsCollapsed(false)}
              onMouseEnter={() => setIsBtnHovered(true)}
              onMouseLeave={() => setIsBtnHovered(false)}
              aria-label={i18n._(SidebarText.EXPAND_SIDEBAR)}
            >
              {isHeaderHovered ? (
                <ToggleIcon collapsed={true} hovered={isBtnHovered} />
              ) : (
                <div className={styles.brandLogoWrapper}>
                  <LookerLogo />
                </div>
              )}
            </button>
            {isHeaderHovered && (
              <div className={styles.sidebarTooltip}>{i18n._(SidebarText.EXPAND_SIDEBAR)}</div>
            )}
          </div>
        ) : (
          <>
            <div className="flex-row gap-3 flex-center">
              <div className={styles.brandLogoWrapper}>
                <LookerLogo />
              </div>
              <span className={`${styles.brandName} font-bold`}>{i18n._(SidebarText.BRAND_NAME)}</span>
            </div>

            <div className={styles.sidebarToggleWrapper}>
              <button
                className={styles.sidebarToggleWidgetBtn}
                onClick={() => setIsCollapsed(true)}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                aria-label={i18n._(SidebarText.COLLAPSE_SIDEBAR)}
              >
                <ToggleIcon collapsed={false} hovered={isBtnHovered} />
              </button>
              {isBtnHovered && (
                <div className={styles.sidebarTooltip}>{i18n._(SidebarText.COLLAPSE_SIDEBAR)}</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav className={styles.sidebarNav}>
        {PORTAL_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.iconName as keyof typeof ICON_MAP];
          const isGated = isRouteGated(item.to, selectedType);
          const labelText = getLabel(item.label);

          if (isGated) {
            return (
              <button
                type="button"
                key={item.to}
                className={`${styles.navLink} ${styles.gated}`}
                title={isCollapsed ? `${labelText}${i18n._(SidebarText.LOCKED_SUFFIX)}` : undefined}
                onClick={() => openUpgradeModal(item.to)}
              >
                <div className={styles.gatedContent}>
                  <span
                    className={styles.navIconContainer}
                    style={{ visibility: "hidden" }}
                  >
                    <Icon size={20} />
                  </span>
                  {!isCollapsed && (
                    <span className={styles.navLabel}>{labelText}</span>
                  )}
                </div>
                <span className={styles.lockOverlay}>
                  <Lock size={14} />
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: styles.active }}
              activeOptions={{ exact: item.exact }}
              className={styles.navLink}
              title={isCollapsed ? labelText : undefined}
              viewTransition
            >
              <span className={styles.navIconContainer}>
                <Icon size={20} />
              </span>
              {!isCollapsed && <span className={styles.navLabel}>{labelText}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarFooterContainer}>
          <div
            className={styles.userProfileWrapper}
            style={{ position: "relative" }}
          >
            <button
              className={styles.userProfile}
              onClick={() => setIsProfileModalOpen(true)}
              onMouseEnter={() => setIsProfileHovered(true)}
              onMouseLeave={() => setIsProfileHovered(false)}
              aria-label="User details"
            >
              <div className={styles.userAvatar}>
                <User size={18} />
              </div>
              {!isCollapsed && (
                <div className={styles.userDetails}>
                  <span className={styles.userName}>{DEFAULT_USER_NAME}</span>
                  <span className={styles.userRole}>
                    {getLabel(USER_ROLE_MAPPINGS[selectedType])}
                  </span>
                </div>
              )}
            </button>
            {isProfileHovered && (
              <UserObjectFlyout
                userObject={getRoleUserObject(selectedType, lookerUser, language, brand)}
                title={`${getLabel(USER_ROLE_MAPPINGS[selectedType])} ${i18n._(SettingsDialogText.PAYLOAD_SUFFIX)}`}
              />
            )}
          </div>

          <div className={styles.footerActions}>
            <div
              className="footer-action-wrapper"
              style={{ position: "relative" }}
            >
              <button
                className={styles.footerBtn}
                onClick={toggleTheme}
                onMouseEnter={() => setIsThemeHovered(true)}
                onMouseLeave={() => setIsThemeHovered(false)}
                aria-label={theme === "light" ? i18n._(SidebarText.DARK_THEME) : i18n._(SidebarText.LIGHT_THEME)}
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              {isThemeHovered && (
                <div className={`${styles.sidebarTooltip} footer-tooltip`}>
                  {theme === "light" ? i18n._(SidebarText.DARK_THEME) : i18n._(SidebarText.LIGHT_THEME)}
                </div>
              )}
            </div>

            <div
              className="footer-action-wrapper"
              style={{ position: "relative" }}
            >
              <button
                className={styles.footerBtn}
                onClick={() => setIsSettingsOpen(true)}
                onMouseEnter={() => setIsSettingsHovered(true)}
                onMouseLeave={() => setIsSettingsHovered(false)}
                aria-label={i18n._(SidebarText.SETTINGS)}
              >
                <Settings size={16} />
              </button>
              {isSettingsHovered && (
                <div className={`${styles.sidebarTooltip} footer-tooltip`}>{i18n._(SidebarText.SETTINGS)}</div>
              )}
            </div>

            <div
              className="footer-action-wrapper"
              style={{ position: "relative" }}
            >
              <button
                className={styles.footerBtn}
                onClick={handleLogout}
                onMouseEnter={() => setIsLogoutHovered(true)}
                onMouseLeave={() => setIsLogoutHovered(false)}
                aria-label={i18n._(SidebarText.LOG_OUT)}
              >
                <LogOut size={16} className="text-error" />
              </button>
              {isLogoutHovered && (
                <div className={`${styles.sidebarTooltip} footer-tooltip`}>
                  {i18n._(SidebarText.LOG_OUT)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
