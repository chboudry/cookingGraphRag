import { useState, useMemo } from 'react'
import type { SidebarNode } from './types'

interface SidebarProps {
  tree: SidebarNode[]
  currentPath: string | null
  onSelect: (path: string) => void
}

function collectFolderKeys(nodes: SidebarNode[]): string[] {
  const out: string[] = []
  function walk(n: SidebarNode) {
    if (n.type === 'folder') {
      out.push(n.key)
      n.children.forEach(walk)
    }
  }
  nodes.forEach(walk)
  return out
}

export function Sidebar({ tree, currentPath, onSelect }: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const allFolderKeys = useMemo(() => collectFolderKeys(tree), [tree])

  const collapseAll = () => {
    setExpanded(() => ({}))
  }

  const expandAll = () => {
    setExpanded(() => allFolderKeys.reduce<Record<string, boolean>>((acc, k) => ({ ...acc, [k]: true }), {}))
  }

  const toggleFolder = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Documentation</h1>
        <div className="sidebar-actions">
          <button type="button" className="sidebar-action-btn" onClick={expandAll} title="Expand all">
            Expand all
          </button>
          <button type="button" className="sidebar-action-btn" onClick={collapseAll} title="Collapse all">
            Collapse all
          </button>
        </div>
      </div>
      <nav className="sidebar-nav">
        <SidebarTree
          nodes={tree}
          currentPath={currentPath}
          onSelect={onSelect}
          expanded={expanded}
          onToggleFolder={toggleFolder}
          depth={0}
        />
      </nav>
    </aside>
  )
}

interface TreeProps {
  nodes: SidebarNode[]
  currentPath: string | null
  onSelect: (path: string) => void
  expanded: Record<string, boolean>
  onToggleFolder: (key: string) => void
  depth: number
}

function SidebarTree({ nodes, currentPath, onSelect, expanded, onToggleFolder, depth }: TreeProps) {
  return (
    <ul className="sidebar-tree" style={{ paddingLeft: depth > 0 ? '1rem' : 0 }}>
      {nodes.map((node) => {
        if (node.type === 'doc') {
          return (
            <li key={node.path} className="sidebar-tree-item">
              <button
                type="button"
                className={`sidebar-link ${node.path === currentPath ? 'sidebar-link--active' : ''}`}
                onClick={() => onSelect(node.path)}
              >
                {node.title}
              </button>
            </li>
          )
        }
        const isOpen = expanded[node.key]
        return (
          <li key={node.key} className="sidebar-tree-item sidebar-tree-folder">
            <button
              type="button"
              className="sidebar-folder-btn"
              onClick={() => onToggleFolder(node.key)}
              aria-expanded={isOpen}
            >
              <span className="sidebar-folder-chevron" aria-hidden>
                {isOpen ? '▼' : '▶'}
              </span>
              <span className="sidebar-folder-name">{node.name}</span>
            </button>
            {isOpen && (
              <SidebarTree
                nodes={node.children}
                currentPath={currentPath}
                onSelect={onSelect}
                expanded={expanded}
                onToggleFolder={onToggleFolder}
                depth={depth + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
