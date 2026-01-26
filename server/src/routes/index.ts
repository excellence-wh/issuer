import { Hono } from 'hono'
import { hgRouter } from './hg.js'
import { redmineRouter } from './redmine.js'
import { mimoRouter } from './mimo.js'

const apiRouter = new Hono()
apiRouter.route('/hg', hgRouter)
apiRouter.route('/redmine', redmineRouter)
apiRouter.route('/mimo', mimoRouter)

export { apiRouter }

