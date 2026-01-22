import { Hono } from 'hono'
import { mimoService } from '../services/mimo.js'

const mimoRouter = new Hono()

mimoRouter.post('/generate-modification', async (c) => {
  const body = await c.req.json()
  const { files, description } = body

  if (!files || !Array.isArray(files)) {
    return c.json({ success: false, error: 'Missing files parameter' }, 400)
  }

  try {
    const modification = await mimoService.generateModificationFromHg(files, description || '')
    return c.json({ success: true, data: { modification } })
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500)
  }
})

export { mimoRouter }
