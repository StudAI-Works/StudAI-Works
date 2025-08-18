import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_BASE_URL,
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
  defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION }
});

export default client;
