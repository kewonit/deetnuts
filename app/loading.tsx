"use client";

import React, { useState, useEffect } from 'react';

const MUMBAI_COORDS = { lat: 19.0760, lon: 72.8777 };

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const Loading: React.FC = () => {
    const [distance, setDistance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
                    throw new Error('Invalid location data');
                }
                const calculatedDistance = calculateDistance(
                    data.latitude, 
                    data.longitude, 
                    MUMBAI_COORDS.lat, 
                    MUMBAI_COORDS.lon
                );
                setDistance(Math.round(calculatedDistance));
            } catch (error) {
                console.error("Error fetching location:", error);
                setError("Unable to estimate distance. Please try again later.");
            }
        };

        fetchLocation();

        return () => {
            <p>err</p>
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-700 via-purple-500 to-yellow-400">
            <div className="text-white text-center">
                <h1 className="text-5xl md:text-7xl font-bold mb-4">Loading...</h1>
                <p className="text-xl md:text-2xl mb-8">
                    {error ? error :
                     distance !== null
                        ? `The data travels approximately ${distance} kilometers to reach you`
                        : "Estimating distance to server..."}
                </p>
            </div>
            <div className="flex space-x-3">
                {[...Array(3)].map((_, index) => (
                    <div key={index} 
                         className="w-4 h-4 bg-white rounded-full animate-bounce" 
                         style={{ animationDelay: `${index * 0.1}s` }}
                    />
                ))}
            </div>
        </div>
    );
};

export default Loading;