import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { DocPage } from './DocPage'
import './App.css'
import type { SidebarNode, SidebarFolder } from './types'

const docModules = import.meta.glob<string>('/content/**/*.md', { query: '?raw', import: 'default' })

/** Strip optional INT_ prefix (digits + underscore); return display name and sort number. */
function parseSegment(segment: string): { sortNum: number; displayName: string } {
  const m = /^(\d+)_(.*)$/.exec(segment)
  if (m) return { sortNum: parseInt(m[1], 10), displayName: m[2] }
  return { sortNum: Number.POSITIVE_INFINITY, displayName: segment }
}

function pathToTitle(name: string): string {
  return name
    .split(/[/-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function buildSidebarTree(paths: string[]): SidebarNode[] {
  const children: SidebarNode[] = []

  function getOrCreateFolder(
    siblings: SidebarNode[],
    key: string,
    sortNum: number,
    sortLabel: string
  ): SidebarFolder {
    const existing = siblings.find((n) => n.type === 'folder' && n.key === key)
    if (existing && existing.type === 'folder') return existing
    const folder: SidebarFolder = {
      type: 'folder',
      name: pathToTitle(sortLabel),
      key,
      children: [],
      sortNum,
      sortLabel,
    }
    siblings.push(folder)
    return folder
  }

  function addAt(level: SidebarNode[], fullPath: string, segments: string[], keyPrefix: string) {
    const seg = segments[0]
    if (!seg) return
    const { sortNum, displayName: sortLabel } = parseSegment(seg)
    const displayTitle = pathToTitle(sortLabel)

    if (segments.length === 1) {
      level.push({
        type: 'doc',
        path: fullPath,
        title: displayTitle,
        sortNum,
        sortLabel,
      })
      return
    }
    const key = keyPrefix ? `${keyPrefix}/${seg}` : seg
    const folder = getOrCreateFolder(level, key, sortNum, sortLabel)
    addAt(folder.children, fullPath, segments.slice(1), key)
  }

  for (const fullPath of paths) {
    const rel = fullPath.replace(/^\/content\//, '').replace(/\.md$/, '')
    const segments = rel.split('/').filter(Boolean)
    addAt(children, fullPath, segments, '')
  }

  function sortNodes(nodes: SidebarNode[]): void {
    nodes.sort((a, b) => {
      if (a.sortNum !== b.sortNum) return a.sortNum - b.sortNum
      return a.sortLabel.localeCompare(b.sortLabel)
    })
    nodes.forEach((n) => {
      if (n.type === 'folder') sortNodes(n.children)
    })
  }
  sortNodes(children)
  return children
}

function collectDocPaths(nodes: SidebarNode[]): string[] {
  const out: string[] = []
  function walk(n: SidebarNode) {
    if (n.type === 'doc') out.push(n.path)
    else n.children.forEach(walk)
  }
  nodes.forEach(walk)
  return out
}

const contentPaths = Object.keys(docModules)
const sidebarTree = buildSidebarTree(contentPaths)
const orderedPaths = collectDocPaths(sidebarTree)

function App() {
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    if (!currentPath) return
    const load = docModules[currentPath]
    if (typeof load === 'function') {
      load().then((text: string) => setContent(text ?? ''))
    } else {
      setContent((load as unknown as string) ?? '')
    }
  }, [currentPath])

  useEffect(() => {
    if (orderedPaths.length && currentPath === null) setCurrentPath(orderedPaths[0])
  }, [currentPath])

  return (
    <div className="app">
      <Sidebar
        tree={sidebarTree}
        currentPath={currentPath}
        onSelect={setCurrentPath}
      />
      <main className="main">
        <DocPage content={content} />
      </main>
    </div>
  )
}

export default App
