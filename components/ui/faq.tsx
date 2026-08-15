{
  /*
  import { Inter } from 'next/font/google'
  const inter = Inter({
    weight: '400',
    subsets: ['latin'],
    style: 'normal',
  })
*/
}
import Link from "next/link";
import Image from "next/image";

export default function Features() {
  const features = [
    {
      title: "JEE Main",
      text: "Predict NIT, IIIT, and GFTI admission chances using JoSAA and CSAB data.",
      image: "/ejam/exams/jee_main.webp",
      buttonText: "Predict",
      href: "/college-predictor?exam=jee-main",
    },
    {
      title: "JEE Advanced",
      text: "Predict IIT admission chances using historical JoSAA cutoffs.",
      image: "/ejam/exams/jee_adv.webp",
      buttonText: "Predict",
      href: "/college-predictor?exam=jee-advanced",
    },
    {
      title: "MHT-CET",
      text: "Find cutoffs, placements, and reviews for MH Engineering Colleges.",
      image:
        "https://res.cloudinary.com/dfyrk32ua/image/upload/v1721510815/deetnuts/logos/MHT-CET_logo_wxbnlw-min_n5sbju.png",
      buttonText: "Explore",
      href: "/mht-cet",
    },
  ];

  return (
    <div>
      <section className="border-y-2 border-y-black bg-bg py-8 px-2 px-base lg:py-12 lg:px-12">
        <div className="mx-auto mb-8 max-w-2xl px-4 text-center">
          <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
            College Admission Tools
          </h2>
        </div>

        <div className="mx-auto grid w-container max-w-7xl grid-cols-1 gap-5 px-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const isActive = true;
            return (
              <div
                className={
                  `flex flex-col gap-3 rounded-base border-2 border-black bg-white p-5 shadow-base relative overflow-hidden` +
                  (isActive ? "" : " ") // always relative/overflow-hidden for overlay
                }
                key={i}
              >
                {/* Content layer, blurred if not active */}
                <div
                  className={
                    isActive ? "relative z-10" : "relative z-10 blur-sm"
                  }
                >
                  <picture>
                    <Image
                      className="h-12 w-12 rounded-base object-cover"
                      src={feature.image}
                      alt={`${feature.title} icon`}
                      width={48}
                      height={48}
                    />
                  </picture>
                  <h4 className="mt-2 text-xl font-heading">{feature.title}</h4>
                  <p>{feature.text}</p>
                </div>
                {/* Under Construction Overlay (sharp) */}
                {!isActive && (
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
                {isActive ? (
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
            );
          })}
        </div>
      </section>
    </div>
  );
}
