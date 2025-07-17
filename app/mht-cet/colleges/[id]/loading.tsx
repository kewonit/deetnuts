export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-4 pt-32 pb-12">
                {/* Breadcrumb Skeleton */}
                <nav className="mb-8">
                    <div className="flex items-center space-x-2 text-sm">
                        <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                        <span>/</span>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <span>/</span>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <span>/</span>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                </nav>

                {/* College Header Skeleton */}
                <div className="bg-white shadow-xl rounded-2xl p-8 mb-8 border border-gray-100 animate-pulse">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <div className="h-12 bg-gray-200 rounded mb-4 w-3/4"></div>
                            <div className="flex gap-3 mb-6">
                                <div className="h-8 bg-gray-200 rounded-full w-24"></div>
                                <div className="h-8 bg-gray-200 rounded-full w-20"></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seat Matrix Skeleton */}
                <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-200 rounded-lg mr-4"></div>
                                <div className="h-8 bg-blue-200 rounded w-64"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 bg-blue-200 rounded w-20"></div>
                                <div className="h-8 bg-blue-200 rounded w-24"></div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Statistics Cards Skeleton */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-gray-200 rounded-xl mr-4"></div>
                                        <div>
                                            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                                            <div className="h-6 bg-gray-200 rounded w-12"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Course Cards Skeleton */}
                        <div className="grid gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="h-6 bg-gray-200 rounded w-48"></div>
                                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map((j) => (
                                            <div key={j} className="text-center">
                                                <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
                                                <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
