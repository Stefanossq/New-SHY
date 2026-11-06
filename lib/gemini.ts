import { AIService } from "./aiService";

/**
 * Backward compatibility module for old imports.
 * Delegates calls to the newly abstracted and cleaner AIService.
 */

export const generateProductsWithImages = async (theme: string) => {
  try {
    const products = await AIService.generateProducts(theme);
    
    // Fetch images in parallel using AIService
    const imagePromises = products.map((p, index) => 
      AIService.generateImage(
        `Uma foto de estúdio profissional e de alta qualidade do produto: "${p.name}". O fundo deve ser limpo e minimalista, em cor sólida.`,
        p.name,
        index
      )
    );
    const images = await Promise.all(imagePromises);

    return { products, images };
  } catch (error) {
    console.error("Error in legacy generateProductsWithImages:", error);
    throw error;
  }
};

export const generateCarProductsWithImages = async () => {
  try {
    // Falls back to mock or FIPE via generatorEngine if needed, here we call FIPE or dynamic mock
    const products = await AIService.generateProducts("Carros Esportivos");
    
    const imagePromises = products.map((p, index) =>
      AIService.generateImage(
        `Foto de um ${p.name}, cor prata, em um estúdio com fundo branco.`,
        p.name,
        index
      )
    );
    const images = await Promise.all(imagePromises);

    return { products, images };
  } catch (error) {
    console.error("Error in legacy generateCarProductsWithImages:", error);
    throw error;
  }
};
