import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white shadow-xl rounded-3xl p-12 border border-gray-100">
            <div className="mb-8">
              <div className="text-8xl mb-6">🔍</div>
              <h1 className="text-6xl font-bold text-gray-400 mb-6">404</h1>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                College Not Found
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                The college you&apos;re looking for doesn&apos;t exist or may
                have been moved. Don&apos;t worry, we&apos;ll help you find what
                you need!
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/mht-cet/colleges"
                  className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Browse All Colleges
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center bg-gray-600 text-white px-8 py-4 rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Go Home
                </Link>
              </div>
            </div>

            {/* Helpful suggestions */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                What you can do:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Search colleges
                  </h4>
                  <p className="text-blue-600">
                    Use our search feature to find colleges by name, ID, or
                    university.
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-green-800 mb-2">
                    Filter results
                  </h4>
                  <p className="text-green-600">
                    Use filters to narrow down colleges by status or other
                    criteria.
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-purple-800 mb-2">
                    Get help
                  </h4>
                  <p className="text-purple-600">
                    Contact our support team if you need assistance finding
                    specific information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
