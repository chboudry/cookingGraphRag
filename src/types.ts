export interface DocMeta {
  id: string
  path: string
  title: string
}

export interface SidebarFolder {
  type: 'folder'
  name: string
  key: string
  children: SidebarNode[]
  sortNum: number
  sortLabel: string
}

export interface SidebarDoc {
  type: 'doc'
  path: string
  title: string
  sortNum: number
  sortLabel: string
}

export type SidebarNode = SidebarFolder | SidebarDoc
