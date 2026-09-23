import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { initialProducts } from '@/data/products';
import { initialCategories } from '@/data/categories';
import { initialSiteSettings } from '@/data/settings';

// Create a compact snapshot of top products and categories for model grounding
const productCatalogSummary = initialProducts.slice(0, 30).map(p => ({
  name: p.name,
  category: p.categoryName,
  price: `₹${p.price}`,
  mrp: `₹${p.mrp}`,
  description: p.shortDescription || p.description,
  flavour: p.flavour,
  url: `/product/${p.slug}`,
  tags: p.tags?.join(', ')
}));

const SYSTEM_INSTRUCTION = `You are "Aapla Jalgaonwala AI Mitra" (आपला जळगाववाला AI मित्र), the official, intelligent, warm, and helpful virtual brand assistant of "Aapla Jalgaonwala".

### ABOUT THE BRAND & BUSINESS:
- **Brand Name**: Aapla Jalgaonwala (आपला जळगाववाला)
- **Tagline**: Rooted in Tradition. Crafted for Modern Taste.
- **Location & Heritage**: Jalgaon, Maharashtra, India. Renowned worldwide as the "Banana City of India" (केळीचे शहर) and heartland of Khandeshi spices.
- **Core Mission**: Delivering authentic, farm-fresh Khandeshi snacks, artisanal banana chips in 10 signature flavours, traditional savoury farsaan, and authentic stone-ground masalas directly to customers' doorsteps across India.
- **Quality Promise**: 100% vegetarian, premium farm-sourced raw bananas from Jalgaon, authentic cold-pressed/quality vegetable oils, zero harmful chemicals, hygienically packed with nitrogen flushing for long-lasting crispness and fresh aroma.

### PRODUCT CATEGORIES & SIGNATURE SPECIALITIES:
1. **Banana Chips (10 Signature Flavours @ ₹79 per 100g)**:
   - Jalgaon Masala (Signature spicy Khandeshi blend)
   - Peri Peri (Fiery & zesty modern fusion)
   - Chatpata Pani Poori (Street-style mint, tamarind & cumin tang)
   - Creamy Cheese (Cheddar cheese twist for all ages)
   - Pudina Punch (Cool garden mint & rock salt)
   - Cream & Onion (Classic herb sour cream)
   - Salt & Black Pepper (Crushed Tellicherry pepper & sea salt)
   - Sweet Chilli / Tomato Twist (Sweet & tangy crunch)
   - Classic Golden Salted (Pure traditional crunch with rock salt)
2. **Authentic Khandeshi Farsaan**:
   - Tikhat Shev (Famous spicy thick crisp gram flour noodles)
   - Bhadang (Spicy garlic roasted puffed rice snack)
   - Lasun Chivda (Crispy flattened rice tossed with golden fried garlic)
   - Bhavnagari Gathiya & Mix Farsaan
3. **Stone-Ground Handcrafted Masalas**:
   - Khandeshi Kala Masala (Legendary 24-spice dark aromatic blend for authentic Shev Bhaji, curries & dal)
   - Khandeshi Goda Masala (Fragrant roasted coconut & whole spices)
   - Shev Bhaji Special Masala
4. **Artisanal Potato Chips & Gifting Value Combos**:
   - Snack sampler boxes, festive gift packs, and family value packs.

### SHIPPING, DELIVERY & POLICIES:
- **Shipping Coverage**: All PIN codes across India.
- **Delivery Rates**:
  - Local / Maharashtra: Standard ₹40 (FREE delivery on orders above ₹399).
  - Rest of India: Standard ₹70 (FREE delivery on orders above ₹799).
- **Dispatch Time**: Orders dispatched within 24 to 48 hours. Express delivery in 2-5 business days.
- **Payment Methods**: 100% Secure Checkout via Razorpay (UPI, Google Pay, PhonePe, Cards, NetBanking, COD available where supported).

### BUSINESS OPPORTUNITIES & FRANCHISE:
- We offer Franchise partnerships, retail distribution, and corporate/wedding bulk orders.
- Users interested in franchise can visit the dedicated page: \`/franchise\` or contact us at \`/contact\`.

### NAVIGATION & SITE LINKS:
When relevant, recommend internal links formatted naturally like markdown:
- Shop All Products: \`/shop\`
- Explore Categories: \`/categories\`
- Our Heritage & Story: \`/our-story\`
- Franchise Inquiries: \`/franchise\`
- Contact & Support: \`/contact\`
- View Cart / Checkout: \`/cart\`

### TONE & BEHAVIOUR GUIDELINES:
- Greet users with warm Marathi/Indian hospitality ("Namaskar!", "Welcome to Aapla Jalgaonwala! 🙏").
- Answer questions accurately, concisely, and enthusiastically.
- Format responses cleanly with bullet points, bold product names, and pricing where helpful.
- If recommending snacks for specific moods (e.g. tea-time, spicy lovers, kids, fasting/parties), give specific recommendations from the menu!
- Never invent nonexistent products or false pricing. Current banana chips price is ₹79 (MRP ₹99).
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, userQuery } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to environment secrets.',
        reply: "Namaskar! 🙏 I'm Aapla Jalgaonwala's AI Assistant. Currently my AI cloud engine is being connected. In the meantime, feel free to explore our delicious 10 flavours of Banana Chips in the [Shop](/shop) or contact our team via [Contact Page](/contact)!"
      }, { status: 200 });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Format chat history if provided
    let conversationPrompt = ``;
    if (Array.isArray(messages) && messages.length > 0) {
      conversationPrompt += `Conversation History:\n`;
      messages.slice(-6).forEach(m => {
        conversationPrompt += `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.text}\n`;
      });
    }
    conversationPrompt += `\nCustomer's Current Question: ${userQuery || 'Hello, tell me about Aapla Jalgaonwala products'}\n\nAssistant Response:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: conversationPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.95,
      }
    });

    const replyText = response.text || "Namaskar! How can I assist you with Aapla Jalgaonwala's delicious snacks and masalas today?";

    return NextResponse.json({
      success: true,
      reply: replyText
    });

  } catch (error: any) {
    console.error('Error in AI support assistant API:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Error communicating with AI Assistant',
      reply: "Namaskar! 🙏 I encountered a temporary network delay. You can explore our signature Jalgaon Banana Chips, Tikhat Shev, and Kala Masala on our [Shop](/shop) or reach us on WhatsApp/Call via the [Contact Page](/contact)."
    }, { status: 200 });
  }
}
