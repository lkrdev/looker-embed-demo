import { useLingui } from '@lingui/react'
import { UserObjectFlyout as UserObjectFlyoutText } from '../../config/UserObjectFlyout'

interface UserObjectFlyoutProps {
  userObject: Record<string, unknown>;
  title?: string;
}

export function UserObjectFlyout({ userObject, title }: UserObjectFlyoutProps) {
  const { i18n } = useLingui()
  return (
    <div className="user-object-flyout">
      <div className="flyout-header">
        <span>{title || i18n._(UserObjectFlyoutText.DEFAULT_TITLE)}</span>
      </div>
      <pre className="flyout-json">{JSON.stringify(userObject, null, 2)}</pre>
    </div>
  );
}

