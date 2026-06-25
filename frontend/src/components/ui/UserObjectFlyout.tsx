interface UserObjectFlyoutProps {
  userObject: Record<string, unknown>;
  title?: string;
}

export function UserObjectFlyout({ userObject, title }: UserObjectFlyoutProps) {
  return (
    <div className="user-object-flyout">
      <div className="flyout-header">
        <span>{title || "User Object Preview"}</span>
      </div>
      <pre className="flyout-json">{JSON.stringify(userObject, null, 2)}</pre>
    </div>
  );
}
