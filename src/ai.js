import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_TOKEN,
});

export async function preparePrompt(userMessage) {
  // Prepare the prompt template
  const promptTemplate = `
User says: ${userMessage}

Please respond with a description of an image based on the description that the user provided. The image should be of a font grid, which will be used for image generation. Your goal is to generate good-looking concepts for font styles. For instance, if the user says "funky", you should respond with "font grid with a funky aesthetic, thick lines, 1980s style, empathizing the curves of the letters"
`;

  try {
    // Send the request to OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: promptTemplate }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    // Extract and return the text response
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to get response from AI service');
  }
} 