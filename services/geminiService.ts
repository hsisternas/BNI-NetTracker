
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedEntry } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert data entry assistant capable of reading complex documents with mixed printed and handwritten text. 
Your task is to extract a structured list of attendees from a networking meeting sheet.

The sheet typically has columns:
1. Row Number
2. Member (Name and Company often on two lines)
3. Specialty/Sector
4. Contact/Phone
5. "Referencias Deseadas" (Desired References) - This is where HANDWRITTEN notes usually appear.

Sometimes there is a section for "Guests" or "Invitados". These rows often indicate who invited them (e.g., "Invitado por Juan").

Instructions:
1. Identify every row in the list.
2. Extract the Name and Company from the first column.
3. Extract the Sector/Specialty.
4. Extract the Phone number.
5. Check if the row belongs to a GUEST. Guests usually don't have handwritten reference requests, but they might have an "Invited By" note.
6. CRITICAL: Transcription of Handwritten Notes. Look carefully at the right side of the page or over the row. 
   - Transcribe the handwritten text associated with that row.
   - If there is no handwriting for a row, return an empty string.
   - The handwriting represents the "Reference Request" for the week.
   - Ignore header text or footer legal text.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      rowNumber: { type: Type.INTEGER },
      name: { type: Type.STRING },
      company: { type: Type.STRING },
      sector: { type: Type.STRING },
      phone: { type: Type.STRING },
      handwrittenRequest: { type: Type.STRING, description: "The handwritten text found for this row" },
      isGuest: { type: Type.BOOLEAN, description: "True if this row appears to be a guest/visitor" },
      invitedByName: { type: Type.STRING, description: "Name of the member who invited this guest, if visible" }
    },
    required: ["name", "sector", "handwrittenRequest"],
  },
};

// Helper function to robustly get the API Key in various environments (Vite, CRA, etc.)
const getApiKey = (): string | undefined => {
  // 1. Try Vite standard (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore errors if import.meta is not supported
  }

  // 2. Try Create React App standard (process.env.REACT_APP_*)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_KEY) {
      return process.env.REACT_APP_API_KEY;
    }
  } catch (e) {}

  // 3. Try generic Node/Custom (process.env.API_KEY)
  // Note: Most bundlers won't expose this to the browser unless configured
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {}

  return undefined;
};

export const parseNetworkingSheet = async (
  file: File
): Promise<ExtractedEntry[]> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("API Key not found. Checked VITE_API_KEY, REACT_APP_API_KEY, and API_KEY.");
    throw new Error("La API Key no está configurada. En Vercel, asegúrate de llamar a la variable 'VITE_API_KEY'.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Convert file to base64
  const base64Data = await fileToGenerativePart(file);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // 2.5 Flash is excellent for multimodal tasks including handwriting
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data,
            },
          },
          {
            text: "Extract the table data from this image. Focus on capturing the handwritten notes in the 'Referencias Deseadas' area for each person. Also identify if any rows are Guests.",
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1, // Low temperature for higher accuracy in OCR
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No data extracted.");
    }

    return JSON.parse(text) as ExtractedEntry[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

async function fileToGenerativePart(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
