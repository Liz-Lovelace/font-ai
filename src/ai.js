import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const __dirname = path.resolve();

// Initialize the OpenAI clients with different tokens
const chatOpenAI = new OpenAI({
  apiKey: process.env.OPENAI_API_TOKEN,
});

const imageOpenAI = new OpenAI({
  apiKey: process.env.OPENAI_IMAGE_API_TOKEN,
});

export async function preparePrompt(userMessage) {
  // If MOCK_AI is set, return test value
  if (process.env.MOCK_AI == "true") {
    console.log('MOCK_AI enabled: Returning test prompt');
    return "test value";
  }

  // Prepare the prompt template
  const promptTemplate = `
User says: ${userMessage}

I'd like you to insert a description of what the user wants into this prompt structure:

"Design a type specimen sheet that clearly displays every character of the English alphabet and numerals in a clean, consistent layout. Include all uppercase letters (A–Z). Arrange them in a precise grid layout with ample vertical and horizontal padding to ensure no characters are cropped or cut off. Sort characters alphabetically and numerically in clearly defined rows or sections. {Use a pixelated} aesthetic with black glyphs on a white background. Ensure the typeface style is uniform across all characters, with sharp lines, balanced proportions, and ideal legibility for typography development.  Explicitly render the following characters with full visibility and spacing: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z"

{Use a pixelated} = this is were you specify the style/aesthetic, based on user input, without the curly braces

Please respond with the prompt structure, with the user's description inserted into the {Use a pixelated} section, and nothing else
`;

  try {
    // Send the request to OpenAI API
    const response = await chatOpenAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You help write prompts using a prompt structure. You respond only with the string that is specified, with the information filled into it, and nothing else." },
        { role: "user", content: promptTemplate }
      ],
      max_tokens: 1000,
      // temperature: 0.7,
    });

    // Extract and return the text response
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to get response from AI service');
  }
}

export async function generateImageFromPrompt(prompt = "Test image") {
  // If MOCK_AI is set, return mock image buffer
  if (process.env.MOCK_AI == "true") {
    console.log('MOCK_AI enabled: Returning mock image');
    try {
      const mockImagePath = path.join(__dirname, 'mock_image.png');
      return fs.readFileSync(mockImagePath);
    } catch (error) {
      console.error('Error reading mock image:', error);
      throw new Error('Failed to read mock image file');
    }
  }

  console.log('Generating image for prompt:', prompt);
  
  const response = await imageOpenAI.images.generate({
    model: "gpt-image-1",
    prompt: prompt,
    quality: "medium",
  });

  const image_base64 = response.data[0].b64_json;
  const image_bytes = Buffer.from(image_base64, "base64");
  
  return image_bytes;
}
