import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, CheckCircle, Users } from 'lucide-react';

export default function CommunityPartners() {
  const partners = [
    {
      name: 'r/mht_cet',
      description: 'Community for MHT-CET aspirants to discuss exams, colleges, and admissions.',
      url: 'https://www.reddit.com/r/mht_cet/',
      members: '15k+',
      logo: 'https://res.cloudinary.com/dfyrk32ua/image/upload/v1743018533/deetnuts/communityIcon_a7um82b5fowa1_rifsjq.webp',
      banner: 'https://res.cloudinary.com/dfyrk32ua/image/upload/v1743018683/deetnuts/bannerBackgroundImage_pgczyvumruxa1_ji8x8s.webp',
      highlights: ['Exam Prep', 'College Reviews']
    },
  ];

  return (
    <section className="border-y-2 border-y-black bg-white py-12 px-base lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-block mb-3 px-4 py-1.5 bg-purple-300 border-2 border-black rounded-md font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-translate-y-0.5 transition-transform">
            COMMUNITY PARTNERS
          </div>
          <h2 className="text-3xl font-heading tracking-tight sm:text-4xl mb-2">
            Get Advice From Real Students
          </h2>
          <p className="mt-3 text-lg max-w-2xl mx-auto">
            Join our official Reddit partners where students share experiences and advice
          </p>
        </div>

        <div className="mx-auto grid w-container max-w-7xl grid-cols-1 gap-8 px-5 sm:grid-cols-2">
          {partners.map((partner, i) => (
            <div
              key={i}
              className="flex flex-col rounded-base border-2 border-black bg-white overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] hover:shadow-[6px_10px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
            >
              {/* Banner Image */}
              <div
                className="relative h-32 bg-cover bg-center border-b-2 border-black"
                style={{
                  backgroundImage: `url(${partner.banner})`,
                  backgroundPosition: 'center 30%',
                  backgroundSize: '300% auto'
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>

                {/* Official Partner Badge - More prominent */}
                <div className="absolute top-3 right-3 z-10 bg-white border-2 border-black rounded-md px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 border-1 border-black mr-1.5">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-xs font-extrabold tracking-wide">OFFICIAL PARTNER</span>
                  </div>
                </div>

                {/* Logo overlapping banner and content */}
                <div className="absolute -bottom-8 left-4 h-20 w-20 rounded-full border-2 border-black bg-white p-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    className="h-full w-full rounded-full object-cover"
                    width={80}
                    height={80}
                  />
                </div>
              </div>

              <div className="p-6 pt-12">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <h4 className="text-xl font-heading mr-1.5">
                      {partner.name}
                    </h4>
                    <CheckCircle className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-bold border-2 border-black">
                    {partner.members} members
                  </span>
                </div>

                <div className="mb-4 flex items-center">
                  <div className="inline-flex items-center text-xs bg-[#FF4500] text-white border-2 border-black rounded-md px-2.5 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 mr-1.5" fill="currentColor">
                      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
                    </svg>
                    <span className="font-bold tracking-wide">Reddit Community</span>
                  </div>
                </div>

                <p className="text-sm mb-4">{partner.description}</p>

                <div className="mb-5 flex flex-wrap gap-2">
                  {partner.highlights.map((highlight, index) => (
                    <span
                      key={index}
                      className="inline-block px-2.5 py-1 bg-gray-100 text-xs font-medium border-2 border-black rounded-md"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t-2 border-dashed border-gray-200 pt-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1.5 text-gray-600" />
                    <span className="text-sm font-medium">{partner.members}</span>
                  </div>

                  <Link
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-base border-2 border-black bg-purple-300 px-5 py-2 text-center font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Join
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block border-2 border-black bg-yellow-100 rounded-md p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-bold flex items-center justify-center">
              <span className="text-xl mr-2">🤝</span>
              DeetNuts is officially partnered with these Reddit communities for college advice
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
