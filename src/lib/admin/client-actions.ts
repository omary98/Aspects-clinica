export async function adminManage<TPayload extends Record<string, unknown>>(body: {
  resource: string
  action: string
  id?: string
  payload?: TPayload
  values?: Record<string, string>
}) {
  const response = await fetch('/api/admin/manage', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const result = await response.json() as { error?: string }

  if (!response.ok) {
    throw new Error(result.error || 'Could not save changes.')
  }

  return result
}

export async function uploadAdminImage(file: File, area: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('area', area)

  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  const result = await response.json() as { error?: string; url?: string }

  if (!response.ok || !result.url) {
    throw new Error(result.error || 'Could not upload image.')
  }

  return result.url
}
