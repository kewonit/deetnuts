import { BsReddit } from "react-icons/bs";
import Link from "next/link";
import { Montserrat } from "next/font/google"

const lato = Montserrat({
  subsets: ["latin"],
  weight: ['400', '700', '900'],
})


export default function Footer() {
  const legalLinks = [
    { name: "Good Being Terms", href: "/compliance/terms-and-conditions" },
  ];

  const socialLinks = [
    {/* name: "Reddit", href: "#", icon: BsReddit */},
  ];

  const serviceLinks = [
    { name: "MHT-CET All India", href: "/mht-cet/all-india-cutoffs/2023/round-one" },
    { name: "MHT-CET State Level", href: "/mht-cet/all-state-cutoffs/2023/round-one" },
    { name: "BITS", href: "/engineering/colleges/bits/cutoffs/2023" },
    { name: "JOSAA", href: "#" },
    { name: "CSAB", href: "#" },
  ];

  const Tools = [
    { name: "MHT-CET Rank Predictor", href: "/mht-cet/rank-predictor" },
  ];

  const Contribute = [
    { name: "Sumbit Deets", href: "/sumbit" },
  ];

  const About = [
    { name: "Creator", href: "/creator" },
  ];



  return (
    <footer className="bg-gradient-to-b from-purple-300 to-yellow-100 border-t-2 border-t-black">
      <div className={lato.className}>
        <div className="mx-auto max-w-screen-xl space-y-8 px-4 py-16 sm:px-6 lg:space-y-16 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div>
              <div className="text-black text-4xl font-heading">DeetNuts</div>

              <p className="mt-4 max-w-xs text-gray-500 leading-snug">
                DeetNuts. does not own any of the logos of organizations displayed on this website. We do not represent any of these organizations. We do not own any of the data displayed on this website. All data is sourced from official sources.
              </p>
    
              <ul className="mt-8 flex gap-6">
              {/*socialLinks.map((link, index) => (
                <Link 
                  key={index}
                  href={link.href}
                  rel="noreferrer"
                  target="_blank"
                  className="text-gray-700 transition hover:opacity-75"
                >
                  <span className="sr-only">{link.name}</span>
                  <link.icon className="h-6 w-6" aria-hidden="true" />
                </Link>
              ))*/}
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4">
              <div>
                <p className="font-bold text-gray-900">Cutoffs</p>

                <ul className="mt-6 space-y-4 text-sm">
                  {serviceLinks.map((link, index) => (
                    <li key={index}>
                      <Link href={link.href} className="text-gray-700 transition hover:opacity-75">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-bold text-gray-900">Tools</p>

                <ul className="mt-6 space-y-4 text-sm">
                  {Tools.map((link, index) => (
                    <li key={index}>
                      <Link href={link.href} className="text-gray-700 transition hover:opacity-75">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>


              <div>
                <p className="font-bold text-gray-900">Contribute</p>

                <ul className="mt-6 space-y-4 text-sm">
                  {Contribute.map((link, index) => (
                    <li key={index}>
                      <Link href={link.href} className="text-gray-700 transition hover:opacity-75">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-bold text-gray-900">About</p>

                <ul className="mt-6 space-y-4 text-sm">
                  {About.map((link, index) => (
                    <li key={index}>
                      <Link href={link.href} className="text-gray-700 transition hover:opacity-75">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company, Helpful Links, and Legal sections remain unchanged */}
            </div>
          </div>
        </div>
        <div className="border-y-[1px] border-y-black">
          <div className="py-8 px-8 mx-auto max-w-7xl">
            <div className="sm:flex sm:justify-between">
              <p className="text-xs text-gray-500">
                DeetNuts, <a className="hover:underline" href="https://github.com/kewonit/deetnuts/blob/main/LICENSE"> MIT License  {new Date().getFullYear()} </a>
              </p>
              <ul className="mt-8 flex flex-wrap justify-start gap-4 text-xs sm:mt-0 lg:justify-end">
                {legalLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.href} className="text-gray-500 transition hover:opacity-75">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-8 px-4 md:px-20">
          <svg width="1200px" viewBox="0 0 1078 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M56.2472 148H0.28125V2.54545H55.679C70.6411 2.54545 83.5672 5.45738 94.4574 11.2812C105.395 17.0578 113.823 25.3911 119.741 36.2812C125.707 47.1241 128.69 60.1212 128.69 75.2727C128.69 90.4242 125.731 103.445 119.812 114.335C113.894 125.178 105.513 133.511 94.6705 139.335C83.8277 145.112 71.0199 148 56.2472 148ZM39.7699 114.477H54.8267C62.0237 114.477 68.1553 113.317 73.2216 110.997C78.3352 108.677 82.2178 104.676 84.8693 98.9943C87.5682 93.3125 88.9176 85.4053 88.9176 75.2727C88.9176 65.1402 87.5445 57.233 84.7983 51.5511C82.0994 45.8693 78.1222 41.8684 72.8665 39.5483C67.6581 37.2282 61.2661 36.0682 53.6903 36.0682H39.7699V114.477ZM146.961 148V2.54545H251.79V34.3636H186.45V59.3636H246.393V91.1818H186.45V116.182H251.506V148H146.961ZM271.375 148V2.54545H376.205V34.3636H310.864V59.3636H370.807V91.1818H310.864V116.182H375.92V148H271.375ZM391.812 34.3636V2.54545H518.232V34.3636H474.482V148H435.562V34.3636H391.812ZM658.946 2.54545V148H625.991L573.435 71.5795H572.582V148H533.094V2.54545H566.616L618.321 78.6818H619.457V2.54545H658.946ZM763.705 2.54545H803.193V95.7273C803.193 106.807 800.542 116.395 795.239 124.491C789.983 132.541 782.644 138.767 773.222 143.17C763.799 147.527 752.862 149.705 740.409 149.705C727.862 149.705 716.877 147.527 707.455 143.17C698.032 138.767 690.693 132.541 685.438 124.491C680.229 116.395 677.625 106.807 677.625 95.7273V2.54545H717.114V92.3182C717.114 96.8163 718.108 100.841 720.097 104.392C722.085 107.896 724.831 110.642 728.335 112.631C731.886 114.619 735.911 115.614 740.409 115.614C744.955 115.614 748.979 114.619 752.483 112.631C755.987 110.642 758.733 107.896 760.722 104.392C762.71 100.841 763.705 96.8163 763.705 92.3182V2.54545ZM817.984 34.3636V2.54545H944.404V34.3636H900.654V148H861.734V34.3636H817.984ZM1037.67 48C1037.3 43.2652 1035.52 39.572 1032.35 36.9205C1029.22 34.2689 1024.46 32.9432 1018.07 32.9432C1014 32.9432 1010.66 33.4403 1008.06 34.4347C1005.5 35.3816 1003.61 36.6837 1002.38 38.3409C1001.15 39.9981 1000.51 41.892 1000.46 44.0227C1000.36 45.7746 1000.67 47.3608 1001.38 48.7812C1002.14 50.1544 1003.32 51.4091 1004.93 52.5455C1006.54 53.6345 1008.6 54.6288 1011.11 55.5284C1013.62 56.428 1016.6 57.233 1020.06 57.9432L1031.99 60.5C1040.04 62.2045 1046.93 64.4536 1052.66 67.2472C1058.39 70.0407 1063.08 73.3314 1066.72 77.1193C1070.37 80.8598 1073.04 85.0739 1074.75 89.7614C1076.5 94.4489 1077.4 99.5625 1077.45 105.102C1077.4 114.667 1075.01 122.763 1070.27 129.392C1065.54 136.021 1058.77 141.063 1049.96 144.52C1041.2 147.976 1030.67 149.705 1018.36 149.705C1005.71 149.705 994.682 147.834 985.26 144.094C975.885 140.353 968.593 134.6 963.385 126.835C958.224 119.023 955.62 109.032 955.572 96.8636H993.072C993.309 101.314 994.422 105.055 996.411 108.085C998.399 111.116 1001.19 113.412 1004.79 114.974C1008.44 116.537 1012.77 117.318 1017.79 117.318C1022 117.318 1025.53 116.797 1028.37 115.756C1031.21 114.714 1033.37 113.27 1034.83 111.423C1036.3 109.577 1037.06 107.47 1037.11 105.102C1037.06 102.877 1036.33 100.936 1034.9 99.2784C1033.53 97.5739 1031.26 96.0587 1028.09 94.733C1024.91 93.3598 1020.63 92.0814 1015.23 90.8977L1000.74 87.7727C987.864 84.9792 977.708 80.3153 970.274 73.7812C962.888 67.1998 959.218 58.2273 959.266 46.8636C959.218 37.6307 961.68 29.5578 966.652 22.6449C971.671 15.6847 978.607 10.2633 987.462 6.38068C996.363 2.4981 1006.57 0.556813 1018.07 0.556813C1029.81 0.556813 1039.97 2.52178 1048.54 6.4517C1057.11 10.3816 1063.72 15.9214 1068.36 23.071C1073.04 30.1733 1075.41 38.483 1075.46 48H1037.67Z" fill="url(#paint0_linear_58_2)"/>
          <defs>
          <linearGradient id="paint0_linear_58_2" x1="537" y1="148" x2="537" y2="-5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF4E0" stopOpacity="0"/>
          <stop offset="0.765" stopColor="#D1B0F9" stopOpacity="0.825"/>
          <stop offset="1" stopColor="#C7A1FE"/>
          </linearGradient>
          </defs>
          </svg>
        </div>
      </div>
    </footer>
  );
}