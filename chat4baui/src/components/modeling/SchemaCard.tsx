import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  ChevronDown, 
  KeyIcon, 
  CalendarIcon, 
  TextIcon,
  NumberIcon,
  FlagIcon
} from './SchemaIcons';
import { useDrag } from '@/hooks/useDrag';
import { cn } from '@/lib/utils';

interface SchemaCardProps {
  schema: {
    id: string;
    title: string;
    columns: Array<{ name: string; type: string }>;
  };
  isSecondRow?: boolean;
  onPositionChange?: (id: string, x: number, y: number) => void;
  relations?: Array<{from: string; to: string; fromField: string; toField: string}>;
  selectedColumns?: string[];
  onSelectColumn?: (name: string) => void;
  onClick?: () => void;
}

const SchemaCard: React.FC<SchemaCardProps> = ({ 
  schema, 
  isSecondRow, 
  onPositionChange, 
  relations = [],
  selectedColumns = [],
  onSelectColumn,
  onClick
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Validate schema data
  if (!schema || !schema.id || !schema.title) {
    console.error('Invalid schema data:', schema);
    return null;
  }

  // Ensure columns is an array
  const columns = Array.isArray(schema.columns) ? schema.columns : [];

  const { position, nodeRef } = useDrag({
    id: schema.id,
    onDragStart: () => setIsDragging(true),
    onDragEnd: (x, y) => {
      try {
        if (onPositionChange) {
          onPositionChange(schema.id, x, y);
        }
        // Wait a bit before allowing clicks again to prevent click after drag
        setTimeout(() => setIsDragging(false), 100);
      } catch (error) {
        console.error('Error in drag end handler:', error);
        setIsDragging(false);
      }
    }
  });

  const toggleExpand = (e: React.MouseEvent) => {
    try {
      e.stopPropagation();
      setExpanded(!expanded);
    } catch (error) {
      console.error('Error toggling expand:', error);
    }
  };

  const handleCardClick = () => {
    try {
      if (!isDragging && onClick) {
        onClick();
      }
    } catch (error) {
      console.error('Error handling card click:', error);
    }
  };

  // Filter relations for this schema
  const schemaRelations = Array.isArray(relations) 
    ? relations.filter(
        r => r && (r.from === schema.id || r.to === schema.id)
      )
    : [];

  const handleColumnClick = (e: React.MouseEvent, columnName: string) => {
    try {
      e.stopPropagation();
      if (onSelectColumn) {
        onSelectColumn(columnName);
      }
    } catch (error) {
      console.error('Error handling column click:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    try {
      if (!type) return <TextIcon className="h-4 w-4 mr-2 text-muted-foreground" />;
      
      const lowerType = type.toLowerCase();
      if (lowerType === 'key' || lowerType === 'id') return <KeyIcon className="h-4 w-4 mr-2 text-muted-foreground" />;
      if (lowerType === 'date' || lowerType === 'timestamp' || lowerType === 'datetime') return <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />;
      if (lowerType === 'text' || lowerType === 'string') return <TextIcon className="h-4 w-4 mr-2 text-muted-foreground" />;
      if (lowerType === 'number' || lowerType === 'integer' || lowerType === 'float' || lowerType === 'decimal') return <NumberIcon className="h-4 w-4 mr-2 text-muted-foreground" />;
      if (lowerType === 'flag' || lowerType === 'boolean') return <FlagIcon className="h-4 w-4 mr-2 text-muted-foreground" />;
      return <TextIcon className="h-4 w-4 mr-2 text-muted-foreground" />;
    } catch (error) {
      console.error('Error getting type icon:', error);
      return <TextIcon className="h-4 w-4 mr-2 text-muted-foreground" />;
    }
  };

  try {
    return (
      <Card 
        ref={nodeRef}
        className={cn(
          "overflow-hidden border border-border absolute shadow-lg transition-all duration-300 animate-fade-in dark:bg-card",
          onClick ? "cursor-pointer hover:ring-2 hover:ring-primary/50" : "cursor-move hover:shadow-xl"
        )}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: '320px',
          zIndex: 10
        }}
        onClick={handleCardClick}
      >
        <div className="bg-primary/90 text-primary-foreground px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-primary-foreground/50 mr-2"></div>
            <span>{schema.title}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="p-1 hover:bg-primary/80 rounded transition-colors"
              onClick={toggleExpand}
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        <div className="px-4 py-2 border-b border-border">
          <h4 className="text-sm font-medium">Columns</h4>
        </div>
        <div className="bg-card">
          <table className="w-full text-sm">
            <tbody>
              {columns.slice(0, expanded ? columns.length : 6).map((column, idx) => (
                <tr 
                  key={idx} 
                  className={cn(
                    "border-b border-border hover:bg-accent/50 transition-colors cursor-pointer",
                    Array.isArray(selectedColumns) && column.name && selectedColumns.includes(column.name) && "bg-accent"
                  )}
                  onClick={(e) => handleColumnClick(e, column.name || '')}
                >
                  <td className="px-4 py-1.5 flex items-center">
                    {getTypeIcon(column.type || '')}
                    {column.name || ''}
                  </td>
                </tr>
              ))}
              {columns.length === 0 && (
                <tr>
                  <td className="px-4 py-2 text-xs text-muted-foreground italic">
                    No columns defined
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {!expanded && columns.length > 6 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>and {columns.length - 6} more</span>
                <button onClick={toggleExpand}>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {(expanded || isSecondRow) && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
              <div className="flex items-center justify-between">
                <span>Relationships</span>
                <ChevronDown className="h-4 w-4" />
              </div>
              {schemaRelations && schemaRelations.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {schemaRelations.map((rel, idx) => (
                    <li key={idx} className="text-xs">
                      {rel.from === schema.id ? (
                        <span>
                          <span className="font-medium">{rel.fromField}</span> → {rel.to}.{rel.toField}
                        </span>
                      ) : (
                        <span>
                          <span className="font-medium">{rel.toField}</span> ← {rel.from}.{rel.fromField}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs italic">No relationships defined</p>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  } catch (error) {
    console.error('Error rendering SchemaCard:', error);
    return null;
  }
};

export default SchemaCard;
