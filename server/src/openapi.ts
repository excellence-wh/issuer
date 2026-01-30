export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Excellence Issuer API',
    version: '1.0.0',
    description: 'API for Excellence Issuer Server - Redmine integration, Mercurial code review, and MiMo LLM integration',
    contact: {
      name: 'API Support',
      email: 'cheng_zhuo@star-quest.com'
    }
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Development server' },
    { url: 'http://10.0.0.19:3001', description: 'Production server' }
  ],
  tags: [
    { name: 'Redmine', description: 'Redmine issue integration' },
    { name: 'Mercurial', description: 'Mercurial code review' },
    { name: 'MiMo', description: 'MiMo LLM integration' }
  ],
  paths: {
    '/api/redmine/projects': {
      get: {
        tags: ['Redmine'],
        summary: 'Get all Redmine projects',
        description: 'Retrieve a list of all available Redmine projects',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } } } } } } } },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/redmine/weekly-issues': {
      get: {
        tags: ['Redmine'],
        summary: 'Get weekly issues',
        description: 'Retrieve issues where PIC matches user ID and resolved within the specified date range',
        parameters: [
          { name: 'projectId', in: 'query', required: true, schema: { type: 'string' }, description: 'Redmine project ID' },
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' }, description: 'Start date (YYYY-MM-DD)' },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' }, description: 'End date (YYYY-MM-DD)' },
          { name: 'userId', in: 'query', required: true, schema: { type: 'integer' }, description: 'Redmine user ID for PIC field' }
        ],
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Missing required parameters' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/redmine/issues': {
      get: {
        tags: ['Redmine'],
        summary: 'Get issues by PIC and year',
        description: 'Retrieve issues where PIC matches user ID, filtered by creation year',
        parameters: [
          { name: 'year', in: 'query', required: false, schema: { type: 'integer' }, description: 'Year to filter (default: current year)' },
          { name: 'userId', in: 'query', required: true, schema: { type: 'integer' }, description: 'Redmine user ID for PIC field' }
        ],
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Invalid parameters' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/redmine/issues/count': {
      get: {
        tags: ['Redmine'],
        summary: 'Get issue count by PIC and year',
        description: 'Count issues where PIC matches user ID, filtered by creation year',
        parameters: [
          { name: 'year', in: 'query', required: false, schema: { type: 'integer' }, description: 'Year to filter (default: current year)' },
          { name: 'userId', in: 'query', required: true, schema: { type: 'integer' }, description: 'Redmine user ID for PIC field' }
        ],
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Invalid parameters' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/hg/changeset': {
      get: {
        tags: ['Mercurial'],
        summary: 'Get changeset by issue',
        description: 'Retrieve Mercurial changeset information for a specific issue number',
        parameters: [
          { name: 'issue', in: 'query', required: true, schema: { type: 'string' }, description: 'Redmine issue number' },
          { name: 'repoPath', in: 'query', required: true, schema: { type: 'string' }, description: 'Path to Mercurial repository' }
        ],
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Missing required parameters' },
          '404': { description: 'Changeset not found' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/hg/files': {
      get: {
        tags: ['Mercurial'],
        summary: 'Get files by issue',
        description: 'Retrieve list of files changed in a specific issue. Use allHistory=true to get all historical file changes for this issue.',
        parameters: [
          { name: 'issue', in: 'query', required: true, schema: { type: 'string' }, description: 'Redmine issue number' },
          { name: 'repoPath', in: 'query', required: true, schema: { type: 'string' }, description: 'Path to Mercurial repository' },
          { name: 'allHistory', in: 'query', required: false, schema: { type: 'boolean', default: false }, description: 'Get all historical file changes for this issue (true) or only latest commit (false)' }
        ],
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Missing required parameters' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/hg/diff': {
      get: {
        tags: ['Mercurial'],
        summary: 'Get diff by issue',
        description: 'Retrieve diff/changes for a specific issue',
        parameters: [
          { name: 'issue', in: 'query', required: true, schema: { type: 'string' }, description: 'Redmine issue number' },
          { name: 'repoPath', in: 'query', required: true, schema: { type: 'string' }, description: 'Path to Mercurial repository' }
        ],
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Missing required parameters' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/hg/issues': {
      get: {
        tags: ['Mercurial'],
        summary: 'Get all issues from repository',
        description: 'Retrieve all Redmine issue numbers mentioned in Mercurial commit messages',
        parameters: [
          { name: 'repoPath', in: 'query', required: true, schema: { type: 'string' }, description: 'Path to Mercurial repository' }
        ],
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Missing repoPath parameter' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/mimo/generate-modification': {
      post: {
        tags: ['MiMo'],
        summary: 'Generate modification request',
        description: 'Generate modification request using MiMo LLM based on Mercurial files and description',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['files'],
                properties: {
                  files: {
                    type: 'array',
                    items: { type: 'object' },
                    description: 'Array of file objects from Mercurial'
                  },
                  description: {
                    type: 'string',
                    description: 'Description or prompt for the modification'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Success' },
          '400': { description: 'Missing files parameter' },
          '500': { description: 'Server error' }
        }
      }
    }
  }
}
