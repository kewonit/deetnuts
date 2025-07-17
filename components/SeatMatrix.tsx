'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from './ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useState } from 'react';
import {
    Users,
    Building,
    Globe,
    HeartHandshake,
    Accessibility,
    ShieldCheck,
    GraduationCap,
    Info,
    ListTree,
    BarChart,
    ChevronDown
} from 'lucide-react';

// Updated data interface to include all fields from the API response
interface SeatMatrixData {
    id: string;
    page_number: string;
    college_code: string;
    college_name: string;
    choice_code: string;
    course_name: string;
    SI: number;
    MS_seats: number;
    minority_seats: number;
    all_india: number;
    institute_seats: number;
    orphan: number;
    CAP_seats: number;
    seat_type: string;
    OPEN_General: number;
    OPEN_Ladies: number;
    SC_General: number;
    SC_Ladies: number;
    ST_General: number;
    ST_Ladies: number;
    VJ_DT_General: number;
    VJ_DT_Ladies: number;
    NTB_General: number;
    NTB_Ladies: number;
    NTC_General: number;
    NTC_Ladies: number;
    NTD_General: number;
    NTD_Ladies: number;
    OBC_General: number;
    OBC_Ladies: number;
    SEBC_General: number;
    SEBC_Ladies: number;
    Total: number;
    PWD_total: number;
    PWD_common_reserved: number;
    DEF_total: number;
    DEF_common_reserved: number;
    EWS_seat: number;
    TFWS_choice_code: string;
    TFWS_seats: number;
    created: string;
    updated: string;
}

interface SeatMatrixProps {
    data: SeatMatrixData[];
    isLoading?: boolean;
    error?: string | null;
}

// A reusable component for displaying key-value data in a visually appealing card
const InfoCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
    <div className="bg-white p-4 rounded-base border-2 border-black shadow-base hover:shadow-lg transition-all transform hover:-translate-y-1">
        <div className="flex items-center">
            <div className="w-12 h-12 bg-main border-2 border-black rounded-base flex items-center justify-center mr-4">
                <Icon className="w-6 h-6 text-black" />
            </div>
            <div>
                <p className="text-sm font-heading text-gray-700">{title}</p>
                <p className="text-2xl font-bold text-black">{value}</p>
            </div>
        </div>
    </div>
);

const SeatCategoryCard = ({ category, general, ladies }: { category: string; general: number; ladies: number }) => (
    <div className="bg-white p-4 rounded-base border-2 border-black flex-1 min-w-[150px]">
        <p className="font-heading text-lg text-black">{category}</p>
        <div className="flex justify-around mt-2">
            <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{general || '-'}</p>
                <p className="text-sm text-gray-600">General</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-pink-600">{ladies || '-'}</p>
                <p className="text-sm text-gray-600">Ladies</p>
            </div>
        </div>
    </div>
);

export default function SeatMatrix({ data, isLoading, error }: SeatMatrixProps) {
    const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');

    // Loading State
    if (isLoading) {
        return (
            <div className="bg-white border-4 border-black rounded-base shadow-base p-8">
                <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-300 h-12 w-12"></div>
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-300 rounded"></div>
                            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="bg-red-100 border-4 border-red-500 text-red-700 px-4 py-3 rounded-base relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    // Empty State
    if (!data || data.length === 0) {
        return (
            <div className="bg-yellow-100 border-4 border-yellow-500 text-yellow-700 px-4 py-3 rounded-base relative text-center" role="alert">
                <strong className="font-bold font-heading">No Seat Matrix Data!</strong>
                <p className="font-base">Information for this college is not currently available. Please check back later.</p>
            </div>
        );
    }

    const safeData = Array.isArray(data) ? data : [];

    const courseGroups = safeData.reduce((acc, row) => {
        const courseName = row.course_name || 'Unknown Course';
        if (!acc[courseName]) {
            acc[courseName] = [];
        }
        acc[courseName].push(row);
        return acc;
    }, {} as Record<string, SeatMatrixData[]>);

    const totalSeats = safeData.reduce((sum, row) => sum + (row.Total || 0), 0);
    const totalCourses = Object.keys(courseGroups).length;
    const totalAllIndiaSeats = safeData.reduce((sum, row) => sum + (row.all_india || 0), 0);
    const totalMSSeats = safeData.reduce((sum, row) => sum + (row.MS_seats || 0), 0);
    const totalEWSSeats = safeData.reduce((sum, row) => sum + (row.EWS_seat || 0), 0);
    const totalPWDSeats = safeData.reduce((sum, row) => sum + (row.PWD_total || 0), 0);
    const totalDEFSeats = safeData.reduce((sum, row) => sum + (row.DEF_total || 0), 0);

    return (
        <div className="bg-white border-4 border-black rounded-base shadow-base">
            <div className="p-6 border-b-4 border-black flex justify-between items-center bg-purple-300">
                <h2 className="text-3xl font-heading text-black flex items-center">
                    <BarChart className="w-8 h-8 mr-4" />
                    Seat Matrix
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedView('overview')}
                        className={`font-heading px-4 py-2 rounded-base border-2 border-black shadow-base transition-all ${selectedView === 'overview' ? 'bg-main text-black' : 'bg-white text-black hover:bg-main'}`}>
                        Overview
                    </button>
                    <button
                        onClick={() => setSelectedView('detailed')}
                        className={`font-heading px-4 py-2 rounded-base border-2 border-black shadow-base transition-all ${selectedView === 'detailed' ? 'bg-main text-black' : 'bg-white text-black hover:bg-main'}`}>
                        Detailed View
                    </button>
                </div>
            </div>

            <div className="p-8">
                {selectedView === 'overview' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <InfoCard title="Total Seats" value={totalSeats.toLocaleString()} icon={Users} />
                            <InfoCard title="Total Courses" value={totalCourses} icon={ListTree} />
                            <InfoCard title="MS Seats" value={totalMSSeats.toLocaleString()} icon={Building} />
                            <InfoCard title="All India Seats" value={totalAllIndiaSeats.toLocaleString()} icon={Globe} />
                            <InfoCard title="EWS Seats" value={totalEWSSeats} icon={HeartHandshake} />
                            <InfoCard title="PWD Seats" value={totalPWDSeats} icon={Accessibility} />
                            <InfoCard title="Defence Seats" value={totalDEFSeats} icon={ShieldCheck} />
                        </div>
                        <div className="space-y-6">
                            {Object.entries(courseGroups).map(([courseName, rows]) => {
                                const courseTotal = rows.reduce((sum, r) => sum + (r.Total || 0), 0);
                                const courseMS = rows.reduce((sum, r) => sum + (r.MS_seats || 0), 0);
                                const courseAI = rows.reduce((sum, r) => sum + (r.all_india || 0), 0);
                                const courseCAP = rows.reduce((sum, r) => sum + (r.CAP_seats || 0), 0);

                                return (
                                    <div key={courseName} className="bg-white border-2 border-black rounded-base p-6 shadow-base">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-2xl font-heading text-black flex items-center"><GraduationCap className="mr-3 text-purple-600" />{courseName}</h3>
                                            <Badge className="bg-purple-300 text-black px-4 py-2 border-2 border-black rounded-base font-heading text-sm">
                                                {courseTotal} Total Seats
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                            <div className="p-3 rounded-base bg-purple-100 border-2 border-black">
                                                <div className="text-3xl font-bold text-purple-800">{courseTotal}</div>
                                                <div className="text-sm font-heading text-purple-900">Total</div>
                                            </div>
                                            <div className="p-3 rounded-base bg-green-100 border-2 border-black">
                                                <div className="text-3xl font-bold text-green-800">{courseMS}</div>
                                                <div className="text-sm font-heading text-green-900">MS Seats</div>
                                            </div>
                                            <div className="p-3 rounded-base bg-blue-100 border-2 border-black">
                                                <div className="text-3xl font-bold text-blue-800">{courseAI}</div>
                                                <div className="text-sm font-heading text-blue-900">All India</div>
                                            </div>
                                            <div className="p-3 rounded-base bg-yellow-100 border-2 border-black">
                                                <div className="text-3xl font-bold text-yellow-800">{courseCAP}</div>
                                                <div className="text-sm font-heading text-yellow-900">CAP Seats</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {selectedView === 'detailed' && (
                    <Accordion type="multiple" className="w-full space-y-4">
                        {Object.entries(courseGroups).map(([courseName, rows]) => (
                            <AccordionItem
                                value={courseName}
                                key={courseName}
                                className="border-2 border-black rounded-base overflow-hidden shadow-base bg-white"
                            >
                                <AccordionTrigger className="text-xl font-heading text-black hover:bg-main p-6">
                                    <div className="flex items-center justify-between w-full">
                                        <span className="flex items-center"><GraduationCap className="mr-3 text-purple-600" />{courseName}</span>
                                        <div className="flex items-center">
                                            <Badge className="bg-purple-300 text-black px-4 py-2 border-2 border-black rounded-base font-heading text-sm mr-4">
                                                {rows.reduce((sum, r) => sum + (r.Total || 0), 0)} Seats
                                            </Badge>
                                            <ChevronDown className="h-6 w-6 transition-transform duration-200" />
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-6 bg-gray-100">
                                    {rows.map(row => (
                                        <div key={row.id} className="mb-6 p-4 border-2 border-black rounded-base bg-white shadow-inner">
                                            <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-dashed border-black">
                                                <div>
                                                    <p className="font-heading text-lg">Choice Code: <span className="font-mono text-purple-600">{row.choice_code}</span></p>
                                                    <p className="font-base text-md">Seat Type: <span className="font-semibold text-gray-800">{row.seat_type}</span></p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-heading text-lg">Total Seats</p>
                                                    <p className="font-bold text-4xl text-purple-600">{row.Total}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4 justify-center">
                                                <SeatCategoryCard category="OPEN" general={row.OPEN_General} ladies={row.OPEN_Ladies} />
                                                <SeatCategoryCard category="SC" general={row.SC_General} ladies={row.SC_Ladies} />
                                                <SeatCategoryCard category="ST" general={row.ST_General} ladies={row.ST_Ladies} />
                                                <SeatCategoryCard category="OBC" general={row.OBC_General} ladies={row.OBC_Ladies} />
                                                <SeatCategoryCard category="VJ/DT" general={row.VJ_DT_General} ladies={row.VJ_DT_Ladies} />
                                                <SeatCategoryCard category="NT-B" general={row.NTB_General} ladies={row.NTB_Ladies} />
                                                <SeatCategoryCard category="NT-C" general={row.NTC_General} ladies={row.NTC_Ladies} />
                                                <SeatCategoryCard category="NT-D" general={row.NTD_General} ladies={row.NTD_Ladies} />
                                                <SeatCategoryCard category="SEBC" general={row.SEBC_General} ladies={row.SEBC_Ladies} />
                                            </div>
                                            <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                                                    <div className="p-3 rounded-base bg-blue-100 border-2 border-black">
                                                        <div className="text-2xl font-bold text-blue-800">{row.PWD_total + row.PWD_common_reserved}</div>
                                                        <div className="text-sm font-heading text-blue-900">PWD Seats (Total)</div>
                                                    </div>
                                                    <div className="p-3 rounded-base bg-green-100 border-2 border-black">
                                                        <div className="text-2xl font-bold text-green-800">{row.DEF_total + row.DEF_common_reserved}</div>
                                                        <div className="text-sm font-heading text-green-900">Defence Seats (Total)</div>
                                                    </div>
                                                    <div className="p-3 rounded-base bg-yellow-100 border-2 border-black">
                                                        <div className="text-2xl font-bold text-yellow-800">{row.TFWS_seats}</div>
                                                        <div className="text-sm font-heading text-yellow-900">TFWS Seats</div>
                                                    </div>
                                                    
                                                    <div className="p-3 rounded-base bg-orange-100 border-2 border-black">
                                                        <div className="text-2xl font-bold text-orange-800">{row.orphan}</div>
                                                        <div className="text-sm font-heading text-orange-900">Orphan Seats</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>
        </div>
    );
}