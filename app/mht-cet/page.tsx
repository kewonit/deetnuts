import { Metadata } from 'next';
import Link from 'next/link'

interface Link {
  title: string;
  link: string;
  icon: {
    src: string;
  };
}

const LINKS: { [key: string]: Link } = {
  link1: {
    title: 'All India Cutoffs',
    link: '/mht-cet/all-india-cutoffs/2023/round-one',
    icon: {
      src: 'https://res.cloudinary.com/dfyrk32ua/image/upload/v1721510815/deetnuts/logos/MHT-CET_logo_wxbnlw-min_n5sbju.png',
    },
  },
  link2: {
    title: 'State Level Cutoffs',
    link: '/mht-cet/all-state-cutoffs/2023/round-one',
    icon: {
      src: 'https://res.cloudinary.com/dfyrk32ua/image/upload/v1721510815/deetnuts/logos/MHT-CET_logo_wxbnlw-min_n5sbju.png',
    },
  },
  link3: {
    title: 'Rank Predictor',
    link: '/mht-cet/rank-predictor',
    icon: {
      src: 'https://res.cloudinary.com/dfyrk32ua/image/upload/v1721510815/deetnuts/logos/MHT-CET_logo_wxbnlw-min_n5sbju.png',
    },
  },
  link4: {
    title: 'College List',
    link: '/mht-cet/colleges',
    icon: {
      src: 'https://res.cloudinary.com/dfyrk32ua/image/upload/v1721510815/deetnuts/logos/MHT-CET_logo_wxbnlw-min_n5sbju.png',
    },
  },
};

export const metadata: Metadata = {
  title: "MHTCET | All India Cutoffs | State Level Cuttoffs | Rank Predictor",
  description: "MHTCET | All India Cutoffs | State Level Cuttoffs | Rank Predictor",
};  


export default function Home() {
  return (
    <div className=" mx-auto h-full mt-24 w-[700px] max-w-full p-8 md:p-16 xl:w-[1400px] min-h-screen">
      <div className="mb-20">
        <picture>
          <img
            className="h-28 w-28 rounded-full xl:h-[184px] xl:w-[184px]"
            src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1720795017/deetnuts/MHT-CET_logo_wxbnlw.png"
            alt="profile picture"
          />
        </picture>
        <div className="mt-8">
          <h2 className="text-3xl font-heading sm:text-[44px]">MHT-CET</h2>
          <p className="mt-4 text-base font-base sm:text-xl">
          Maharashtra State Common Entrance Test Cell
          </p>
        </div>
      </div>
      <div className="justify-end xl:flex">
        <div
          id="grid-container"
          className="grid w-full grid-cols-1 gap-10 md:grid-cols-3 xl:w-1/2 xl:pb-16 w450:grid-cols-1 w450:gap-7"
        >
          {Object.keys(LINKS).map((key) => (
            <Link
              className="rounded-base border-2 border-black bg-main p-5 shadow-base transition-all hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
              key={key}
              href={LINKS[key].link}
            >
              <picture>
                <img
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  src={LINKS[key].icon.src}
                  alt={LINKS[key].title}
                />
              </picture>
              <p className="mt-3 text-lg font-heading sm:text-xl">
                {LINKS[key].title}
              </p>

            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}