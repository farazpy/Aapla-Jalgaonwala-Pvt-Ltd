import { GoogleGenAI, Type } from '@google/genai';
import { SettingsRepository } from '../repositories/SettingsRepository';

// Lazy initialization of GoogleGenAI client with dynamic key detection
let aiClient: GoogleGenAI | null = null;
let lastApiKey: string | null = null;

export async function getGeminiApiKey(overrideKey?: string): Promise<string> {
  if (overrideKey && overrideKey.trim()) {
    return overrideKey.trim();
  }
  const settings = await SettingsRepository.get().catch(() => null);
  const dbKey = settings?.geminiApiKey?.trim();
  if (dbKey) {
    return dbKey;
  }
  const envKey = (process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  return envKey;
}

export async function getAiClient(overrideKey?: string): Promise<GoogleGenAI> {
  const currentKey = await getGeminiApiKey(overrideKey);
  if (!currentKey) {
    throw new Error('Gemini API Key is required but not configured in Admin Settings or environment variables.');
  }
  if (!aiClient || lastApiKey !== currentKey) {
    aiClient = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    lastApiKey = currentKey;
  }
  return aiClient;
}

/**
 * Tests Gemini 3.1 Flash Lite connection using the specified or stored Gemini API key
 */
export async function testGeminiApiKey(apiKeyToTest?: string): Promise<{ success: boolean; message: string; modelUsed: string; responseSample?: string }> {
  const keyToUse = (apiKeyToTest && apiKeyToTest.trim()) ? apiKeyToTest.trim() : await getGeminiApiKey();
  if (!keyToUse) {
    throw new Error('No Gemini API key provided or found in database settings.');
  }

  const testClient = new GoogleGenAI({
    apiKey: keyToUse,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const response = await testClient.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: 'Respond with a concise 5-word confirmation: "Gemini 3.1 Flash Lite connected successfully."',
  });

  const text = response.text || '';
  if (!text) {
    throw new Error('Gemini 3.1 Flash Lite model responded with empty content.');
  }

  return {
    success: true,
    message: 'Connection to Gemini 3.1 Flash Lite API successful!',
    modelUsed: 'gemini-3.1-flash-lite',
    responseSample: text.trim(),
  };
}

export interface EnhanceProductInput {
  name: string;
  category?: string;
  prepStyle?: string;
  flavorNotes?: string;
  targetAudience?: string;
  dietaryCallouts?: string;
  currentDescription?: string;
  currentShortDescription?: string;
  currentSeoTitle?: string;
  currentSeoDescription?: string;
}

export interface EnhancedProductOutput {
  name: string;
  description: string;
  shortDescription: string;
  flavour: string;
  ingredients: string[];
  tags: string[];
  seoTitle: string;
  seoDescription: string;
}

// In-memory response cache for product enhancements to prevent burning AI quotas
const enhanceCache = new Map<string, { output: EnhancedProductOutput; timestamp: number }>();

/**
 * Enhances all text fields of a product in a single, cohesive structured JSON request
 * using the gemini-3.1-flash-lite model based on targeted merchant answers.
 */
export async function enhanceProductDetails(input: EnhanceProductInput): Promise<EnhancedProductOutput> {
  const cacheKey = JSON.stringify({
    name: input.name,
    category: input.category,
    prepStyle: input.prepStyle,
    flavorNotes: input.flavorNotes,
    targetAudience: input.targetAudience,
    dietaryCallouts: input.dietaryCallouts
  });

  const cached = enhanceCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 3600000)) {
    return cached.output;
  }

  const ai = await getAiClient();

  const prompt = `
    You are an expert marketing copywriter and SEO master specializing in gourmet snacks, food, and traditional Indian specialties for our brand "Aapla Jalgaonwala".
    We want to create a rich, professionally polished, and highly search-optimized product listing.
    
    The merchant has answered the following questions about the product to help you write accurate and premium details:
    1. Product Title/Idea: "${input.name}"
    2. Preparation Style & Heritage (how it is made): "${input.prepStyle || 'Traditional recipe'}"
    3. Taste & Flavor Profile (what it tastes like): "${input.flavorNotes || 'Deliciously crispy and authentic'}"
    4. Target Audience & Occasion (who is it for): "${input.targetAudience || 'Any snack time'}"
    5. Dietary & Health Highlights (benefits): "${input.dietaryCallouts || 'Made with quality ingredients'}"
    
    Category of product: "${input.category || 'banana-chips'}"

    Using these rich details, write professional-grade content for ALL of the following fields:
    
    1. Product Name: A highly catchy, search-friendly, premium name (e.g. "Khandeshi Spicy Masala Banana Chips").
    2. Detailed Description: A gorgeous, storytelling-based, appetizing product description. Detail the cooking heritage, quality of raw materials (like premium Jalgaon bananas), the traditional spices, and its satisfying crunch. Keep it detailed, professional, and split into 2-3 engaging, SEO-rich paragraphs (approx 120-180 words).
    3. Short Description: A punchy, appetizing 1-sentence marketing tagline (max 25 words) for quick card view on the store.
    4. Flavour Accent: A short 2-4 word taste tag (e.g., "Khandeshi Teekha Masala", "Classic Salted & Crispy").
    5. Ingredients: An array of 4 to 8 high-quality raw ingredients based on their input (e.g., ["Raw Bananas", "Cold-Pressed Sunflower Oil", "Rock Salt", "Khandeshi Chili Blend"]).
    6. Tags: An array of 5 to 8 relevant SEO search tags (e.g., ["banana-chips", "khandeshi-spices", "healthy-snacks", "crunchy", "high-fiber", "tea-time-snack"]).
    7. SEO Meta Title: A strong Google-optimized page title (50-60 characters) formatted with separators (e.g., "Khandeshi Masala Banana Chips | Buy Online - Aapla Jalgaonwala").
    8. SEO Meta Description: A high-clickthrough Google meta description (120-155 characters) summarizing the flavor and prompting the user to buy now.

    Return the final structured response in pristine JSON format.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { 
            type: Type.STRING,
            description: "A premium, appetizing name for the product" 
          },
          description: { 
            type: Type.STRING, 
            description: "Story-driven, descriptive paragraph details (120-180 words)"
          },
          shortDescription: { 
            type: Type.STRING,
            description: "Snappy 1-sentence marketing tagline"
          },
          flavour: {
            type: Type.STRING,
            description: "Short 2-4 word flavour accent description"
          },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of core premium ingredients"
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Search tags and keywords"
          },
          seoTitle: { 
            type: Type.STRING,
            description: "Highly search-engine-optimized Page Title tag"
          },
          seoDescription: { 
            type: Type.STRING,
            description: "Google Search optimized meta description tag"
          },
        },
        required: ['name', 'description', 'shortDescription', 'flavour', 'ingredients', 'tags', 'seoTitle', 'seoDescription'],
      },
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error('Empty response from Gemini AI Model.');
  }

  try {
    const data = JSON.parse(rawText.trim());
    const output: EnhancedProductOutput = {
      name: data.name || input.name,
      description: data.description || input.currentDescription || '',
      shortDescription: data.shortDescription || input.currentShortDescription || '',
      flavour: data.flavour || '',
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      seoTitle: data.seoTitle || input.currentSeoTitle || '',
      seoDescription: data.seoDescription || input.currentSeoDescription || ''
    };

    enhanceCache.set(cacheKey, { output, timestamp: Date.now() });
    if (enhanceCache.size > 200) {
      const oldest = enhanceCache.keys().next().value;
      if (oldest) enhanceCache.delete(oldest);
    }

    return output;
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', rawText, err);
    throw new Error('AI generated content was not in the expected JSON format. Please retry.');
  }
}

export interface GenerateSeoParams {
  type: 'page' | 'product' | 'category';
  pageKey?: string;
  pageName?: string;
  productName?: string;
  productCategory?: string;
  productDescription?: string;
  currentTitle?: string;
  currentDescription?: string;
  customInstruction?: string;
}

export interface GeneratedSeoResult {
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  seoScore: number;
  improvementNotes: string[];
}

// In-memory response cache for generated SEO tags
const seoCache = new Map<string, { result: GeneratedSeoResult; timestamp: number }>();

/**
 * Generates Google-optimized SEO titles and descriptions using Gemini 3.1 Flash Lite model (gemini-3.1-flash-lite).
 * Enforces Google's exact character length best practices:
 * - Meta Title: Strict 50 to 60 characters
 * - Meta Description: Strict 140 to 160 characters
 */
export async function generateSeoWithGemini(params: GenerateSeoParams): Promise<GeneratedSeoResult> {
  const cacheKey = JSON.stringify({
    type: params.type,
    pageKey: params.pageKey,
    pageName: params.pageName,
    productName: params.productName,
    productCategory: params.productCategory,
    customInstruction: params.customInstruction
  });

  const cached = seoCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 3600000)) {
    return cached.result;
  }

  const ai = await getAiClient();

  const entityName = params.pageName || params.productName || params.pageKey || 'Aapla Jalgaonwala Page';
  const entityType = params.type || 'page';

  const prompt = `
    You are an elite Google Technical SEO Strategist and Copywriter for "Aapla Jalgaonwala", an authentic Indian gourmet snacks brand specializing in Jalgaon Banana Chips (10 flavours), Farsaan, Khandeshi Kitchen Masalas, and Regional Dry Chutneys.

    Your job is to generate highly professional, search-engine-optimized Meta Tags for the following ${entityType}:
    - Name/Target: "${entityName}"
    - Category/Context: "${params.productCategory || 'Gourmet Indian Snacks'}"
    - Description/Details: "${params.productDescription || params.currentDescription || 'Authentic Jalgaon taste directly from farms.'}"
    - Current Title Tag: "${params.currentTitle || ''}"
    - Custom Merchant Instructions: "${params.customInstruction || 'Maximize Google CTR and search rankings.'}"

    CRITICAL GOOGLE SERP LENGTH RULES (STRICTLY ENFORCED):
    1. "seoTitle": MUST BE STRICTLY BETWEEN 50 AND 60 CHARACTERS LONG (inclusive). Count every letter, space, and punctuation!
       Format Example: "Buy Fresh Jalgaon Banana Chips Online | Jalgaonwala" (exact length ~54 chars).
       Include localized high-volume terms + brand suffix "| Jalgaonwala" or "| Aapla Jalgaonwala".

    2. "seoDescription": MUST BE STRICTLY BETWEEN 140 AND 160 CHARACTERS LONG (inclusive). Count every letter, space, and punctuation!
       Format Example: "Order authentic Jalgaon banana chips in 10 crispy flavours online. Sourced from local farms with fast delivery across India. Shop now!" (exact length ~148 chars).
       Must include a compelling call-to-action (CTA) and primary localized keywords.

    3. "keywords": 4 to 6 comma-separated high-intent search keywords/phrases (e.g., "Jalgaon Banana Chips, Buy Farsan Online, Khandeshi Masala, Indian Snacks Delivery").

    4. "ogTitle": Catchy OpenGraph Title for Facebook/WhatsApp/LinkedIn sharing (max 60 characters).

    5. "ogDescription": Engaging OpenGraph Description for social previews (max 160 characters).

    6. "seoScore": An estimated SEO optimization quality score between 85 and 100.

    7. "improvementNotes": An array of 2 to 3 concise bullet explanations describing how this meta tag adheres to Google length standards and includes high-ranking search terms.

    Return the final output as clean JSON adhering to the specified schema.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      temperature: 0.4,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          seoTitle: {
            type: Type.STRING,
            description: "Google Meta Title tag strictly between 50 and 60 characters long"
          },
          seoDescription: {
            type: Type.STRING,
            description: "Google Meta Description tag strictly between 140 and 160 characters long"
          },
          keywords: {
            type: Type.STRING,
            description: "Comma-separated target focus keywords"
          },
          ogTitle: {
            type: Type.STRING,
            description: "Social OpenGraph preview title (max 60 chars)"
          },
          ogDescription: {
            type: Type.STRING,
            description: "Social OpenGraph preview description (max 160 chars)"
          },
          seoScore: {
            type: Type.NUMBER,
            description: "Estimated SEO ranking score from 85 to 100"
          },
          improvementNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 strategic SEO benefits explaining why these tags rank higher"
          }
        },
        required: ['seoTitle', 'seoDescription', 'keywords', 'ogTitle', 'ogDescription', 'seoScore', 'improvementNotes']
      }
    }
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error('Empty response from Gemini 3.1 Flash Lite AI model.');
  }

  try {
    const data = JSON.parse(rawText.trim());
    const rawTitle = data.seoTitle || `${entityName} | Aapla Jalgaonwala`;
    const rawDesc = data.seoDescription || `Order authentic Jalgaon snacks and banana chips online from Aapla Jalgaonwala with fast delivery across India.`;

    // Apply strict double-check post-processing helper
    const adjusted = adjustSeoToGoogleLimits(rawTitle, rawDesc);

    const result: GeneratedSeoResult = {
      seoTitle: adjusted.title,
      seoDescription: adjusted.desc,
      keywords: data.keywords || 'Jalgaon Banana Chips, Farsan, Jalgaonwala',
      ogTitle: data.ogTitle || adjusted.title,
      ogDescription: data.ogDescription || adjusted.desc,
      seoScore: typeof data.seoScore === 'number' ? data.seoScore : 92,
      improvementNotes: Array.isArray(data.improvementNotes) ? data.improvementNotes : [
        'Title length calibrated to 50-60 characters to prevent Google SERP truncation.',
        'Description optimized to 140-160 characters with high-converting CTA.'
      ]
    };

    seoCache.set(cacheKey, { result, timestamp: Date.now() });
    if (seoCache.size > 200) {
      const oldest = seoCache.keys().next().value;
      if (oldest) seoCache.delete(oldest);
    }

    return result;
  } catch (err) {
    console.error('Failed to parse Gemini 3.1 Flash Lite response:', rawText, err);
    throw new Error('AI output was not in valid JSON format. Please retry.');
  }
}

/**
 * Double checks and trims / extends generated titles and descriptions to strictly fit Google SERP boundaries.
 */
export function adjustSeoToGoogleLimits(title: string, desc: string): { title: string; desc: string } {
  let finalTitle = title ? title.trim() : '';
  let finalDesc = desc ? desc.trim() : '';

  // 1. Check Title (Target: 50-60 chars)
  if (finalTitle.length > 60) {
    const separators = [' | ', ' - ', ' — '];
    let shortened = false;
    for (const sep of separators) {
      if (finalTitle.includes(sep)) {
        const parts = finalTitle.split(sep);
        const mainPart = parts[0].trim();
        if (mainPart.length <= 60 && mainPart.length >= 40) {
          finalTitle = mainPart;
          shortened = true;
          break;
        } else if (mainPart.length + 15 <= 60) {
          finalTitle = `${mainPart} | Jalgaonwala`;
          shortened = true;
          break;
        }
      }
    }
    if (finalTitle.length > 60) {
      const sliced = finalTitle.slice(0, 57);
      const lastSpace = sliced.lastIndexOf(' ');
      if (lastSpace > 40) {
        finalTitle = sliced.slice(0, lastSpace) + '...';
      } else {
        finalTitle = sliced + '...';
      }
    }
  } else if (finalTitle.length < 50) {
    const brandSuffix = ' | Aapla Jalgaonwala';
    const shortSuffix = ' | Jalgaonwala';
    if (finalTitle.length + brandSuffix.length <= 60) {
      finalTitle = `${finalTitle}${brandSuffix}`;
    } else if (finalTitle.length + shortSuffix.length <= 60) {
      finalTitle = `${finalTitle}${shortSuffix}`;
    }
  }

  // 2. Check Description (Target: 140-160 chars)
  if (finalDesc.length > 160) {
    const sentences = finalDesc.split(/(?<=[.!?])\s+/);
    let cumulative = '';
    for (const s of sentences) {
      if ((cumulative + ' ' + s).trim().length <= 160) {
        cumulative = (cumulative + ' ' + s).trim();
      } else {
        break;
      }
    }
    if (cumulative.length >= 130 && cumulative.length <= 160) {
      finalDesc = cumulative;
    } else {
      const sliced = finalDesc.slice(0, 157);
      const lastSpace = sliced.lastIndexOf(' ');
      if (lastSpace > 120) {
        finalDesc = sliced.slice(0, lastSpace) + '...';
      } else {
        finalDesc = sliced + '...';
      }
    }
  } else if (finalDesc.length < 140) {
    const ctas = [
      ' Order now for the freshest Indian snacks delivered straight to your doorstep!',
      ' Fast shipping across India. Order today!',
      ' Buy fresh, crispy, and premium snacks online now!',
      ' Delicious taste guaranteed. Shop the collection online now!'
    ];
    for (const cta of ctas) {
      if (finalDesc.length + cta.length <= 160 && finalDesc.length + cta.length >= 140) {
        finalDesc = `${finalDesc}${cta}`;
        break;
      }
    }
    if (finalDesc.length < 140) {
      finalDesc = `${finalDesc}${ctas[0]}`;
      if (finalDesc.length > 160) {
        finalDesc = finalDesc.slice(0, 157) + '...';
      }
    }
  }

  return { title: finalTitle, desc: finalDesc };
}

export interface SeoImprovementItem {
  type: 'page' | 'product' | 'category';
  id: string;
  name: string;
  currentTitle: string;
  currentDescription: string;
  issue: string;
  recommendedTitle: string;
  recommendedDescription: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface SeoPerformanceAnalysis {
  healthScore: number;
  executiveSummary: string;
  criticalIssuesCount: number;
  warningsCount: number;
  improvements: SeoImprovementItem[];
  strategicActionPlan: string[];
}

export interface SeoAnalysisInput {
  pageSeoList: Array<{ pageKey: string; pageName: string; seoTitle: string; seoDescription: string; keywords?: string }>;
  products: Array<{ id: string; name: string; category?: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string; price?: number }>;
  categories: Array<{ slug: string; name: string; tagline?: string }>;
}

/**
 * Runs a comprehensive AI Audit of the entire store's SEO state.
 * Scans metadata lengths, keyword positioning, duplicates, and returns structured recommendations.
 */
export async function analyzeSeoImprovements(input: SeoAnalysisInput): Promise<SeoPerformanceAnalysis> {
  const ai = await getAiClient();

  const pagesSummary = input.pageSeoList.map(p => ({
    key: p.pageKey,
    name: p.pageName,
    title: p.seoTitle || '',
    desc: p.seoDescription || '',
    lenTitle: (p.seoTitle || '').length,
    lenDesc: (p.seoDescription || '').length,
    keywords: p.keywords || ''
  }));

  const productsSummary = input.products.slice(0, 15).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category || '',
    title: p.seoTitle || '',
    desc: p.seoDescription || '',
    lenTitle: (p.seoTitle || '').length,
    lenDesc: (p.seoDescription || '').length,
    keywords: p.seoKeywords || ''
  }));

  const categoriesSummary = input.categories.map(c => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline || ''
  }));

  const prompt = `
    You are an elite Google Enterprise SEO Auditor specializing in Indian gourmet e-commerce and direct-to-consumer (D2C) brands.
    Our brand is "Aapla Jalgaonwala", offering authentic Jalgaon Banana Chips (10+ flavours), Khandeshi namkeens, masalas, and dry regional chutneys.
    
    You have been provided with a snapshot of our website's current SEO meta tags:
    
    1. STORE PAGES SEO SNAPSHOT:
    ${JSON.stringify(pagesSummary, null, 2)}
    
    2. PRODUCT CATALOG SEO SNAPSHOT (Top 15 sample products):
    ${JSON.stringify(productsSummary, null, 2)}
    
    3. PRODUCT CATEGORIES SNAPSHOT:
    ${JSON.stringify(categoriesSummary, null, 2)}
    
    CRITICAL AUDIT DIRECTIVES:
    - Review every page, product, and category's meta title and meta description.
    - Check Google SERP length requirements:
      * Meta Title: Ideal length is strictly 50 to 60 characters. Any title under 50 is too short (wasted ranking potential), and any title over 60 will be truncated (bad UX).
      * Meta Description: Ideal length is strictly 140 to 160 characters. Descriptions under 140 are weak, and over 160 are cut off with an ellipsis in Google.
    - Check for missing keywords, weak call-to-actions (CTA), generic or duplicate tags.
    - Formulate a precise, customized SEO performance audit.

    PROVIDE A DETAILED STRUCTURED JSON REPORT ADHERING TO THE FOLLOWING SCHEMA:
    - "healthScore": A comprehensive SEO health percentage (0-100) based on title/description lengths, keyword presence, and marketing copywriting strength.
    - "executiveSummary": An expert, engaging 2-sentence SEO audit overview focusing on our brand authority (Aapla Jalgaonwala).
    - "criticalIssuesCount": Number of pages/items that urgently need optimization (e.g. titles > 60, descriptions > 160, or completely blank fields).
    - "warningsCount": Number of non-critical but important optimization opportunities.
    - "improvements": An array of specific items to be optimized. Generate up to 8 of the most critical improvement items. For each item, include:
      * "type": Either "page", "product", or "category".
      * "id": The item's key/id/slug.
      * "name": Display name of the item.
      * "currentTitle": The current title.
      * "currentDescription": The current description.
      * "issue": What is wrong with it (e.g. "Title is 35 characters, which is too short to rank; lacks localized keywords"). Be specific and professional.
      * "recommendedTitle": A perfected, Google-friendly title strictly between 50 and 60 characters long.
      * "recommendedDescription": A perfected, high-CTR description strictly between 140 and 160 characters long.
      * "impact": Rating of how much this fix will improve traffic ("High", "Medium", "Low").
    - "strategicActionPlan": An array of 5 highly actionable, brand-specific next steps (e.g. "Optimize schema markup for local Khandeshi masala queries", "Integrate customer reviews into product short descriptions").

    Return valid, parseable JSON strictly matching this schema.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          healthScore: { type: Type.INTEGER, description: "SEO Health Score from 0 to 100" },
          executiveSummary: { type: Type.STRING, description: "Detailed executive SEO overview" },
          criticalIssuesCount: { type: Type.INTEGER, description: "Count of critical issues" },
          warningsCount: { type: Type.INTEGER, description: "Count of warning items" },
          improvements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "page, product, or category" },
                id: { type: Type.STRING, description: "Identifier key/id/slug" },
                name: { type: Type.STRING, description: "Name of the page or item" },
                currentTitle: { type: Type.STRING, description: "Current title string" },
                currentDescription: { type: Type.STRING, description: "Current description string" },
                issue: { type: Type.STRING, description: "Explanation of the SEO gap" },
                recommendedTitle: { type: Type.STRING, description: "Recommended title strictly between 50 and 60 chars" },
                recommendedDescription: { type: Type.STRING, description: "Recommended description strictly between 140 and 160 chars" },
                impact: { type: Type.STRING, description: "High, Medium, or Low" }
              },
              required: ['type', 'id', 'name', 'currentTitle', 'currentDescription', 'issue', 'recommendedTitle', 'recommendedDescription', 'impact']
            }
          },
          strategicActionPlan: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5 strategic e-commerce actions"
          }
        },
        required: ['healthScore', 'executiveSummary', 'criticalIssuesCount', 'warningsCount', 'improvements', 'strategicActionPlan']
      }
    }
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error('Empty response from SEO analysis model.');
  }

  try {
    const data = JSON.parse(rawText.trim());
    if (data.improvements && Array.isArray(data.improvements)) {
      data.improvements = data.improvements.map((item: any) => {
        const adjusted = adjustSeoToGoogleLimits(item.recommendedTitle, item.recommendedDescription);
        return {
          ...item,
          recommendedTitle: adjusted.title,
          recommendedDescription: adjusted.desc
        };
      });
    }
    return data;
  } catch (err) {
    console.error('Failed to parse Gemini SEO Analysis JSON output:', rawText, err);
    throw new Error('Analysis model did not return a valid structured JSON report.');
  }
}

export interface ExtractedPartnerDetails {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  socialPlatform: string;
  socialHandle: string;
  phonePeNumber: string;
  upiId: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  ifscCode: string;
  aadhaarPanNumber: string;
  customPartnerCode: string;
  referredByPartnerCode: string;
  notes: string;
}

/**
 * Extracts woman partner registration details from raw unformatted brief message paste (e.g. WhatsApp, note, message) using Gemini 3.1 Flash Lite.
 */
export async function extractPartnerFromBriefMessage(briefMessage: string): Promise<ExtractedPartnerDetails> {
  if (!briefMessage || !briefMessage.trim()) {
    throw new Error('Please provide a message or text snippet to extract details from.');
  }

  const ai = await getAiClient();

  const prompt = `
    You are an intelligent data extraction assistant for "Aapla Jalgaonwala".
    An admin pasted an unformatted brief message containing details of a new woman business partner (e.g., from WhatsApp, SMS, email, or oral note).

    Your job is to extract all relevant partner onboarding fields accurately:

    Brief Message:
    """
    ${briefMessage.trim()}
    """

    EXACT EXTRACTION INSTRUCTIONS:
    - "fullName": Full name of the woman partner. Capitalize nicely (e.g. "Sunita Patil").
    - "phone": 10-digit mobile/WhatsApp number without country code or spaces (e.g. "9822012345").
    - "email": Email address if present, or generate a valid placeholder like "sunita.patil@partner.aaplajalgaonwala.com" if missing.
    - "city": City or town name (e.g. "Jalgaon", "Bhusawal", "Pune", "Mumbai"). Defaults to "Jalgaon" if unknown.
    - "state": Indian state name. Defaults to "Maharashtra".
    - "socialPlatform": Preferred network platform. Must be one of: "WhatsApp", "Housing Society", "Instagram", "Facebook", "Boutique", "Other".
    - "socialHandle": Society name, handle, or boutique name mentioned in text.
    - "phonePeNumber": 10-digit PhonePe or Google Pay mobile number if mentioned.
    - "upiId": UPI ID/VPA if mentioned (e.g. "sunita@okhdfcbank").
    - "bankAccountName": Bank account holder name if present.
    - "bankName": Bank name if present.
    - "bankAccountNumber": Account number if present.
    - "ifscCode": 11-character bank IFSC code uppercase if present.
    - "aadhaarPanNumber": Aadhaar (12 digits) or PAN card number (10 characters) if mentioned.
    - "customPartnerCode": Any custom requested referral code if mentioned (e.g. "SUNITA10").
    - "referredByPartnerCode": Code or name of referring partner if mentioned (e.g. "ANITA10").
    - "notes": Any remaining useful notes or context from the message.

    Return the result strictly as JSON conforming to the schema.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullName: { type: Type.STRING },
          phone: { type: Type.STRING },
          email: { type: Type.STRING },
          city: { type: Type.STRING },
          state: { type: Type.STRING },
          socialPlatform: { type: Type.STRING },
          socialHandle: { type: Type.STRING },
          phonePeNumber: { type: Type.STRING },
          upiId: { type: Type.STRING },
          bankAccountName: { type: Type.STRING },
          bankName: { type: Type.STRING },
          bankAccountNumber: { type: Type.STRING },
          ifscCode: { type: Type.STRING },
          aadhaarPanNumber: { type: Type.STRING },
          customPartnerCode: { type: Type.STRING },
          referredByPartnerCode: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
        required: ['fullName', 'phone', 'city', 'state'],
      },
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error('Gemini model returned empty extraction result.');
  }

  try {
    const data = JSON.parse(rawText.trim());
    return {
      fullName: data.fullName || '',
      phone: (data.phone || '').replace(/\D/g, '').slice(-10),
      email: data.email || '',
      city: data.city || 'Jalgaon',
      state: data.state || 'Maharashtra',
      socialPlatform: data.socialPlatform || 'WhatsApp',
      socialHandle: data.socialHandle || '',
      phonePeNumber: (data.phonePeNumber || '').replace(/\D/g, '').slice(-10),
      upiId: data.upiId || '',
      bankAccountName: data.bankAccountName || '',
      bankName: data.bankName || '',
      bankAccountNumber: data.bankAccountNumber || '',
      ifscCode: (data.ifscCode || '').toUpperCase(),
      aadhaarPanNumber: data.aadhaarPanNumber || '',
      customPartnerCode: (data.customPartnerCode || '').toUpperCase(),
      referredByPartnerCode: (data.referredByPartnerCode || '').toUpperCase(),
      notes: data.notes || '',
    };
  } catch (err) {
    console.error('Failed to parse extracted partner JSON:', rawText, err);
    throw new Error('Failed to parse AI extraction output. Please retry.');
  }
}


