export interface HgChangeSet {
  revision: string
  node: string
  author: string
  date: string
  summary: string
  files: string[]
}

export interface HgFileInfo {
  path: string
  status: string
  revision: string
}

export interface HgApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface FileDiff {
  path: string
  diff: string
}

export interface IssueInfo {
  revision: string
  node: string
  author: string
  date: string
  summary: string
  files: FileChangeInfo[]
}

export interface FileChangeInfo {
  path: string
  status: string
  revision: string
}
