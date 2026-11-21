/** Contrato HTTP entre a interface web e o servidor do gerador. */
import type { Brand, GenerationRequest, Product } from './content';

export interface HealthResponse {
  ai: boolean;
  images: boolean;
  textModel: string;
  imageModel: string;
}

export interface BrandRequest { request: GenerationRequest }
export interface ProductsRequest { request: GenerationRequest }
export interface ImageRequest { product: Product; brand: Brand }

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

export interface ApiError { error: string }

export const extFromMime = (mime: string): 'png' | 'jpg' | 'webp' =>
  mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
