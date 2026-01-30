import { exec } from 'child_process'
import { promisify } from 'util'
import type { FileChangeInfo, IssueInfo } from '../types/hg'

const execAsync = promisify(exec)

async function runHgCommand(args: string, repoPath: string): Promise<string> {
  const fullCommand = `hg --cwd "${repoPath}" ${args}`
  const { stdout, stderr } = await execAsync(fullCommand, {
    encoding: 'utf-8'
  })
  return stdout || stderr
}

async function verifyIssueInChangeset(revision: string, issueNumber: string, repoPath: string): Promise<boolean> {
  try {
    const descOutput = await runHgCommand(
      `log -r ${revision} --template "{desc}"`,
      repoPath
    )
    const desc = descOutput.trim()
    // 检查是否包含完整的issue号，支持多种格式：#92520, issue 92520, issue(92520), 92520 & 92380 等
    // 匹配完整单词边界的issue号，避免 92520 匹配到 192520 或 925201
    const exactPattern = new RegExp(`(?:#|issue\\s*\\(?\\s*)?\\b${issueNumber}\\b(?!\\d)`, 'i')
    return exactPattern.test(desc)
  } catch {
    return false
  }
}

async function findAllChangesetsByIssue(issueNumber: string, repoPath: string): Promise<string[]> {
  try {
    const output = await runHgCommand(
      `log --keyword ${issueNumber} --template "{rev}:{node|short} {desc|firstline}\\n"`,
      repoPath
    )
    const lines = output.trim().split('\n').filter(line => line.trim())
    const revisions: string[] = []
    for (const line of lines) {
      const match = line.match(/(\d+):([a-f0-9]+)/)
      if (match) {
        const revision = match[1]
        // 验证提交消息中确实包含完整的issue号
        if (await verifyIssueInChangeset(revision, issueNumber, repoPath)) {
          revisions.push(revision)
        }
      }
    }
    return revisions
  } catch {
    return []
  }
}

async function findChangesetByIssue(issueNumber: string, repoPath: string): Promise<string | null> {
  try {
    const output = await runHgCommand(
      `log --keyword ${issueNumber} --template "{rev}:{node|short} {desc|firstline}\\n"`,
      repoPath
    )
    const lines = output.split('\n').filter(line => line.trim())
    for (const line of lines) {
      const match = line.match(/(\d+):([a-f0-9]+)/)
      if (match) {
        const revision = match[1]
        // 验证提交消息中确实包含完整的issue号
        if (await verifyIssueInChangeset(revision, issueNumber, repoPath)) {
          return revision
        }
      }
    }
    return null
  } catch {
    return null
  }
}

async function getChangesetByIssue(issueNumber: string, repoPath: string): Promise<IssueInfo | null> {
  try {
    const revision = await findChangesetByIssue(issueNumber, repoPath)
    if (!revision) return null

    const revOutput = await runHgCommand(
      `log -r ${revision} --template "{rev}"`,
      repoPath
    )
    const nodeOutput = await runHgCommand(
      `log -r ${revision} --template "{node|short}"`,
      repoPath
    )
    const authorOutput = await runHgCommand(
      `log -r ${revision} --template "{author|person}"`,
      repoPath
    )
    const dateOutput = await runHgCommand(
      `log -r ${revision} --template "{date|isodate}"`,
      repoPath
    )
    const summaryOutput = await runHgCommand(
      `log -r ${revision} --template "{desc|firstline}"`,
      repoPath
    )

    const statOutput = await runHgCommand(
      `log -r ${revision} --stat`,
      repoPath
    )

    const files: { path: string; status: string; revision: string }[] = []
    const lines = statOutput.split('\n')
    for (const line of lines) {
      const match = line.match(/^(\s*)([^|]+)\s*\|\s*[\d\s+]+\s*$/)
      if (match && match[2] && !match[2].includes('files changed')) {
        const status = line.includes('+') ? 'A' : line.includes('-') ? 'D' : 'M'
        files.push({ path: match[2].trim(), status, revision })
      }
    }

    return {
      revision: revOutput.trim(),
      node: nodeOutput.trim(),
      author: authorOutput.trim(),
      date: dateOutput.trim(),
      summary: summaryOutput.trim(),
      files
    }
  } catch {
    return null
  }
}

async function getFilesByIssue(issueNumber: string, repoPath: string): Promise<FileChangeInfo[]> {
  try {
    const revision = await findChangesetByIssue(issueNumber, repoPath)
    if (!revision) return []

    const statOutput = await runHgCommand(
      `status --change ${revision}`,
      repoPath
    )

    const lines = statOutput.trim().split('\n').filter(l => l.trim())
    return lines.map(line => {
      const status = line.substring(0, 1)
      const path = line.substring(2).trim()
      return { path, status, revision }
    })
  } catch {
    return []
  }
}

async function getFilesDiffByIssue(issueNumber: string, repoPath: string): Promise<string> {
  try {
    const revision = await findChangesetByIssue(issueNumber, repoPath)
    if (!revision) return ''
    return await runHgCommand(`diff -c ${revision}`, repoPath)
  } catch {
    return ''
  }
}

async function getAllFilesByIssue(issueNumber: string, repoPath: string): Promise<FileChangeInfo[]> {
  try {
    const revisions = await findAllChangesetsByIssue(issueNumber, repoPath)
    if (revisions.length === 0) return []

    const allFiles: FileChangeInfo[] = []
    
    for (const revision of revisions) {
      const statOutput = await runHgCommand(
        `status --change ${revision}`,
        repoPath
      )

      const lines = statOutput.trim().split('\n').filter(l => l.trim())
      const files = lines.map(line => {
        const status = line.substring(0, 1)
        const path = line.substring(2).trim()
        return { path, status, revision }
      })
      
      allFiles.push(...files)
    }

    // 按文件路径去重，保留最新的变更状态
    const fileMap = new Map<string, FileChangeInfo>()
    for (const file of allFiles) {
      const existing = fileMap.get(file.path)
      // 如果文件已存在，比较revision号，保留较大的（更新的）
      if (!existing || Number(file.revision) > Number(existing.revision)) {
        fileMap.set(file.path, file)
      }
    }
    
    return Array.from(fileMap.values())
  } catch {
    return []
  }
}

async function getAllIssueNumbers(repoPath: string): Promise<string[]> {
  try {
    const logOutput = await runHgCommand(
      'log --template "{desc}"',
      repoPath
    )

    const issuePattern = /(?:issue\s*\(?\s*(\d+)\s*\)?|#(\d+))/gi
    const issues = new Set<string>()
    let match

    while ((match = issuePattern.exec(logOutput)) !== null) {
      const issue = match[1] || match[2]
      if (issue) issues.add(issue)
    }

    return Array.from(issues).sort((a, b) => Number(a) - Number(b))
  } catch {
    return []
  }
}

export const hgService = {
  runHgCommand,
  getChangesetByIssue,
  getFilesByIssue,
  getAllFilesByIssue,
  getFilesDiffByIssue,
  getAllIssueNumbers
}
