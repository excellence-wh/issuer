import { serve } from '@hono/node-server'
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { openapi } from './openapi.js'
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

app.get('/docs', Scalar({
  spec: {
    content: openapi
  },
  configuration: {
    theme: 'saturn',
    defaultHttpClient: {
      type: 'fetch'
    },
    metaData: {
      title: 'Excellence Issuer API',
      description: 'API documentation for Excellence Issuer Server'
    }
  }
}))

const port = 3001
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
