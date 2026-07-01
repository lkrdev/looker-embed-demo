import type { ILookerConnection } from "@looker/embed-sdk";
import type { Looker40SDK } from "@looker/sdk";
import type { ILookmlModelExploreField } from "@looker/sdk/lib/4.0/models";
import type * as React from "react";

export type EmbedType = "simple" | "gemini" | "advanced";
export type ThemeType = "light" | "dark";

export interface PortalContextType {
  // Theme
  theme: ThemeType;
  embedTheme: string;
  toggleTheme: () => void;

  // Sidebar Layout
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;

  // Looker Config & SSO
  selectedType: EmbedType;
  activeEndpoint: string;
  lookerHost: string | null;
  setEmbedType: (type: EmbedType) => void;
  isLoadingConfig: boolean;

  // Settings State
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
  language: string;
  setLanguage: (lang: string) => void;
  brand: string;
  setBrand: (brand: string) => void;
  sourceEnabled: boolean;
  setSourceEnabled: (enabled: boolean) => void;

  // Profile Modal State
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (isOpen: boolean) => void;
  lookerUser: any | null;

  // Cookieless session refresh trigger
  authTrigger: number;

  // Looker Browser Client SDK
  lookerBrowserSdk: Looker40SDK;

  // Shared Connection properties
  connection: ILookerConnection | null;
  connectionState: "idle" | "connecting" | "connected" | "error";
  embedError: string | null;
  initializeSharedSDK: (container: HTMLDivElement) => Promise<void>;
  dateFilter: string;
  setDateFilter: React.Dispatch<React.SetStateAction<string>>;
  isFiltering: boolean;
  setIsFiltering: React.Dispatch<React.SetStateAction<boolean>>;

  // Dynamic anchoring properties
  iframeAnchor: HTMLDivElement | null;
  setIframeAnchor: (element: HTMLDivElement | null) => void;
  isNavigating: boolean;
  navigateIframe: (targetPath: string) => Promise<void>;
  resetConnection: () => void;
  dashboardUrl: string;
  setDashboardUrl: React.Dispatch<React.SetStateAction<string>>;
}

export interface AccessDeniedProps {
  title: string;
}

export interface AppCardProps {
  to: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hoverable" | "glass";
}

export interface EmbedPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface HeroBannerProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "title"
> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badgeText?: string;
  badgeIcon?: React.ComponentType<{ size?: number; className?: string }>;
  actions?: React.ReactNode;
  decoration?: React.ReactNode;
}

export interface LookerLogoProps extends React.SVGProps<SVGSVGElement> {}

export interface NavbarProps {}

export interface PageHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  border?: boolean;
}

export interface SourceHighlighterProps {
  children: React.ReactNode;
  sourceType: "iframe" | "api";
  className?: string;
  style?: React.CSSProperties;
}

export interface GlobalLookerContainerProps {
  isVisible: boolean;
  currentRoute: string;
}

export type ViewType = "main" | "userType" | "language" | "brand";

interface MeepBase {
  label: string;
}

type MeepFqfn = `${string}.${string}.${string}.${string}`;

export interface MeepDimensionGroupField extends MeepBase {
  is_group: true;
  category: "dimension";
  children: MeepExploreDimension[];
}
export interface MeepMeasureGroupField extends MeepBase {
  is_group: true;
  category: "measure";
  children: MeepExploreMeasure[];
}
export type MeepGroupField = MeepDimensionGroupField | MeepMeasureGroupField;

export interface MeepFieldWarning {
  type: "ambiguous_labels_in_explore" | "ambiguous_measures_across_explores";
  exploreKey?: string;
  label: string;
  fqfns: string[];
  message: string;
}

export interface MeepExploreDimension extends MeepBase {
  fqfn: MeepFqfn[];
  base_field_fqfn?: MeepFqfn;
  meta: Omit<ILookmlModelExploreField, "category"> & {
    category: "dimension";
    lookml_model_name: string;
    explore_name: string;
  };
  is_group: false;
  _warnings?: MeepFieldWarning[];
}
export interface MeepExploreMeasure extends MeepBase {
  fqfn: MeepFqfn;
  preferred_date_fqfn: MeepFqfn;
  meta: Omit<ILookmlModelExploreField, "category"> & {
    category: "measure";
  };
  is_group: false;
  _warnings?: MeepFieldWarning[];
}

export interface MeepExploreDate {
  label: "__date";
  dimension_groups_fqfn: MeepFqfn[];
  timeframes: string[];
  base_date_timeline_fqfn?: string;
}

export interface MeepExploreGraphNode {
  exploreKey: string;
  modelName: string;
  exploreName: string;
  dateDimensionGroupFqfn: string;
  dimensions: string[];
  measures: string[];
}

export type MeepExploreGraph = Record<string, MeepExploreGraphNode>;

export type TMeepFields = (
  | MeepExploreDimension
  | MeepExploreMeasure
  | MeepGroupField
)[] & {
  _warnings?: MeepFieldWarning[];
};

export interface MeepExploreData {
  fields: TMeepFields;
  date: MeepExploreDate | null;
}
export interface ReportItem {
  type: "dashboard" | "look" | "explore" | "url";
  id: string;
  title: string;
}
export interface StrategicInsight {
  id: string;
  title: string;
  iconName: "Lightbulb" | "TrendingUp" | "Target";
  variant: "warning" | "success" | "accent";
  description: string | ((brand: string) => React.ReactNode);
}
export interface KpiCardProps {
  title: string;
  queryId: string;
  badgeText: string;
  badgeVariant?: "success" | "info" | "warning" | "error";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  iconBgColor?: string;
  formatter?: (val: any) => string;
  className?: string;
}

export interface SalesActivity {
  id: number;
  iconName:
    | "ShoppingBag"
    | "Star"
    | "PackageCheck"
    | "RefreshCw"
    | "AlertCircle";
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  amount?: string;
  time: string;
  highlight?: boolean;
}
export interface NavItem {
  to: string;
  label: any;
  iconName:
    | "Home"
    | "LayoutDashboard"
    | "MessageSquare"
    | "FileText"
    | "Sparkles"
    | "Compass"
    | "FileSpreadsheet";
  exact?: boolean;
}
export interface ToggleIconProps {
  collapsed: boolean;
  hovered: boolean;
}

export interface CachedConversationsStorage {
  activeId: string | null;
  cachedIds: string[];
}

export interface ConversationalMessageItem {
  id?: string;
  messageId?: string | null;
  type?: 'user' | 'system' | 'agent' | string;
  order?: number;
  timestamp?: string | Date | null;
  message?: {
    timestamp?: string | Date | null;
    userMessage?: { text?: string | null };
    systemMessage?: any;
  };
}

export interface UseConversationalAnalyticsReturn {
  conversations: any[];
  activeConversationId: string | null;
  messages: ConversationalMessageItem[];
  isLoading: boolean;
  isChatting: boolean;
  error: string | null;
  createConversation: (name?: string) => Promise<any | null>;
  selectConversation: (conversationId: string | null) => Promise<void>;
  sendMessage: (userMessageText: string, onStreamChunk?: (chunk: any) => void) => Promise<ConversationalMessageItem[] | null>;
  streamMessage: (userMessageText: string) => AsyncGenerator<any, void, unknown>;
  updateMessage: (messageId: string, body: any) => Promise<any | null>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  deleteConversation: (conversationId?: string) => Promise<boolean>;
  refreshConversations: () => Promise<void>;
}
