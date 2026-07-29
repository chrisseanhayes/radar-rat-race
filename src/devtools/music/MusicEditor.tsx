import { useEffect, useRef } from 'react';
import { MusicEditorComponent } from './MusicEditorCore';

export default function MusicEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MusicEditorComponent | null>(null);
  
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = new MusicEditorComponent(containerRef.current);
    }
    
    return () => {
      if (editorRef.current) {
        editorRef.current.cleanup();
        editorRef.current = null;
      }
    };
  }, []);
  
  return <div ref={containerRef}></div>;
}
