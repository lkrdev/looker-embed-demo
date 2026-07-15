import { useLingui } from '@lingui/react'
import { UserObjectFlyout as UserObjectFlyoutText } from '../../../config/UserObjectFlyout'
import styles from './UserObjectFlyout.module.css'

interface UserObjectFlyoutProps {
  userObject: Record<string, unknown>;
  title?: string;
}

export function UserObjectFlyout({ userObject, title }: UserObjectFlyoutProps) {
  const { i18n } = useLingui()
  return (
    <div className={styles.userObjectFlyout}>
      <div className={styles.flyoutHeader}>
        <span>{title || i18n._(UserObjectFlyoutText.DEFAULT_TITLE)}</span>
      </div>
      <pre className={styles.flyoutJson}>{JSON.stringify(userObject, null, 2)}</pre>
    </div>
  );
}
