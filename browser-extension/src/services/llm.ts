export const llmService = {
  async generateModificationFromHg(
    files: { path: string; status: string; diff?: string }[],
    description: string
  ): Promise<string> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

    const response = await fetch(`${baseUrl}/api/mimo/generate-modification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: files.map(f => ({ path: f.path, status: f.status })),
        description,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate modification')
    }

    return data.data.modification
  },
}
