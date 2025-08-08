import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  badgeText?: string
}

export default function PageHeader({ title, description, actions, badgeText }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          {badgeText && (
            <Badge className="mb-2 bg-green-100 text-green-700 border-green-200">{badgeText}</Badge>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm sm:text-base text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  )
}


