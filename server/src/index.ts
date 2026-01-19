import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { apiRouter } from './routes/index.js'

const app = new Hono()

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/api', apiRouter)

export default app
