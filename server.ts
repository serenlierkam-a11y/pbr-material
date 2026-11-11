import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "25mb" }));

// Initialize shared Gemini client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Response schema for structured PBR texture pack analysis
const textureAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    materialName: {
      type: Type.STRING,
      description: "Clean, recommended 3ds Max material name (e.g., Mtl_Oak_Floor_Polished)",
    },
    materialCategory: {
      type: Type.STRING,
      description: "Category: Wood, Metal, Concrete, Marble, Fabric, Plastic, Glass, Leather, Ceramic, Ground",
    },
    isMetallic: {
      type: Type.BOOLEAN,
      description: "Whether this material is predominantly metallic (metalness = 1.0) or dielectric",
    },
    recommendedIOR: {
      type: Type.NUMBER,
      description: "Physically accurate index of refraction (e.g. 1.52 for glass/plastic, 1.45 for acrylic, 2.4 for diamond)",
    },
    recommendedDisplacementAmount: {
      type: Type.NUMBER,
      description: "Recommended maximum displacement depth in cm (e.g. 1.5 for wood, 3.0 for stone/brick, 0.5 for tiles)",
    },
    roughnessInvertedToGlossiness: {
      type: Type.BOOLEAN,
      description: "True if detected maps are inverted glossiness maps instead of roughness",
    },
    normalMapFormat: {
      type: Type.STRING,
      description: "DirectX (Y-) or OpenGL (Y+)",
    },
    suggestedColorCorrectFallbacks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          missingChannel: {
            type: Type.STRING,
            description: "Channel that is missing, e.g. roughness, bump, displacement, specular, ao",
          },
          deriveFromChannel: {
            type: Type.STRING,
            description: "Source channel to feed into CoronaColorCorrect, e.g. diffuse, normal",
          },
          explanation: {
            type: Type.STRING,
            description: "Why and how this map should be derived (e.g., Diffuse inverted with high contrast simulates micro-facet roughness)",
          },
          coronaColorCorrectParams: {
            type: Type.OBJECT,
            properties: {
              invert: { type: Type.BOOLEAN },
              gamma: { type: Type.NUMBER },
              contrast: { type: Type.NUMBER },
              saturation: { type: Type.NUMBER },
              brightness: { type: Type.NUMBER },
            },
            required: ["invert", "gamma", "contrast", "saturation", "brightness"],
          },
        },
        required: ["missingChannel", "deriveFromChannel", "explanation", "coronaColorCorrectParams"],
      },
    },
    channelAssignments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          channel: {
            type: Type.STRING,
            description: "Target slot: diffuse, roughness, glossiness, normal, metalness, height, ao, opacity, emission, specular",
          },
          matchedFileName: {
            type: Type.STRING,
            description: "Name of the file matched to this slot",
          },
          confidence: {
            type: Type.NUMBER,
            description: "Confidence score between 0.0 and 1.0",
          },
          colorSpace: {
            type: Type.STRING,
            description: "Recommended gamma/color space: 'sRGB' for diffuse/albedo, 'Linear_RAW' for data maps",
          },
        },
        required: ["channel", "matchedFileName", "confidence", "colorSpace"],
      },
    },
    aiExpertSummary: {
      type: Type.STRING,
      description: "Concise expert breakdown of the material physics, color management advice, and 3ds Max shader setup",
    },
  },
  required: [
    "materialName",
    "materialCategory",
    "isMetallic",
    "recommendedIOR",
    "roughnessInvertedToGlossiness",
    "normalMapFormat",
    "suggestedColorCorrectFallbacks",
    "channelAssignments",
    "aiExpertSummary",
  ],
};

app.post("/api/analyze-textures", async (req, res) => {
  try {
    const { fileNames, contextNotes, userCustomRequirements, images } = req.body;

    if ((!fileNames || !fileNames.length) && (!images || !images.length) && !userCustomRequirements) {
      return res.status(400).json({ error: "No file names, custom requirements, or image data provided" });
    }

    const systemInstruction = `You are a Principal 3ds Max Technical Director and Senior PBR Shading Specialist specializing in Chaos Corona (CoronaPhysicalMtl) and Chaos V-Ray (VRayMtl).
Your task is to perform a deep scan ("derin tarama") of texture files and user custom requests.
Identify which PBR slot each belongs to, detect missing channels, and configure physically accurate CoronaColorCorrect derivations for missing maps.

CRITICAL DISPLACEMENT AUTO-CONFIGURATION:
- When Displacement/Height is missing or requested by the user:
  Automatically calculate CoronaColorCorrect parameters for displacement:
  - If derived from Diffuse: High contrast (+0.40 to +0.65) to isolate relief cracks/mortar, Gamma: 0.9 to 1.1, Saturation: -1.0 (100% desaturated monochrome).
  - Set realistic recommendedDisplacementAmount (e.g. 1.0 to 3.5 cm).
- When Roughness is missing:
  Derive from Diffuse with Invert = true, Contrast = +0.25 to +0.35, Gamma = 0.85, Saturation = -1.0.

Deep Scan Custom User Instructions:
- Carefully incorporate any specific additions, overrides, or preferences provided by the user in userCustomRequirements!`;

    const userPrompt = `Perform a deep PBR material scan:
File Names:
${JSON.stringify(fileNames || [], null, 2)}

User Custom Requirements & Additions:
${userCustomRequirements || "None specified. Apply optimal PBR standards."}

Context Notes:
${contextNotes || "Standard architectural/product visualization asset."}

Analyze all channels, auto-tune CoronaColorCorrect parameters for missing maps (especially displacement and roughness), and fulfill all custom user requirements.`;

    const parts: any[] = [{ text: userPrompt }];

    // If visual images are sent, attach them as inline parts
    if (images && Array.isArray(images)) {
      for (const img of images.slice(0, 4)) {
        if (img.data && img.mimeType) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data,
            },
          });
        }
      }
    }

    // High thinking requirement with gemini-4-argon
    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-argon",
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: textureAnalysisSchema as any,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({ success: true, data: parsed, modelUsed: "gemini-4-argon (ThinkingLevel.HIGH)" });
    } catch (primaryError: any) {
      console.warn("gemini-4-argon thinking call fallback to gemini-3.8-flash:", primaryError?.message);
      // Resilient fallback to gemini-3.8-flash
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: textureAnalysisSchema as any,
        },
      });
      const parsed = JSON.parse(fallbackResponse.text || "{}");
      return res.json({ success: true, data: parsed, modelUsed: "gemini-3.8-flash (Fallback)" });
    }
  } catch (err: any) {
    console.error("Error in /api/analyze-textures:", err);
    res.status(500).json({ error: err.message || "Failed to analyze textures" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "3ds Max PBR Script Studio API" });
});

// Setup Vite middleware in development or serve static in production
const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`3ds Max Script Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
