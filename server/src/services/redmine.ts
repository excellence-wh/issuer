const REDMINE_BASE_URL = 'http://10.0.0.19/redmine'
const REDMINE_USER = 'cheng_zhuo'
const REDMINE_PASSWORD = 'Rde@0224'

interface RedmineIssue {
  id: number
  subject: string
  tracker: { id: number; name: string }
  status: { id: number; name: string }
  priority: { id: number; name: string }
  author: { id: number; name: string }
  assigned_to?: { id: number; name: string }
  start_date: string
  due_date?: string
  created_on: string
  updated_on: string
  closed_on?: string
  estimated_hours?: number
  custom_fields: { id: number; name: string; value: string }[]
}

interface RedmineResponse {
  issues: RedmineIssue[]
  total_count: number
  offset: number
  limit: number
}

export const redmineService = {
  async getIssues(params: {
    projectId?: string
    statusId?: string
    userId?: number
    limit?: number
    offset?: number
  }): Promise<RedmineIssue[]> {
    const allIssues: RedmineIssue[] = []
    let offset = params.offset || 0
    const limit = params.limit || 100

    while (true) {
      const queryParams = new URLSearchParams()
      if (params.projectId) queryParams.set('project_id', params.projectId)
      if (params.statusId && params.statusId !== '*') queryParams.set('status_id', params.statusId)
      if (params.userId) queryParams.set('cf_29', String(params.userId))
      queryParams.set('limit', String(limit))
      queryParams.set('offset', String(offset))

      const url = `${REDMINE_BASE_URL}/issues.json?${queryParams.toString()}`

      const response = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${REDMINE_USER}:${REDMINE_PASSWORD}`),
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) {
        throw new Error(`Redmine API error: ${response.status}`)
      }

      const data: RedmineResponse = await response.json()
      allIssues.push(...data.issues)

      if (data.issues.length === 0 || allIssues.length >= data.total_count) {
        break
      }

      offset += limit
    }

    return allIssues
  },

  async getAllIssuesByProject(projectId: string, userId: number): Promise<RedmineIssue[]> {
    const allIssues: RedmineIssue[] = []
    let offset = 0
    const limit = 100

    while (true) {
      const queryParams = new URLSearchParams()
      queryParams.set('project_id', projectId)
      queryParams.set('status_id', '*')
      queryParams.set('cf_29', String(userId))
      queryParams.set('limit', String(limit))
      queryParams.set('offset', String(offset))

      const url = `${REDMINE_BASE_URL}/issues.json?${queryParams.toString()}`

      const response = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${REDMINE_USER}:${REDMINE_PASSWORD}`),
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) {
        throw new Error(`Redmine API error: ${response.status}`)
      }

      const data: RedmineResponse = await response.json()
      allIssues.push(...data.issues)

      if (data.issues.length === 0 || allIssues.length >= data.total_count) {
        break
      }

      offset += limit
    }

    return allIssues
  },

  async getProjects(): Promise<{ id: string; name: string }[]> {
    const response = await fetch(`${REDMINE_BASE_URL}/projects.json?limit=100`, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${REDMINE_USER}:${REDMINE_PASSWORD}`),
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Redmine API error: ${response.status}`)
    }

    const data = await response.json()
    return data.projects.map((p: any) => ({ id: String(p.id), name: p.name }))
  },

  async getIssuesByPICAndYear(userId: number, year: number): Promise<{ count: number; issues: RedmineIssue[] }> {
    const allIssues: RedmineIssue[] = []
    let offset = 0
    const limit = 100
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    while (true) {
      const url = `${REDMINE_BASE_URL}/issues.json?cf_29=${userId}&created_on=%3E%3D${startDate}&created_on=%3C%3D${endDate}&limit=${limit}&offset=${offset}`

      const response = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${REDMINE_USER}:${REDMINE_PASSWORD}`),
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Redmine API error: ${response.status} - ${error}`)
      }

      const data: RedmineResponse = await response.json()
      allIssues.push(...data.issues)

      if (allIssues.length >= data.total_count) {
        break
      }

      offset += limit
    }

    return { count: allIssues.length, issues: allIssues }
  }
}
