import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function extractTextFromImage(base64Image: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Extract all text from this image and format it cleanly. If it's a document, preserve the structure as much as possible." },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image.split(",")[1],
            },
          },
        ],
      },
    ],
  });

  return response.text || "No text found.";
}

export async function formatContentForPDF(content: string, options: { title?: string; includeTOC?: boolean }): Promise<string> {
  const prompt = `
    Format the following content for a professional PDF document.
    ${options.title ? `Title: ${options.title}` : ""}
    ${options.includeTOC ? "Include a Table of Contents at the beginning." : ""}
    Use Markdown for formatting (headers, bold, lists).
    Content:
    ${content}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || content;
}

export async function summarizeContent(content: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize the following content for a PDF summary page:\n\n${content}`,
  });

  return response.text || "Summary not available.";
}

export async function fetchContentFromUrl(url: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract the main content from this URL and format it as a professional document in Markdown: ${url}. If you cannot access the URL directly, provide a generic professional summary of what this type of URL usually contains or explain the limitation.`,
  });

  return response.text || "Failed to fetch content from URL.";
}
