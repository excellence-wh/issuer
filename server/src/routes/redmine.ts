import { Hono } from 'hono'
import { redmineService } from '../services/redmine.js'

const redmineRouter = new Hono()

redmineRouter.get('/projects', async (c) => {
  try {
    const projects = await redmineService.getProjects()
    return c.json({ success: true, data: projects })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

redmineRouter.get('/weekly-issues', async (c) => {
  const projectId = c.req.query('projectId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')

  if (!projectId) {
    return c.json({ success: false, error: 'Missing projectId parameter' }, 400)
  }

  try {
    const userId = 654
    const allIssues = await redmineService.getAllIssuesByProject(projectId, userId)

    const issuesInPeriod = allIssues.filter(i => {
      const resolvedDate = i.custom_fields.find(f => f.id === 30)?.value || i.closed_on || ''
      if (!resolvedDate) return false
      return resolvedDate >= startDate && resolvedDate <= endDate
    })

    return c.json({
      success: true,
      data: issuesInPeriod.map(i => ({
        id: i.id,
        subject: i.subject,
        tracker: i.tracker?.name || '',
        priority: i.priority?.name || '',
        estimated_hours: i.estimated_hours || 0,
        assigned_to: i.assigned_to?.name || '',
        start_date: i.start_date || '',
        due_date: i.due_date || '',
        created_on: i.created_on,
        resolved_date: i.custom_fields.find(f => f.id === 30)?.value || i.closed_on || '',
        project_id: projectId
      }))
    })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

redmineRouter.get('/issues/count', async (c) => {
  const year = parseInt(c.req.query('year') || new Date().getFullYear().toString())
  const userId = c.req.query('userId')

  if (isNaN(year) || year < 2000 || year > 2100) {
    return c.json({ success: false, error: 'Invalid year parameter' }, 400)
  }

  if (!userId) {
    return c.json({ success: false, error: 'Missing userId parameter' }, 400)
  }

  try {
    const result = await redmineService.getIssuesByPICAndYear(parseInt(userId), year)
    return c.json({ success: true, data: { year, userId: parseInt(userId), count: result.count } })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

redmineRouter.get('/issues', async (c) => {
  const year = parseInt(c.req.query('year') || new Date().getFullYear().toString())
  const userId = c.req.query('userId')

  if (isNaN(year) || year < 2000 || year > 2100) {
    return c.json({ success: false, error: 'Invalid year parameter' }, 400)
  }

  if (!userId) {
    return c.json({ success: false, error: 'Missing userId parameter' }, 400)
  }

  try {
    const result = await redmineService.getIssuesByPICAndYear(parseInt(userId), year)
    return c.json({
      success: true,
      data: {
        year,
        userId: parseInt(userId),
        count: result.count,
        issues: result.issues.map(i => ({
          id: i.id,
          subject: i.subject,
          status: i.status.name,
          created_on: i.created_on,
          closed_on: i.closed_on
        }))
      }
    })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

export { redmineRouter }
