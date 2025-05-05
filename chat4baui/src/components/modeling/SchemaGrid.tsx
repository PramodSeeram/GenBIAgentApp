import React, { useState, useEffect, useRef } from 'react';
import SchemaCard from './SchemaCard';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface SchemaGridProps {
  schemas: Array<{
    id?: string;
    name?: string;
    title?: string;
    columns?: Array<{ name: string; type: string }>;
    fields?: Array<{ name: string; type: string; required?: boolean }>;
    position?: { x: number, y: number };
  }>;
  displayedSchemas: string[];
  relations?: Array<{from: string; to: string; fromField: string; toField: string}>;
  onSchemaClick?: (schemaName: string) => void;
}

const SchemaGrid: React.FC<SchemaGridProps> = ({ 
  schemas = [], 
  displayedSchemas = [], 
  relations = [],
  onSchemaClick
}) => {
  const { theme } = useTheme();
  const [schemaPositions, setSchemaPositions] = useState<Record<string, {x: number, y: number}>>({});
  const gridRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  
  console.log('SchemaGrid rendering with schemas:', schemas.length);
  console.log('DisplayedSchemas:', displayedSchemas);
  
  // Safely filter schemas by name or id
  const filteredSchemas = React.useMemo(() => {
    try {
      if (!Array.isArray(schemas)) {
        console.error('Schemas is not an array:', schemas);
        return [];
      }
      
      return schemas.filter(schema => {
        if (!schema) return false;
        const schemaId = schema.id || schema.name || '';
        return displayedSchemas.includes(schemaId);
      });
    } catch (error) {
      console.error('Error filtering schemas:', error);
      setHasError(true);
      return [];
    }
  }, [schemas, displayedSchemas]);
  
  // Initialize positions from schema data or use defaults
  useEffect(() => {
    try {
      const initialPositions: Record<string, {x: number, y: number}> = {};
      
      filteredSchemas.forEach((schema, index) => {
        if (!schema) return;
        const schemaId = schema.id || schema.name || '';
        if (!schemaId) return;
        
        if (schema.position) {
          initialPositions[schemaId] = schema.position;
        } else {
          // Default positioning if not specified
          const col = index % 2;
          const row = Math.floor(index / 2);
          initialPositions[schemaId] = {
            x: 20 + col * 340,
            y: 50 + row * 300
          };
        }
      });
      
      setSchemaPositions(initialPositions);
    } catch (error) {
      console.error('Error initializing schema positions:', error);
      setHasError(true);
    }
  }, [filteredSchemas]);

  const handlePositionChange = (id: string, x: number, y: number) => {
    try {
      setSchemaPositions(prev => ({
        ...prev,
        [id]: { x, y }
      }));
    } catch (error) {
      console.error('Error updating schema position:', error);
    }
  };
  
  const handleSchemaClick = (schemaId: string) => {
    if (!onSchemaClick) return;
    
    try {
      // Find the schema by id
      const schema = schemas.find(s => s && (s.id || s.name) === schemaId);
      if (schema) {
        onSchemaClick(schema.name || schema.id || schemaId);
      }
    } catch (error) {
      console.error('Error handling schema click:', error);
    }
  };
  
  const drawRelationLines = () => {
    if (!relations || !Array.isArray(relations) || relations.length === 0 || !gridRef.current) return null;
    
    try {
      return relations.map((relation, idx) => {
        if (!relation) return null;
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
    } catch (error) {
      console.error('Error drawing relation lines:', error);
      return null;
    }
  };

  if (hasError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error rendering schema</h3>
          <p className="text-muted-foreground">There was a problem displaying the schema. Please try again or contact support.</p>
        </div>
      </div>
    );
  }

  if (!filteredSchemas || filteredSchemas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h3 className="text-lg font-medium mb-2">No schema data available</h3>
          <p className="text-muted-foreground">Upload files to see schema visualizations</p>
        </div>
      </div>
    );
  }

  return (
    <main ref={gridRef} className="flex-1 bg-background overflow-auto relative h-full transition-colors duration-300">
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
      {filteredSchemas.map((schema, index) => {
        if (!schema) return null;
        
        // Ensure we have valid schema properties
        const schemaId = schema.id || schema.name || `schema-${index}`;
        const schemaTitle = schema.title || schema.name || `Schema ${index + 1}`;
        
        // Ensure columns is a valid array
        const schemaColumns = schema.columns || 
          (schema.fields ? schema.fields.map(f => ({ 
            name: f ? f.name : '', 
            type: f && f.type ? f.type : 'string' 
          })) : []);
          
        // Skip rendering if no columns or name
        if ((!schemaColumns || schemaColumns.length === 0) && !schemaTitle) return null;
        
        return (
          <SchemaCard
            key={schemaId}
            schema={{
              id: schemaId,
              title: schemaTitle,
              columns: schemaColumns
            }}
            isSecondRow={index >= 2}
            onPositionChange={handlePositionChange}
            relations={relations?.filter(r => r && (r.from === schemaId || r.to === schemaId))}
            onClick={() => handleSchemaClick(schemaId)}
          />
        );
      })}
    </main>
  );
};

export default SchemaGrid;
