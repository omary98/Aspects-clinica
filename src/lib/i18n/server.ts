import { cookies } from 'next/headers'
import type { Lang } from './index'
import { DEFAULT_LANG, LANG_COOKIE } from './index'

export async function getLang(): Promise<Lang> {
  const store = await cookies()
  const val = store.get(LANG_COOKIE)?.value
  return val === 'en' ? 'en' : DEFAULT_LANG
}
