import { z } from "zod";

// File size limit: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// File validation schemas
export const pdfFileSchema = z.object({
  name: z.string(),
  size: z.number().max(MAX_FILE_SIZE, "File size must be less than 10MB"),
  type: z.literal("application/pdf", {
    errorMap: () => ({ message: "Only PDF files are allowed" }),
  }),
});

export const imageFileSchema = z.object({
  name: z.string(),
  size: z.number().max(MAX_FILE_SIZE, "File size must be less than 10MB"),
  type: z.enum(["image/jpeg", "image/jpg", "image/png"], {
    errorMap: () => ({ message: "Only JPEG and PNG images are allowed" }),
  }),
});

// Magic numbers (file signatures) for validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  jpeg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
};

/**
 * Validates file by checking its magic number (file header)
 * This prevents MIME type spoofing
 */
export const validateFileHeader = async (
  file: File,
  expectedType: "pdf" | "jpeg" | "png"
): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onloadend = (e) => {
      if (!e.target?.result) {
        resolve(false);
        return;
      }

      const arr = new Uint8Array(e.target.result as ArrayBuffer);
      const signatures = FILE_SIGNATURES[expectedType];

      // Check if file starts with any of the valid signatures
      const isValid = signatures.some((signature) =>
        signature.every((byte, index) => arr[index] === byte)
      );

      resolve(isValid);
    };

    reader.onerror = () => resolve(false);
    
    // Read first 8 bytes (enough for all our file types)
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
};

/**
 * Comprehensive file validation
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validatePdfFile = async (
  file: File
): Promise<FileValidationResult> => {
  // Schema validation
  const schemaResult = pdfFileSchema.safeParse({
    name: file.name,
    size: file.size,
    type: file.type,
  });

  if (!schemaResult.success) {
    return {
      valid: false,
      error: schemaResult.error.errors[0]?.message || "Invalid file",
    };
  }

  // Header validation
  const isValidHeader = await validateFileHeader(file, "pdf");
  if (!isValidHeader) {
    return {
      valid: false,
      error: "File appears to be corrupted or is not a valid PDF",
    };
  }

  return { valid: true };
};

export const validateImageFile = async (
  file: File
): Promise<FileValidationResult> => {
  // Schema validation
  const schemaResult = imageFileSchema.safeParse({
    name: file.name,
    size: file.size,
    type: file.type,
  });

  if (!schemaResult.success) {
    return {
      valid: false,
      error: schemaResult.error.errors[0]?.message || "Invalid image file",
    };
  }

  // Determine expected type from MIME
  let expectedType: "jpeg" | "png";
  if (file.type === "image/jpeg" || file.type === "image/jpg") {
    expectedType = "jpeg";
  } else if (file.type === "image/png") {
    expectedType = "png";
  } else {
    return { valid: false, error: "Unsupported image format" };
  }

  // Header validation
  const isValidHeader = await validateFileHeader(file, expectedType);
  if (!isValidHeader) {
    return {
      valid: false,
      error: `File appears to be corrupted or is not a valid ${expectedType.toUpperCase()}`,
    };
  }

  return { valid: true };
};
