import { Hono } from 'hono'
import { hgRouter } from './hg.js'

const apiRouter = new Hono()
apiRouter.route('/hg', hgRouter)

export { apiRouter }

