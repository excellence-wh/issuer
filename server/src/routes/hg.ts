import { Hono } from 'hono'
import { hgService } from '../services/hg.js'

const hgRouter = new Hono()

hgRouter.get('/changeset', async (c) => {
  const issueNumber = c.req.query('issue')
  const repoPath = c.req.query('repoPath')

  if (!issueNumber || !repoPath) {
    return c.json({ success: false, error: 'Missing issue or repoPath parameter' }, 400)
  }

  const changeset = await hgService.getChangesetByIssue(issueNumber, repoPath)

  if (!changeset) {
    return c.json({ success: false, error: 'Changeset not found' }, 404)
  }

  return c.json({ success: true, data: changeset })
})

hgRouter.get('/files', async (c) => {
  const issueNumber = c.req.query('issue')
  const repoPath = c.req.query('repoPath')

  if (!issueNumber || !repoPath) {
    return c.json({ success: false, error: 'Missing issue or repoPath parameter' }, 400)
  }

  const files = await hgService.getFilesByIssue(issueNumber, repoPath)
  return c.json({ success: true, data: files })
})

hgRouter.get('/diff', async (c) => {
  const issueNumber = c.req.query('issue')
  const repoPath = c.req.query('repoPath')

  if (!issueNumber || !repoPath) {
    return c.json({ success: false, error: 'Missing issue or repoPath parameter' }, 400)
  }

  const diff = await hgService.getFilesDiffByIssue(issueNumber, repoPath)
  return c.json({ success: true, data: { diff } })
})

hgRouter.get('/issues', async (c) => {
  const repoPath = c.req.query('repoPath')

  if (!repoPath) {
    return c.json({ success: false, error: 'Missing repoPath parameter' }, 400)
  }

  const issues = await hgService.getAllIssueNumbers(repoPath)
  return c.json({ success: true, data: { issues } })
})

export { hgRouter }
