export default function Hero() {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-16 lg:px-8">
          <div className="relative isolate overflow-hidden bg-purple-300 px-6 pt-16 rounded-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
            <svg
              viewBox="0 0 1024 1024"
              className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
              aria-hidden="true"
            >
              <circle cx={512} cy={512} r={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
              <defs>
                <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                  <stop stopColor="#7775D6" />
                  <stop offset={1} stopColor="#E935C1" />
                </radialGradient>
              </defs>
            </svg>
            <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Easier than ever before.
                <br />
                Start using our app today.
              </h2>
              <p className="mt-6 text-lg leading-8 text-white">
                All the data you need to make an informed decision about colleges in one place. 
              </p>
            </div>
            <div className="relative mt-16 h-80 lg:mt-8">
              <picture> 
                <img
                  className="absolute left-0 top-0 w-[68rem] max-w-none rounded-md bg-white/5 ring-1 ring-white/10"
                  src="https://res.cloudinary.com/dfyrk32ua/image/upload/v1720795023/deetnuts/hero_hjpp76.png"
                  alt="App screenshot"
                  width={1824}
                  height={1080}
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
    )
  }