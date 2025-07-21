'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('College page error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
            <div className="container mx-auto px-4 pt-32 pb-16">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-white shadow-xl rounded-3xl p-12 border border-red-100">
                        <div className="mb-8">
                            <div className="text-8xl mb-6">😞</div>
                            <h1 className="text-4xl font-bold text-red-600 mb-4">Oops! Something went wrong</h1>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">We encountered an unexpected error</h2>
                            <p className="text-gray-600 mb-6 text-lg">
                                We&apos;re sorry for the inconvenience. Our team has been notified and is working to fix this issue.
                            </p>
                            {error.message && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
                                    <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                                    <p className="text-red-600 text-sm font-mono bg-red-100 p-3 rounded-lg">
                                        {error.message}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={reset}
                                    className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    Try Again
                                </button>
                                <Link
                                    href="/mht-cet/colleges"
                                    className="inline-flex items-center justify-center bg-gray-600 text-white px-8 py-4 rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Browse All Colleges
                                </Link>
                            </div>
                            <div className="pt-4">
                                <Link
                                    href="/"
                                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                                >
                                    Go back to home page
                                </Link>
                            </div>
                        </div>

                        {/* Additional help section */}
                        <div className="mt-12 pt-8 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Need more help?</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <h4 className="font-semibold text-blue-800 mb-2">Search for colleges</h4>
                                    <p className="text-blue-600">Use our search feature to find specific colleges and their information.</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <h4 className="font-semibold text-green-800 mb-2">Contact support</h4>
                                    <p className="text-green-600">If the problem persists, please reach out to our support team for assistance.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
