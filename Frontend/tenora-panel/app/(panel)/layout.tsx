'use client'

import { PanelLayout } from '@/components/panel/panel-layout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PanelLayout>{children}</PanelLayout>
}
