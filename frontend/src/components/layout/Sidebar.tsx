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
} from "../../config/constants";
import { usePortal } from "../../context/PortalContext";
import { clearAuthSession } from "../../utils/auth";
import { LookerLogo } from "./LookerLogo";
import { UserObjectFlyout } from "../ui/UserObjectFlyout";
import { SettingsDialog as SettingsDialogText } from "../../config/SettingsDialog";
import { Sidebar as SidebarText } from "../../config/Sidebar";

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
    <aside className={`portal-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div
        className="sidebar-brand"
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => {
          setIsHeaderHovered(false);
          setIsBtnHovered(false);
        }}
      >
        {isCollapsed ? (
          // Collapsed state: Hovering over the brand section swaps the Looker logo with the collapse button
          <div className="sidebar-toggle-wrapper">
            <button
              className="sidebar-toggle-widget-btn"
              onClick={() => setIsCollapsed(false)}
              onMouseEnter={() => setIsBtnHovered(true)}
              onMouseLeave={() => setIsBtnHovered(false)}
              aria-label={i18n._(SidebarText.EXPAND_SIDEBAR)}
            >
              {isHeaderHovered ? (
                <ToggleIcon collapsed={true} hovered={isBtnHovered} />
              ) : (
                <div className="brand-logo-wrapper">
                  <LookerLogo />
                </div>
              )}
            </button>
            {isHeaderHovered && (
              <div className="sidebar-tooltip">{i18n._(SidebarText.EXPAND_SIDEBAR)}</div>
            )}
          </div>
        ) : (
          // Expanded state: Brand logo & text on the left, collapse button on the right
          <>
            <div className="flex-row gap-3 flex-center">
              <div className="brand-logo-wrapper">
                <LookerLogo />
              </div>
              <span className="brand-name font-bold">{i18n._(SidebarText.BRAND_NAME)}</span>
            </div>

            <div className="sidebar-toggle-wrapper">
              <button
                className="sidebar-toggle-widget-btn"
                onClick={() => setIsCollapsed(true)}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                aria-label={i18n._(SidebarText.COLLAPSE_SIDEBAR)}
              >
                <ToggleIcon collapsed={false} hovered={isBtnHovered} />
              </button>
              {isBtnHovered && (
                <div className="sidebar-tooltip">{i18n._(SidebarText.COLLAPSE_SIDEBAR)}</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {PORTAL_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.iconName as keyof typeof ICON_MAP];
          const isGated = isRouteGated(item.to, selectedType);
          const labelText = getLabel(item.label);

          if (isGated) {
            return (
              <div
                key={item.to}
                className="nav-link gated"
                title={isCollapsed ? `${labelText}${i18n._(SidebarText.LOCKED_SUFFIX)}` : undefined}
              >
                <div className="gated-content">
                  <span
                    className="nav-icon-container"
                    style={{ visibility: "hidden" }}
                  >
                    <Icon size={20} />
                  </span>
                  {!isCollapsed && (
                    <span className="nav-label">{labelText}</span>
                  )}
                </div>
                <span className="lock-overlay">
                  <Lock size={14} />
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "active" }}
              activeOptions={{ exact: item.exact }}
              className="nav-link"
              title={isCollapsed ? labelText : undefined}
            >
              <span className="nav-icon-container">
                <Icon size={20} />
              </span>
              {!isCollapsed && <span className="nav-label">{labelText}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-container">
          <div
            className="user-profile-wrapper"
            style={{ position: "relative" }}
          >
            <button
              className="user-profile"
              onClick={() => setIsProfileModalOpen(true)}
              onMouseEnter={() => setIsProfileHovered(true)}
              onMouseLeave={() => setIsProfileHovered(false)}
              aria-label="User details"
            >
              <div className="user-avatar">
                <User size={18} />
              </div>
              {!isCollapsed && (
                <div className="user-details">
                  <span className="user-name">{DEFAULT_USER_NAME}</span>
                  <span className="user-role">
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

          <div className="footer-actions">
            <div
              className="footer-action-wrapper"
              style={{ position: "relative" }}
            >
              <button
                className="footer-btn"
                onClick={toggleTheme}
                onMouseEnter={() => setIsThemeHovered(true)}
                onMouseLeave={() => setIsThemeHovered(false)}
                aria-label={theme === "light" ? i18n._(SidebarText.DARK_THEME) : i18n._(SidebarText.LIGHT_THEME)}
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              {isThemeHovered && (
                <div className="sidebar-tooltip footer-tooltip">
                  {theme === "light" ? i18n._(SidebarText.DARK_THEME) : i18n._(SidebarText.LIGHT_THEME)}
                </div>
              )}
            </div>

            <div
              className="footer-action-wrapper"
              style={{ position: "relative" }}
            >
              <button
                className="footer-btn"
                onClick={() => setIsSettingsOpen(true)}
                onMouseEnter={() => setIsSettingsHovered(true)}
                onMouseLeave={() => setIsSettingsHovered(false)}
                aria-label={i18n._(SidebarText.SETTINGS)}
              >
                <Settings size={16} />
              </button>
              {isSettingsHovered && (
                <div className="sidebar-tooltip footer-tooltip">{i18n._(SidebarText.SETTINGS)}</div>
              )}
            </div>

            <div
              className="footer-action-wrapper"
              style={{ position: "relative" }}
            >
              <button
                className="footer-btn"
                onClick={handleLogout}
                onMouseEnter={() => setIsLogoutHovered(true)}
                onMouseLeave={() => setIsLogoutHovered(false)}
                aria-label={i18n._(SidebarText.LOG_OUT)}
              >
                <LogOut size={16} className="text-error" />
              </button>
              {isLogoutHovered && (
                <div className="sidebar-tooltip footer-tooltip">
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
