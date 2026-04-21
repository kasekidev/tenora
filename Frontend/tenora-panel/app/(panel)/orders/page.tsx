import { Suspense } from 'react'
import OrdersClient from './orders-client'
import { SkeletonRow } from '@/components/panel/skeleton'
import { DataCard, DataCardContent } from '@/components/panel/data-card'

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersLoading />}>
      <OrdersClient />
    </Suspense>
  )
}

function OrdersLoading() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      </div>
      <DataCard>
        <DataCardContent>
          {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
        </DataCardContent>
      </DataCard>
    </div>
  )
}
