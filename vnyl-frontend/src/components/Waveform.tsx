import React, { useEffect, useState } from 'react';

interface WaveformProps {
    isPlaying: boolean;
    color?: string;
    progress?: number; // 0 to 100
}

const Waveform: React.FC<WaveformProps> = ({ isPlaying, color = 'white' }) => {
    // Generate random heights for the bars
    // Reduced count (80) and height multiplier (0.5) for a subtler look
    const [bars] = useState(() => Array.from({ length: 80 }, () => Math.random() * 0.5 + 0.1));

    return (
        <div className="flex items-end justify-center gap-[3px] h-full w-full py-2 px-4">
            {bars.map((height, i) => {
                return (
                    <div
                        key={i}
                        className="w-[3px] rounded-full transition-all duration-300 ease-in-out"
                        style={{
                            height: `${height * 100}%`,
                            backgroundColor: color,
                            opacity: 0.5, // Lower opacity for background feel
                            transformOrigin: 'bottom',
                            animation: isPlaying
                                ? `breath ${1 + Math.random()}s ease-in-out infinite alternate`
                                : 'none',
                        }}
                    />
                );
            })}
            <style>{`
                @keyframes breath {
                    0% { transform: scaleY(1); opacity: 0.6; }
                    50% { transform: scaleY(1.2); opacity: 0.9; }
                    100% { transform: scaleY(1); opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

export default Waveform;
