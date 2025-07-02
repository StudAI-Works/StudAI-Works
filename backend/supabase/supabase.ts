import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cwqsmzvreseojdamgpuv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cXNtenZyZXNlb2pkYW1ncHV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM0ODY1NiwiZXhwIjoyMDY2OTI0NjU2fQ.epq_LWoyr9vTxUCnqQANZo5xrrXrxYiPxOwcVG81HtU'
)

export default supabase
