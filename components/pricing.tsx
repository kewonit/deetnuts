import PricingPlan from './ui/pricing-plan'

export default function Pricing() {
  return (
    <div>
        <div className="w900:grid-cols-1 w900:w-2/3 w900:mx-auto w500:w-full grid grid-cols-1 gap-8">
          <PricingPlan
            planName="Salient"
            description="Includes all stuff on this  website"
            price="0"
            perks={[
              'Access to all pages',
              'Random pictures of cat',
              'No promotional stuff (iykyk)',
              'Data and kinds cool ui'
            ]}
            mostPopular
          />
        </div>
      </div>
  )
}