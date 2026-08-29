/*
# Create business_info table for chatbot integration

## Purpose
Stores centralized business information that the AI chatbot uses to answer
customer questions about policies, contact details, delivery, and more.
A single-row configuration table — the chatbot edge function reads from this.

## New Tables
- `business_info` (single configuration row)
  - `id` — always 1, enforced by default + CHECK constraint
  - `business_name` — store name
  - `phone` — contact phone
  - `whatsapp` — WhatsApp number
  - `email` — contact email
  - `website` — website URL
  - `address` — physical address
  - `opening_hours` — general opening hours
  - `support_hours` — customer support hours
  - `delivery_time` — estimated delivery time
  - `delivery_areas` — areas served
  - `delivery_fee` — delivery cost
  - `payment_methods` — accepted payment methods
  - `return_policy` — return policy text
  - `exchange_policy` — exchange policy text
  - `warranty` — warranty information
  - `social_facebook`, `social_instagram`, `social_twitter`, `social_youtube` — social links
  - `about` — short business description
  - `updated_at` — last modification timestamp

## Security
- RLS enabled.
- SELECT open to anon + authenticated (chatbot edge function reads via service role, but public reads are safe for business info).
- UPDATE restricted to authenticated admins only (via profiles role check).

## Data
- Inserts a single placeholder row with id=1 containing fill-in-the-blank values.
  The store owner replaces these with real business details later.
*/

CREATE TABLE IF NOT EXISTS business_info (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_name text NOT NULL DEFAULT 'Maison',
  phone text,
  whatsapp text,
  email text,
  website text,
  address text,
  opening_hours text,
  support_hours text,
  delivery_time text,
  delivery_areas text,
  delivery_fee text,
  payment_methods text,
  return_policy text,
  exchange_policy text,
  warranty text,
  social_facebook text,
  social_instagram text,
  social_twitter text,
  social_youtube text,
  about text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;

-- Public can read business info (it's non-sensitive, displayed on the site)
DROP POLICY IF EXISTS "anon_read_business_info" ON business_info;
CREATE POLICY "anon_read_business_info"
ON business_info FOR SELECT
TO anon, authenticated USING (true);

-- Only admins can update business info
DROP POLICY IF EXISTS "admin_update_business_info" ON business_info;
CREATE POLICY "admin_update_business_info"
ON business_info FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Only admins can insert (in case the row doesn't exist yet)
DROP POLICY IF EXISTS "admin_insert_business_info" ON business_info;
CREATE POLICY "admin_insert_business_info"
ON business_info FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Insert placeholder row if it doesn't exist
INSERT INTO business_info (id, business_name, phone, whatsapp, email, website, address, opening_hours, support_hours, delivery_time, delivery_areas, delivery_fee, payment_methods, return_policy, exchange_policy, warranty, social_facebook, social_instagram, social_twitter, social_youtube, about)
SELECT 1, 'Maison', '[ADD PHONE NUMBER]', '[ADD WHATSAPP NUMBER]', '[ADD EMAIL]', '[ADD WEBSITE URL]', '[ADD BUSINESS ADDRESS]', '[ADD OPENING HOURS]', '[ADD SUPPORT HOURS]', '[ADD DELIVERY TIME]', '[ADD DELIVERY AREAS]', '[ADD DELIVERY FEE]', '[ADD PAYMENT METHODS]', '[ADD RETURN POLICY]', '[ADD EXCHANGE POLICY]', '[ADD WARRANTY INFORMATION]', '[ADD FACEBOOK URL]', '[ADD INSTAGRAM URL]', '[ADD TWITTER URL]', '[ADD YOUTUBE URL]', '[ADD SHORT BUSINESS DESCRIPTION]'
WHERE NOT EXISTS (SELECT 1 FROM business_info WHERE id = 1);
