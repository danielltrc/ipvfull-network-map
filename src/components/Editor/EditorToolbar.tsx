import React, { useEffect, useCallback } from 'react';
import { EditorTool } from '../../types';

interface EditorToolbarProps {
  activeTool: EditorTool;
  onSetTool: (tool: EditorTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  isDirty: boolean;
  onSave: () => void;
}

const TOOLS: { id: EditorTool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'addDevice', label: 'Add Device', icon: '+□' },
  { id: 'addLink', label: 'Add Link', icon: '+—' },
  { id: 'delete', label: 'Delete', icon: '⌫' },
  { id: 'pan', label: 'Pan', icon: '✥' },
];

export function EditorToolbar({
  activeTool,
  onSetTool,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  snapToGrid,
  onToggleSnap,
  isDirty,
  onSave,
}: EditorToolbarProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        onRedo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    },
    [onUndo, onRedo, onSave]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        gap: 4,
        background: 'rgba(8, 12, 24, 0.9)',
        border: '1px solid #2a3a5a',
        borderRadius: 8,
        padding: '6px 8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        alignItems: 'center',
      }}
    >
      {/* Tool buttons */}
      {TOOLS.map((tool) => (
        <ToolButton
          key={tool.id}
          label={tool.label}
          icon={tool.icon}
          active={activeTool === tool.id}
          onClick={() => onSetTool(tool.id)}
        />
      ))}

      <Separator />

      {/* Undo / Redo */}
      <ToolButton label="Undo (⌘Z)" icon="↩" active={false} disabled={!canUndo} onClick={onUndo} />
      <ToolButton label="Redo (⌘Y)" icon="↪" active={false} disabled={!canRedo} onClick={onRedo} />

      <Separator />

      {/* Snap to grid */}
      <ToolButton
        label="Snap to Grid"
        icon="⊞"
        active={snapToGrid}
        onClick={onToggleSnap}
      />

      <Separator />

      {/* Save indicator */}
      <button
        onClick={onSave}
        title="Save (⌘S)"
        style={{
          background: isDirty ? 'rgba(255, 136, 0, 0.2)' : 'transparent',
          border: `1px solid ${isDirty ? '#ff8800' : '#333'}`,
          borderRadius: 4,
          color: isDirty ? '#ff8800' : '#00cc88',
          padding: '3px 8px',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'monospace',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isDirty ? '#ff8800' : '#00cc88',
            display: 'inline-block',
          }}
        />
        {isDirty ? 'Save' : 'Saved'}
      </button>
    </div>
  );
}

function ToolButton({
  label,
  icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: active ? 'rgba(68, 136, 255, 0.25)' : 'transparent',
        border: `1px solid ${active ? '#4488ff' : 'transparent'}`,
        borderRadius: 4,
        color: disabled ? '#444' : active ? '#4488ff' : '#aaa',
        padding: '3px 8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        fontFamily: 'monospace',
        transition: 'all 0.15s ease',
        minWidth: 32,
      }}
    >
      {icon}
    </button>
  );
}

function Separator() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: '#2a3a5a',
        margin: '0 2px',
      }}
    />
  );
}
