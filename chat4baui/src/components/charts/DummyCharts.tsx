
import React from 'react';

export const DummyBarChart: React.FC = () => {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 flex items-end justify-between gap-1 pb-6 pt-6">
        {[45, 75, 25, 65, 35, 55, 30].map((height, i) => (
          <div key={i} className="h-full flex flex-col justify-end flex-1 px-1">
            <div 
              className="bg-chat4ba-500 rounded-t-sm" 
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
      <div className="h-6 flex justify-between text-xs text-muted-foreground px-1">
        <div>Jan</div>
        <div>Feb</div>
        <div>Mar</div>
        <div>Apr</div>
        <div>May</div>
        <div>Jun</div>
        <div>Jul</div>
      </div>
    </div>
  );
};

export const DummyLineChart: React.FC = () => {
  // SVG path for a dummy line chart
  const points = [
    [0, 70],
    [15, 40],
    [30, 60],
    [45, 35],
    [60, 55],
    [75, 20],
    [90, 45],
    [100, 30]
  ];
  
  const pathD = points.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`
  ).join(' ');
  
  return (
    <div className="h-full w-full flex items-center justify-center">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line 
            key={`grid-${y}`}
            x1="0" 
            y1={y} 
            x2="100" 
            y2={y} 
            stroke="#e5e7eb" 
            strokeWidth="0.5"
          />
        ))}
        
        {/* Line path */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="#1a91e6" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Data points */}
        {points.map((point, i) => (
          <circle 
            key={i}
            cx={point[0]} 
            cy={point[1]} 
            r="2" 
            fill="#1a91e6" 
          />
        ))}
      </svg>
    </div>
  );
};

export const DummyPieChart: React.FC = () => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <svg width="80%" height="80%" viewBox="0 0 100 100">
        {/* Simple pie chart with segments */}
        <circle cx="50" cy="50" r="45" fill="white" />
        
        {/* Pie segments - approximated with circle sectors */}
        <path d="M 50 50 L 95 50 A 45 45 0 0 1 72.5 92.5 Z" fill="#1a91e6" />
        <path d="M 50 50 L 72.5 92.5 A 45 45 0 0 1 5 60 Z" fill="#60a5fa" />
        <path d="M 50 50 L 5 60 A 45 45 0 0 1 15 15 Z" fill="#93c5fd" />
        <path d="M 50 50 L 15 15 A 45 45 0 0 1 95 50 Z" fill="#bfdbfe" />
        
        {/* Center circle for donut effect */}
        <circle cx="50" cy="50" r="20" fill="white" />
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 text-xs space-y-1">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-chat4ba-500 mr-1"></div>
          <span>North</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-chat4ba-400 mr-1"></div>
          <span>South</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-chat4ba-300 mr-1"></div>
          <span>East</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-chat4ba-200 mr-1"></div>
          <span>West</span>
        </div>
      </div>
    </div>
  );
};
