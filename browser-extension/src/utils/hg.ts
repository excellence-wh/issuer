let API_BASE_URL = 'http://localhost:3001'

export interface HgFileChange {
  path: string
  status: string
  revision: string
}

export interface HgChangeSet {
  revision: string
  node: string
  author: string
  date: string
  summary: string
  files: HgFileChange[]
}

export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url
}

const parseResponse = async <T>(response: Response): Promise<T | null> => {
  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const json = await response.json()
  return json.success ? json.data : null
}

export const getHgChangesetByIssue = async (issueNumber: string, repoPath: string): Promise<HgChangeSet | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/hg/changeset?issue=${encodeURIComponent(issueNumber)}&repoPath=${encodeURIComponent(repoPath)}`
    )
    return parseResponse(response)
  } catch (error) {
    console.error(`Failed to get hg changeset for issue ${issueNumber}:`, error)
    return null
  }
}

export const getHgFilesByIssue = async (issueNumber: string, repoPath: string, allHistory: boolean = false): Promise<HgFileChange[]> => {
  try {
    const url = `${API_BASE_URL}/api/hg/files?issue=${encodeURIComponent(issueNumber)}&repoPath=${encodeURIComponent(repoPath)}${allHistory ? '&allHistory=true' : ''}`
    const response = await fetch(url)
    const data = await response.json()
    return data.success ? data.data : []
  } catch (error) {
    console.error(`Failed to get hg files for issue ${issueNumber}:`, error)
    return []
  }
}

export const getHgFilesDiffByIssue = async (issueNumber: string, repoPath: string): Promise<string> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/hg/diff?issue=${encodeURIComponent(issueNumber)}&repoPath=${encodeURIComponent(repoPath)}`
    )
    const data = await response.json()
    return data.success ? data.diff : ''
  } catch (error) {
    console.error(`Failed to get hg diff for issue ${issueNumber}:`, error)
    return ''
  }
}

export const getAllIssueNumbersFromHgLog = async (repoPath: string): Promise<string[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/hg/issues?repoPath=${encodeURIComponent(repoPath)}`
    )
    const data = await response.json()
    return data.success ? data.issues : []
  } catch (error) {
    console.error('Failed to get issue numbers from hg log:', error)
    return []
  }
}

export const parseDiffToFiles = (diff: string): { filename: string; content: string }[] => {
  const files: { filename: string; content: string }[] = []
  const lines = diff.split('\n')
  let currentFile = ''
  let currentContent = ''

  for (const line of lines) {
    if (line.startsWith('diff -r')) {
      if (currentFile) {
        files.push({ filename: currentFile, content: currentContent.trim() })
      }
      currentFile = line.split(' ').pop() || ''
      currentContent = line + '\n'
    } else if (currentFile) {
      currentContent += line + '\n'
    }
  }

  if (currentFile) {
    files.push({ filename: currentFile, content: currentContent.trim() })
  }

  return files
}

export const getAllHgFilesByIssue = async (issueNumber: string, repoPath: string): Promise<HgFileChange[]> => {
  return getHgFilesByIssue(issueNumber, repoPath, true)
}

export const getFileChangesSummary = (files: HgFileChange[]): string => {
  if (files.length === 0) return '无'
  return files.map(f => `${f.status === 'A' ? '新增' : f.status === 'D' ? '删除' : '修改'}: ${f.path}`).join('\n')
}
