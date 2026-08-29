import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MODEL = "claude-haiku-4-5-20251001";
const API_URL = "https://api.anthropic.com/v1/messages";

type ChatMessage = { role: "user" | "assistant"; content: string };

// ─── Tool definitions for Anthropic tool use ──────────────────────────────

const tools = [
  {
    name: "search_products",
    description: "Search products by keyword. Use when the customer mentions a product name, type of item, or general search term.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term to match against product names and descriptions" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_product_details",
    description: "Get full details for a specific product by name. Use when the customer asks about price, stock, specs, or availability of a particular product.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "The product name or part of it" },
      },
      required: ["name"],
    },
  },
  {
    name: "get_all_categories",
    description: "List all product categories with item counts. Use when the customer asks what products you sell, what categories exist, or wants to browse.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_products_by_category",
    description: "Get products in a specific category. Use when the customer wants to browse a category or asks what's in a category.",
    input_schema: {
      type: "object",
      properties: {
        category_slug: { type: "string", description: "The category slug (e.g. 'electronics', 'ceramics')" },
      },
      required: ["category_slug"],
    },
  },
  {
    name: "get_products_by_price_range",
    description: "Find products within a price range. Use when the customer mentions a budget, max price, or wants something cheap/affordable.",
    input_schema: {
      type: "object",
      properties: {
        min: { type: "number", description: "Minimum price in Rs. Default 0." },
        max: { type: "number", description: "Maximum price in Rs." },
      },
      required: ["max"],
    },
  },
  {
    name: "get_featured_products",
    description: "Get featured/trending products. Use when the customer asks for recommendations, popular items, or what's trending.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_bestsellers",
    description: "Get bestselling products. Use when the customer asks for bestsellers, most popular, or top-selling items.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_new_arrivals",
    description: "Get new arrival products. Use when the customer asks for new items, latest additions, or what's new.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_business_info",
    description: "Get business information: store name, phone, WhatsApp, email, address, hours, delivery, payment, return/exchange/warranty policies, social media. Use for ANY business-related question (hours, location, contact, delivery, returns, payment, etc).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_user_orders",
    description: "Get the logged-in customer's recent orders. Use when the customer asks about their order status or tracking. Requires authentication.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_order_by_number",
    description: "Look up an order by order number. Use when the customer provides an order number for tracking.",
    input_schema: {
      type: "object",
      properties: {
        order_number: { type: "string", description: "The order number to look up" },
        email: { type: "string", description: "Customer email for verification (optional)" },
      },
      required: ["order_number"],
    },
  },
];

// ─── Tool execution ────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, unknown>, userToken: string | null): Promise<string> {
  switch (name) {
    case "search_products": {
      const q = String(input.query ?? "");
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, stock, status, rating, review_count, is_new, is_bestseller, primary_image, category:categories(name)")
        .eq("status", "active")
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .order("is_featured", { ascending: false })
        .limit(8);
      if (error) return JSON.stringify({ error: "database_error" });
      if (!data || data.length === 0) return JSON.stringify({ results: [] });
      return JSON.stringify({ results: data });
    }

    case "get_product_details": {
      const n = String(input.name ?? "");
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, stock, status, description, rating, review_count, is_new, is_bestseller, is_featured, primary_image, material, dimensions, weight, origin, care_instructions, sku, category:categories(name, slug)")
        .ilike("name", `%${n}%`)
        .eq("status", "active")
        .limit(3);
      if (error) return JSON.stringify({ error: "database_error" });
      if (!data || data.length === 0) return JSON.stringify({ found: false });
      return JSON.stringify({ found: true, products: data });
    }

    case "get_all_categories": {
      const { data: cats, error } = await supabase
        .from("categories")
        .select("id, name, slug, description")
        .order("sort_order");
      if (error) return JSON.stringify({ error: "database_error" });
      if (!cats || cats.length === 0) return JSON.stringify({ categories: [] });

      const withCounts = await Promise.all(
        cats.map(async (c) => {
          const { count } = await supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("category_id", c.id)
            .eq("status", "active");
          return { id: c.id, name: c.name, slug: c.slug, description: c.description, product_count: count ?? 0 };
        }),
      );
      return JSON.stringify({ categories: withCounts });
    }

    case "get_products_by_category": {
      const slug = String(input.category_slug ?? "");
      const { data: cat } = await supabase
        .from("categories")
        .select("id, name")
        .eq("slug", slug)
        .maybeSingle();
      if (!cat) return JSON.stringify({ error: "category_not_found" });

      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, stock, rating, review_count, is_new, is_bestseller, primary_image")
        .eq("category_id", cat.id)
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .limit(10);
      if (error) return JSON.stringify({ error: "database_error" });
      return JSON.stringify({ category: cat.name, products: data ?? [] });
    }

    case "get_products_by_price_range": {
      const min = Number(input.min ?? 0);
      const max = Number(input.max ?? 999999);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, stock, rating, primary_image, category:categories(name)")
        .eq("status", "active")
        .gte("price", min)
        .lte("price", max)
        .order("price", { ascending: true })
        .limit(10);
      if (error) return JSON.stringify({ error: "database_error" });
      if (!data || data.length === 0) return JSON.stringify({ results: [] });
      return JSON.stringify({ results: data });
    }

    case "get_featured_products": {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, stock, rating, primary_image, category:categories(name)")
        .eq("status", "active")
        .eq("is_featured", true)
        .limit(5);
      if (error) return JSON.stringify({ error: "database_error" });
      return JSON.stringify({ products: data ?? [] });
    }

    case "get_bestsellers": {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, stock, rating, review_count, primary_image, category:categories(name)")
        .eq("status", "active")
        .eq("is_bestseller", true)
        .limit(5);
      if (error) return JSON.stringify({ error: "database_error" });
      return JSON.stringify({ products: data ?? [] });
    }

    case "get_new_arrivals": {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, original_price, stock, rating, primary_image, category:categories(name)")
        .eq("status", "active")
        .eq("is_new", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) return JSON.stringify({ error: "database_error" });
      return JSON.stringify({ products: data ?? [] });
    }

    case "get_business_info": {
      const { data, error } = await supabase
        .from("business_info")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) return JSON.stringify({ error: "database_error" });
      if (!data) return JSON.stringify({ found: false });
      return JSON.stringify(data);
    }

    case "get_user_orders": {
      if (!userToken) return JSON.stringify({ auth_required: true });
      const { data: { user } } = await supabase.auth.getUser(userToken);
      if (!user) return JSON.stringify({ auth_required: true });

      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, subtotal, shipping, discount, payment_method, payment_status, created_at, items:order_items(id, name, quantity, price, image_url)")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) return JSON.stringify({ error: "database_error" });
      return JSON.stringify({ orders: data ?? [] });
    }

    case "get_order_by_number": {
      const orderNum = String(input.order_number ?? "");
      const email = input.email ? String(input.email) : undefined;

      let query = supabase
        .from("orders")
        .select("id, order_number, status, total, subtotal, shipping, discount, payment_method, payment_status, created_at, shipping_name, shipping_email, shipping_address, shipping_city, items:order_items(id, name, quantity, price, image_url)")
        .ilike("order_number", `%${orderNum}%`);

      if (email) query = query.ilike("shipping_email", `%${email}%`);

      const { data, error } = await query.limit(1).maybeSingle();
      if (error) return JSON.stringify({ error: "database_error" });
      if (!data) return JSON.stringify({ found: false });
      return JSON.stringify({ found: true, order: data });
    }

    default:
      return JSON.stringify({ error: "unknown_tool" });
  }
}

// ─── System prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the AI customer-support assistant for 929store, an e-commerce store.

## Personality
Friendly, professional, helpful, natural, and concise. You sound like a real human support representative, not a bot.

## CRITICAL RULE: KEEP ANSWERS SHORT
Default response length: 1–3 short sentences. Be direct and clear.
- Do NOT write long paragraphs.
- Do NOT explain unnecessary details.
- Do NOT repeat information.
- Do NOT use filler like "Thank you for your interest" or "I'd be happy to help."
- Only give longer answers if the customer explicitly asks for more detail.

## Answer Style
- Answer the question directly in the fewest words necessary while still being useful.
- Be confident when you know the answer.
- Be honest when you don't have the information.
- Use natural, conversational language.
- Understand casual language, typos, and incomplete sentences.
- Remember the conversation context and ask useful follow-up questions.
- Give recommendations when asked.

## Formatting
- Prices: "Rs. X,XXX" (e.g., "Rs. 2,499").
- When listing multiple products, use bullet points (•) with name and price.
- Keep product lists short — show max 5 items.

## Data Integrity
- NEVER invent prices, stock, products, discounts, or any data.
- Use ONLY the tool results to answer product/order questions.
- If a tool returns no results, say you couldn't find it. Don't guess.
- If business info contains placeholder text like "[ADD ...]", tell the customer that information isn't available yet and suggest contacting the store directly.
- For order questions, only show the customer's own orders.

## Forbidden Phrases
Never say: "As an AI language model", "I am programmed to", "I cannot assist with that" (unless truly inappropriate).

## Business Info
The store name is 929store. Phone and WhatsApp: +92 320 9074644. All other business details should come from the get_business_info tool — do not make them up.

## Tools
You have tools to search products, get product details, list categories, check price ranges, get featured/bestseller/new products, get business info, and look up orders. USE TOOLS whenever the customer asks about products, prices, stock, categories, business info, or orders. Do not answer factual questions from memory — always check the database first.`;

// ─── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, history = [], userToken = null } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ reply: "Sorry, I'm having trouble right now. Please try again in a moment." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build conversation messages (last 10 for context)
    const messages: ChatMessage[] = [
      ...history.slice(-10).map((m: ChatMessage) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // First API call — let Claude decide which tools to use
    let response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return new Response(
        JSON.stringify({ reply: "Sorry, I'm having trouble right now. Please try again in a moment." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let result = await response.json();

    // Tool use loop — handle up to 3 rounds of tool calls
    let toolRounds = 0;
    while (result.stop_reason === "tool_use" && toolRounds < 3) {
      toolRounds++;

      // Add assistant's response (with tool_use blocks) to conversation
      messages.push({
        role: "assistant",
        content: result.content,
      });

      // Execute each tool call and build tool results
      const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = [];
      for (const block of result.content) {
        if (block.type === "tool_use") {
          const toolResult = await executeTool(block.name, block.input, userToken);
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: toolResult,
          });
        }
      }

      // Add tool results to conversation
      messages.push({
        role: "user",
        content: toolResults as unknown as string,
      });

      // Next API call with tool results
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          tools,
          messages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Anthropic API error (tool round):", response.status, errText);
        return new Response(
          JSON.stringify({ reply: "Sorry, I'm having trouble right now. Please try again in a moment." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      result = await response.json();
    }

    // Extract final text response
    let reply = "";
    if (result.content && Array.isArray(result.content)) {
      for (const block of result.content) {
        if (block.type === "text") {
          reply += block.text;
        }
      }
    }

    if (!reply) {
      reply = "Sorry, I didn't catch that. Could you rephrase?";
    }

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Chatbot error:", err);
    return new Response(
      JSON.stringify({ reply: "Sorry, I'm having trouble right now. Please try again in a moment." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
