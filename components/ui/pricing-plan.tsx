import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function PricingPlan({
  perks,
  mostPopular = false,
  planName,
  description,
  price,
}: {
  perks: string[]
  mostPopular?: boolean
  planName: string
  description: string
  price: string
}) {
  return (
    <div className="flex flex-col justify-between rounded-base border-2 border-black bg-white p-5">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-heading">{planName}</h3>
          {mostPopular && (
            <span className="rounded-base border-2 border-black bg-main px-2 py-0.5 text-sm">
              Most popular
            </span>
          )}
        </div>
        <p className="mb-3 mt-1">{description}</p>
        <div>
          <span className="text-3xl font-heading">₹{price}</span>{' '}
          <span>/ month</span>{' '}
        </div>
        <ul className="mt-8 flex flex-col gap-2">
          {perks.map((perk) => {
            return (
              <li key={perk} className="flex items-center gap-3">
                <Check className="shrink-0" size={20} /> {perk}
              </li>
            )
          })}
        </ul>
      </div>
      <Link href='/'>
        <Button
          size={mostPopular ? 'lg' : 'default'}
          className={cn('mt-12 w-full', mostPopular && 'text-black')}
        >
          Access
        </Button>
      </Link>
    </div>
  )
}