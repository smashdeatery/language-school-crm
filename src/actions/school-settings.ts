'use server'

import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface SchoolSettings {
  school_name: string
  school_address: string
  school_email: string
  school_phone: string
  bank_name: string
  iban: string
  bic: string
  tax_number: string
}

const DEFAULTS: SchoolSettings = {
  school_name: '',
  school_address: '',
  school_email: '',
  school_phone: '',
  bank_name: '',
  iban: '',
  bic: '',
  tax_number: '',
}

export async function getSchoolSettings(): Promise<SchoolSettings> {
  const { data, error } = await serviceClient()
    .from('school_settings')
    .select('key, value')
  if (error || !data) return DEFAULTS
  const settings = { ...DEFAULTS }
  data.forEach(({ key, value }: { key: string; value: string }) => {
    if (key in settings) (settings as Record<string, string>)[key] = value ?? ''
  })
  return settings
}

export async function setSchoolSetting(key: string, value: string): Promise<void> {
  await serviceClient()
    .from('school_settings')
    .upsert({ key, value })
}
