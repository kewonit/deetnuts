'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookUser, Building, GraduationCap, Info, Lightbulb, MapPin, ShieldCheck, Users } from 'lucide-react';
import CategoryFlowChart from '@/components/CategoryFlowChart';
import { DonationCard } from '@/components/DonationCard';

export function CutoffInfoCards() {
    return (
        <>
            {/* How to Use This Tool - always on top, full width */}
            <div className="mt-6">
                <Card className="relative bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-200 opacity-70 transition-all duration-300" />
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl font-abel text-blue-900">
                            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow group-hover:bg-blue-200 transition-all duration-200">
                                <Lightbulb className="h-5 w-5 text-blue-600 group-hover:text-blue-800 transition-all duration-200" />
                            </div>
                            How to Use This Tool
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Step 1 */}
                            <section className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm" aria-labelledby="step1-title">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-200 mb-2">
                                    <span className="text-lg md:text-xl font-bold text-blue-700">1</span>
                                </div>
                                <h3 id="step1-title" className="text-base md:text-lg font-bold text-blue-900 mb-1">Enter Percentile</h3>
                                <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                                    Type your MHT-CET percentile (e.g., <span className="font-semibold">95.5</span>). Shows colleges with cutoffs ≤ your percentile.
                                </p>
                            </section>
                            {/* Step 2 */}
                            <section className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm" aria-labelledby="step2-title">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-200 mb-2">
                                    <span className="text-lg md:text-xl font-bold text-blue-700">2</span>
                                </div>
                                <h3 id="step2-title" className="text-base md:text-lg font-bold text-blue-900 mb-1">Filter Results</h3>
                                <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                                    Use filters for <span className="font-semibold">categories</span>, <span className="font-semibold">courses</span>, <span className="font-semibold">seat types</span>, and <span className="font-semibold">university regions</span>.
                                </p>
                            </section>
                            {/* Step 3 */}
                            <section className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm" aria-labelledby="step3-title">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-200 mb-2">
                                    <span className="text-lg md:text-xl font-bold text-blue-700">3</span>
                                </div>
                                <h3 id="step3-title" className="text-base md:text-lg font-bold text-blue-900 mb-1">Analyze &amp; Plan</h3>
                                <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                                    Results are sorted by <span className="font-semibold">highest cutoff</span>. Use to plan your <span className="font-semibold">CAP round choices</span>.
                                </p>
                            </section>
                        </div>
                        <div className="mt-3 p-2 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg flex items-start gap-2">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-200 text-amber-800 font-bold flex-shrink-0">
                                <Lightbulb className="h-4 w-4" />
                            </span>
                            <span className="text-xs md:text-sm font-abel text-amber-900">
                                <span className="font-bold">Tip:</span> This tool uses official DTE Maharashtra cutoff data. Always cross-verify with official sources.
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Seat Allocation Types and Category & Code Legends side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Seat Allocation Types - left */}
                <Card className="relative bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-200 opacity-70" />
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-3 text-3xl md:text-4xl font-abel text-purple-900">
                            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                                <MapPin className="h-6 w-6 text-purple-600" />
                            </div>
                            <span className="tracking-tight">Seat Allocation Types</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex flex-col gap-6">
                            {/* State Level */}
                            <div className="rounded-xl bg-green-50/80 border border-green-100 p-4 shadow-sm">
                                <div className="font-extrabold text-green-900 font-abel text-xl md:text-2xl mb-1">State Level (S)</div>
                                <p className="text-base text-gray-700">
                                    <span className="font-semibold">Who:</span> All Maharashtra students.
                                </p>
                            </div>

                            {/* Home University */}
                            <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-4 shadow-sm">
                                <div className="font-extrabold text-blue-900 font-abel text-xl md:text-2xl mb-1">Home University (H)</div>
                                <p className="text-base text-gray-700">
                                    <span className="font-semibold">Who:</span> Students whose Home University matches the college&apos;s university region.
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-semibold">What is Home University?</span> The university region where you completed your 12th standard (HSC).
                                </p>
                            </div>

                            {/* Other University */}
                            <div className="rounded-xl bg-orange-50/80 border border-orange-100 p-4 shadow-sm">
                                <div className="font-extrabold text-orange-900 font-abel text-xl md:text-2xl mb-1">Other University (O)</div>
                                <p className="text-base text-gray-700">
                                    <span className="font-semibold">Who:</span> Students from other university regions.
                                </p>
                            </div>

                            {/* Visual Table for Quick Reference */}
                            <div className="rounded-xl bg-purple-50/80 border border-purple-100 p-4 shadow-sm">
                                <div className="font-extrabold text-purple-900 font-abel text-xl md:text-2xl mb-2 flex items-center gap-2">
                                    <MapPin className="h-6 w-6 text-purple-600" />
                                    Quick Reference
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-base font-abel border-collapse">
                                        <thead>
                                            <tr className="bg-purple-100">
                                                <th className="px-3 py-2 border border-purple-200 text-left">Type</th>
                                                <th className="px-3 py-2 border border-purple-200 text-left">Code</th>
                                                <th className="px-3 py-2 border border-purple-200 text-left">Who Can Apply?</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="px-3 py-2 border border-purple-100 font-semibold">State Level</td>
                                                <td className="px-3 py-2 border border-purple-100 font-mono text-base">S</td>
                                                <td className="px-3 py-2 border border-purple-100">All Maharashtra students</td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 border border-purple-100 font-semibold">Home University</td>
                                                <td className="px-3 py-2 border border-purple-100 font-mono text-base">H</td>
                                                <td className="px-3 py-2 border border-purple-100">Same university region</td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2 border border-purple-100 font-semibold">Other University</td>
                                                <td className="px-3 py-2 border border-purple-100 font-mono text-base">O</td>
                                                <td className="px-3 py-2 border border-purple-100">Other university regions</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Category and Code Legends - right */}
                <Card className="relative bg-gradient-to-br from-emerald-50 to-white border-emerald-200 shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-200 opacity-70" />
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl font-abel text-emerald-900">
                            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
                                <BookUser className="h-5 w-5 text-emerald-600" />
                            </div>
                            <span className="tracking-tight">Category & Code Legends</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="flex flex-col gap-6">
                            {/* Category Code Format */}
                            <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info className="h-5 w-5 text-emerald-600" />
                                    <span className="font-semibold text-emerald-900 font-abel text-lg md:text-xl">Category Code Format</span>
                                </div>
                                <ul className="text-base font-abel space-y-1 pl-2">
                                    <li><span className="font-bold">G</span> = General (open to all)</li>
                                    <li><span className="font-bold">L</span> = Ladies (female candidates only)</li>
                                    <li><span className="font-bold">SC/ST/OBC/EWS</span> = Reserved categories</li>
                                    <li><span className="font-bold">OPEN</span> = Open to all within that category</li>
                                    <li><span className="font-bold">H</span> = Home University, <span className="font-bold">O</span> = Other University, <span className="font-bold">S</span> = State Level</li>
                                </ul>
                                <div className="mt-3 text-sm text-emerald-900 font-abel bg-emerald-100 rounded px-3 py-2">
                                    <b>Example:</b> <span className="font-mono bg-gray-100 px-1 rounded">GOPENH</span> = General, Open seat, Home University.
                                    <br />
                                    <b>Tip:</b> Codes combine category, gender, and region. Always cross-verify with official DTE Maharashtra sources.
                                </div>
                            </div>

                            {/* Special Category Codes */}
                            <div className="rounded-xl bg-purple-50/80 border border-purple-100 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <GraduationCap className="h-5 w-5 text-purple-600" />
                                    <span className="font-semibold text-purple-900 font-abel text-lg md:text-xl">Special Category Codes</span>
                                </div>
                                <ul className="text-base font-abel space-y-1 pl-2">
                                    <li><span className="font-bold">TFWS:</span> Tuition Fee Waiver Scheme</li>
                                    <li><span className="font-bold">EWS:</span> Economically Weaker Section</li>
                                    <li><span className="font-bold">DEF:</span> Defence Reserved</li>
                                    <li><span className="font-bold">PWD:</span> Persons with Disability</li>
                                    <li><span className="font-bold">MI:</span> Minority Institutions</li>
                                </ul>
                            </div>

                            {/* Video Explanation */}
                            <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info className="h-5 w-5 text-emerald-600" />
                                    <span className="font-semibold text-emerald-900 font-abel text-lg md:text-xl">Video Explanation (not affiliated)</span>
                                </div>
                                <div className="aspect-video w-full max-w-full rounded overflow-hidden">
                                    <iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/1WA_Vh1jaU4?si=bBGUzsa5AoHX6ONh" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="w-full h-56 md:h-64 rounded" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Flow Chart */}
            <div className="mt-8 md:mt-12">
                <CategoryFlowChart />
            </div>

            <div className="mt-8 md:mt-12 overflow-hidden md:overflow-visible">
                <DonationCard />
            </div>
        </>
    );
}
