
import { useRef, useState, useEffect } from 'react';

interface UseDragProps {
  id: string;
  initialX?: number;
  initialY?: number;
  onDragEnd?: (x: number, y: number) => void;
}

interface Position {
  x: number;
  y: number;
}

export function useDrag({ id, initialX = 0, initialY = 0, onDragEnd }: UseDragProps) {
  const [position, setPosition] = useState<Position>({ x: initialX, y: initialY });
  const nodeRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const offset = useRef<Position>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (nodeRef.current?.contains(e.target as Node)) {
        isDragging.current = true;
        const rect = nodeRef.current.getBoundingClientRect();
        offset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current && nodeRef.current) {
        e.preventDefault();
        
        const parentRect = nodeRef.current.parentElement?.getBoundingClientRect();
        if (!parentRect) return;
        
        const x = e.clientX - parentRect.left - offset.current.x;
        const y = e.clientY - parentRect.top - offset.current.y;
        
        setPosition({ x, y });
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current && onDragEnd) {
        onDragEnd(position.x, position.y);
      }
      isDragging.current = false;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position, onDragEnd]);

  return { position, nodeRef };
}
