import * as React from 'react'
import type { SalesActivity } from '../types'

export function useSalesActivities() {
  const activities: SalesActivity[] = React.useMemo(
    () => [
      {
        id: 1,
        category: 'revenue',
        iconName: 'ShoppingBag',
        iconBg: 'bg-primary-light',
        iconColor: 'text-primary',
        title: 'New Order #12849 Finalized',
        description:
          'Customer ordered 3 items including Premium Thermal Outerwear.',
        amount: '+ $348.50',
        actionText: 'Order #12849',
        actionVariant: 'default',
        time: 'Just now',
        highlight: true,
      },
      {
        id: 2,
        category: 'revenue',
        iconName: 'Star',
        iconBg: 'bg-warning-light',
        iconColor: 'text-warning',
        title: 'VIP Customer Checkout',
        description: 'Brand Loyal customer (Tier 1) completed repeat purchase.',
        amount: '+ $1,240.00',
        actionText: 'Tier 1 Profile',
        actionVariant: 'default',
        time: '4m ago',
      },
      {
        id: 3,
        category: 'logistics',
        iconName: 'PackageCheck',
        iconBg: 'bg-success-light',
        iconColor: 'text-success',
        title: 'Fulfillment Batch Dispatched',
        description:
          'Warehouse West fulfilled 142 expedited priority shipments.',
        actionText: '142 Units Dispatched',
        actionVariant: 'logistics',
        time: '18m ago',
      },
      {
        id: 4,
        category: 'logistics',
        iconName: 'RefreshCw',
        iconBg: 'bg-info-light',
        iconColor: 'text-info',
        title: 'Automated Return Processed',
        description: 'Exchange initiated for SKU #8921 (Size mismatch).',
        amount: '- $85.00',
        actionText: 'Exchange #8921',
        actionVariant: 'logistics',
        time: '1h ago',
      },
      {
        id: 5,
        category: 'alert',
        iconName: 'AlertCircle',
        iconBg: 'bg-error-light',
        iconColor: 'text-error',
        title: 'Inventory Velocity Alert',
        description:
          'Fleece Hoodies (L) stock below 15 units in fulfillment center.',
        actionText: 'CRITICAL: <15 Restock',
        actionVariant: 'alert',
        time: '2h ago',
      },
    ],
    []
  )

  return {
    activities,
  }
}
