import { Children, isValidElement, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid' // mermaid.js – render diagrams from code to SVG
import type { Components } from 'react-markdown'
import { ZoomPanMermaid } from './MermaidDiagram'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    background: '#0c0c0e',
    primaryColor: '#1e293b',
    primaryTextColor: '#e4e4e7',
    primaryBorderColor: '#334155',
    lineColor: '#64748b',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
  },
})

interface DocPageProps {
  content: string
}

export function DocPage({ content }: DocPageProps) {
  const components: Components = {
    pre({ children }) {
      const child = Children.toArray(children)[0]
      const isMermaid =
        isValidElement(child) &&
        (child.type === ZoomPanMermaid ||
          (typeof (child.props as { className?: string }).className === 'string' &&
            (child.props as { className: string }).className.includes('mermaid-')))
      if (isMermaid) return <>{children}</>
      return <pre>{children}</pre>
    },
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className ?? '')
      const code = String(children).replace(/\n$/, '')
      if (match?.[1] === 'mermaid') {
        return <MermaidBlock key={node?.position?.start.line ?? 0} code={code} />
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
  }

  return (
    <div className="doc-page">
      <article className="doc-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  )
}

function MermaidBlock({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
    mermaid
      .render(id, code)
      .then((res: string | { svg?: string }) => {
        if (cancelled) return
        const s = typeof res === 'string' ? res : res?.svg ?? ''
        setSvg(s)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err ?? 'Mermaid error'))
      })
    return () => {
      cancelled = true
    }
  }, [code])

  if (error) {
    return <pre className="mermaid-error">{error}</pre>
  }
  if (!svg) {
    return <div className="mermaid-loading">Chargement du schéma…</div>
  }
  return <ZoomPanMermaid svg={svg} />
}
