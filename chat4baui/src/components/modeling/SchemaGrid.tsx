
import React, { useState, useEffect, useRef } from 'react';
import SchemaCard from './SchemaCard';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface SchemaGridProps {
  schemas: Array<{
    id: string;
    title: string;
    columns: Array<{ name: string; type: string }>;
    position?: { x: number, y: number };
  }>;
  displayedSchemas: string[];
  relations?: Array<{from: string; to: string; fromField: string; toField: string}>;
}

const SchemaGrid: React.FC<SchemaGridProps> = ({ schemas, displayedSchemas, relations }) => {
  const { theme } = useTheme();
  const [schemaPositions, setSchemaPositions] = useState<Record<string, {x: number, y: number}>>({});
  const gridRef = useRef<HTMLDivElement>(null);
  const filteredSchemas = schemas.filter(schema => displayedSchemas.includes(schema.id));
  
  // Initialize positions from schema data or use defaults
  useEffect(() => {
    const initialPositions: Record<string, {x: number, y: number}> = {};
    
    filteredSchemas.forEach((schema, index) => {
      if (schema.position) {
        initialPositions[schema.id] = schema.position;
      } else {
        // Default positioning if not specified
        const col = index % 2;
        const row = Math.floor(index / 2);
        initialPositions[schema.id] = {
          x: 20 + col * 340,
          y: 50 + row * 300
        };
      }
    });
    
    setSchemaPositions(initialPositions);
  }, [filteredSchemas]);

  const handlePositionChange = (id: string, x: number, y: number) => {
    setSchemaPositions(prev => ({
      ...prev,
      [id]: { x, y }
    }));
  };
  
  const drawRelationLines = () => {
    if (!relations || !gridRef.current) return null;
    
    return relations.map((relation, idx) => {
      const fromPos = schemaPositions[relation.from];
      const toPos = schemaPositions[relation.to];
      
      if (!fromPos || !toPos) return null;
      
      // Calculate rough center positions
      const fromX = fromPos.x + 160; // Half of card width
      const fromY = fromPos.y + 100; // Approximate center of card
      const toX = toPos.x + 160;
      const toY = toPos.y + 100;
      
      // Create a nice bezier curve for the connection
      const path = `M${fromX},${fromY} C${fromX + (toX - fromX) / 2},${fromY} ${toX - (toX - fromX) / 2},${toY} ${toX},${toY}`;
      
      return (
        <svg key={idx} className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <path
            d={path}
            stroke={theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
            strokeWidth="2"
            fill="none"
            strokeDasharray="4,4"
            markerEnd="url(#arrowhead)"
            className="transition-all duration-300 animate-pulse"
          />
        </svg>
      );
    });
  };

  return (
    <main ref={gridRef} className="flex-1 bg-background p-4 overflow-auto relative h-full transition-colors duration-300">
      {/* SVG definitions for arrows */}
      <svg className="absolute w-0 h-0">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon 
              points="0 0, 10 3.5, 0 7" 
              fill={theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} 
              className="transition-all duration-300" 
            />
          </marker>
        </defs>
      </svg>
      
      {/* Render relation lines */}
      {drawRelationLines()}
      
      {/* Render schema cards */}
      {filteredSchemas.map((schema, index) => (
        <SchemaCard
          key={schema.id}
          schema={schema}
          isSecondRow={index >= 2}
          onPositionChange={handlePositionChange}
          relations={relations?.filter(r => r.from === schema.id || r.to === schema.id)}
        />
      ))}
    </main>
  );
};

export default SchemaGrid;
