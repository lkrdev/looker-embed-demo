import * as React from 'react'
import type { SalesActivity } from '../types'

export function useSalesActivities() {
  const activities: SalesActivity[] = React.useMemo(
    () => [
      {
        id: 1,
        iconName: 'ShoppingBag',
        iconBg: 'bg-primary-light',
        iconColor: 'text-primary',
        title: 'New Order #12849 Finalized',
        description:
          'Customer ordered 3 items including Premium Thermal Outerwear.',
        amount: '+ $348.50',
        time: 'Just now',
        highlight: true,
      },
      {
        id: 2,
        iconName: 'Star',
        iconBg: 'bg-warning-light',
        iconColor: 'text-warning',
        title: 'VIP Customer Checkout',
        description: 'Brand Loyal customer (Tier 1) completed repeat purchase.',
        amount: '+ $1,240.00',
        time: '4m ago',
      },
      {
        id: 3,
        iconName: 'PackageCheck',
        iconBg: 'bg-success-light',
        iconColor: 'text-success',
        title: 'Fulfillment Batch Dispatched',
        description:
          'Warehouse West fulfilled 142 expedited priority shipments.',
        time: '18m ago',
      },
      {
        id: 4,
        iconName: 'RefreshCw',
        iconBg: 'bg-info-light',
        iconColor: 'text-info',
        title: 'Automated Return Processed',
        description: 'Exchange initiated for SKU #8921 (Size mismatch).',
        amount: '- $85.00',
        time: '1h ago',
      },
      {
        id: 5,
        iconName: 'AlertCircle',
        iconBg: 'bg-error-light',
        iconColor: 'text-error',
        title: 'Inventory Velocity Alert',
        description:
          'Fleece Hoodies (L) stock below 15 units in fulfillment center.',
        time: '2h ago',
      },
    ],
    []
  )

  return {
    activities,
  }
}
