import React from 'react';
import './SplitPane.css';

/**
 * SplitPane — Shared layout component for side-by-side editing and preview.
 * Used by Markdown Editor, Code Generator, etc.
 */
export default function SplitPane({ left, right, leftTitle, rightTitle }) {
    return (
        <div className="split-pane">
            <div className="pane left-pane">
                {leftTitle && <div className="pane-header">{leftTitle}</div>}
                <div className="pane-content">{left}</div>
            </div>
            <div className="pane-divider"></div>
            <div className="pane right-pane">
                {rightTitle && <div className="pane-header">{rightTitle}</div>}
                <div className="pane-content">{right}</div>
            </div>
        </div>
    );
}
