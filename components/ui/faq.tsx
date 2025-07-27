{/*
  import { Inter } from 'next/font/google'
  const inter = Inter({
    weight: '400',
    subsets: ['latin'],
    style: 'normal',
  })
*/}
import { AlertTriangle } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import Link from 'next/link';
import Image from 'next/image';

export default function Features() {
  const features = [
    {
      title: 'NIRF Rankings',
      text: 'Explore Engineering college rankings, placements, and more.',
      image: 'https://res.cloudinary.com/dfyrk32ua/image/upload/v1721510733/deetnuts/logos/National_Institutional_Ranking_Framework_logo_xekyp5.png',
      buttonText: 'Explore',
      href: '/nirf'
    },
    {
      title: 'MHT-CET',
      text: 'Find cutoffs, placements, and reviews for MH Engineering Colleges.',
      image: 'https://res.cloudinary.com/dfyrk32ua/image/upload/v1721510815/deetnuts/logos/MHT-CET_logo_wxbnlw-min_n5sbju.png',
      buttonText: 'Explore',
      href: '/mht-cet'
    },
    {
      title: 'JOSAA Cutoffs',
      text: 'Check cutoff ranks for IITs, NITs, and other top engineering colleges.',
      image: 'https://res.cloudinary.com/dfyrk32ua/image/upload/v1721510732/deetnuts/logos/jossa_logo_oablhz.png',
      buttonText: 'Explore',
      href: '/engineering/colleges/joosa'
    },
    {
      title: 'BITS Pilani Cutoffs 2023',
      text: 'Check the latest cutoffs for BITS Pilani campuses.',
      image: 'https://res.cloudinary.com/dfyrk32ua/image/upload/v1721510726/deetnuts/logos/BITS_Pilani-Logo_b8sizn.svg',
      buttonText: 'Explore',
      href: '/engineering/colleges/bits/cutoffs/2023'
    }
  ];

  return (
    <div>
      <section className="border-y-2 border-y-black bg-bg py-8 px-2 px-base lg:py-12 lg:px-12">
        <div className="font-mono max-w-2xl mx-auto p-4 mb-8">
          <div className="border-4 border-red-600 bg-red-50 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-200 rotate-45 transform translate-x-10 -translate-y-10"></div>
            <div className="relative flex items-center space-x-4">
              <AlertTriangle className="w-10 h-10 flex-shrink-0 text-red-600" />
              <div>
                <h2 className="text-xl font-bold mb-1 uppercase tracking-tight text-red-600">Warning</h2>
                <p className="text-sm leading-tight text-red-800">
                  This stuff is still being actively built, here is a preview straight from the helms of the backend!
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <div className="w-12 h-1 bg-red-600"></div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-container max-w-7xl grid-cols-1 gap-5 px-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const isMhtCet = feature.title === 'MHT-CET';
            return (
              <div
                className={
                  `flex flex-col gap-3 rounded-base border-2 border-black bg-white p-5 shadow-base relative overflow-hidden` +
                  (isMhtCet ? '' : ' ') // always relative/overflow-hidden for overlay
                }
                key={i}
              >
                {/* Content layer, blurred if not MHT-CET */}
                <div className={isMhtCet ? 'relative z-10' : 'relative z-10 blur-sm'}>
                  <picture>
                    <Image
                      className="h-12 w-12 rounded-base object-cover"
                      src={feature.image}
                      alt={`${feature.title} icon`}
                      width={48}
                      height={48}
                    />
                  </picture>
                  <h4 className="mt-2 text-xl font-heading">
                    {feature.title}
                  </h4>
                  <p>{feature.text}</p>
                </div>
                {/* Under Construction Overlay (sharp) */}
                {!isMhtCet && (
                  <div className="absolute top-2 right-2 transform rotate-12 z-10 pointer-events-none max-w-[80px] max-h-[80px] overflow-hidden drop-shadow-lg">
                    <Image
                      className="h-20 w-20"
                      src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1751487107/gdgc/pngimg.com_-_under_construction_PNG34_fr5yo4.webp"
                      alt="Under Construction"
                      width={80}
                      height={80}
                    />
                  </div>
                )}
                {/* Button */}
                {isMhtCet ? (
                  <Link
                    href={feature.href}
                    className="mt-auto inline-block rounded-base border-2 border-black bg-white px-4 py-2 text-center font-bold text-black hover:bg-purple-300 hover:text-white transition-colors"
                  >
                    {feature.buttonText}
                  </Link>
                ) : (
                  <span className="mt-auto inline-block rounded-base border-2 border-black bg-gray-200 px-4 py-2 text-center font-bold text-gray-500 cursor-not-allowed opacity-80">
                    Coming Soon
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}