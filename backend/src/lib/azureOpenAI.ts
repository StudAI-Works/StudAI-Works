import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY as string,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultHeaders: {
    "api-key": process.env.AZURE_OPENAI_KEY as string,
  },
  defaultQuery: {
    "api-version": process.env.AZURE_OPENAI_API_VERSION as string,
  },
});

export default client;