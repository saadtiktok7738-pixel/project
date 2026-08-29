/*
# Update business_info for 929store

1. Updates the existing business_info row (id=1) with the store name "929store"
   and the phone/WhatsApp number provided by the owner.
2. All other fields remain as [ADD ...] placeholders until the owner provides them.
3. No schema changes — all columns already exist from migration 002.
*/

UPDATE business_info SET
  business_name = '929store',
  phone = '+92 320 9074644',
  whatsapp = '+92 320 9074644',
  updated_at = now()
WHERE id = 1;
