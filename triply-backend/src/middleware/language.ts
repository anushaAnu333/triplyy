import { Request, Response, NextFunction } from 'express';

/**
 * Extract language from Accept-Language header or default to 'en'
 */
export const extractLanguage = (req: Request): string => {
  const acceptLanguage = req.headers['accept-language'];
  
  if (!acceptLanguage) {
    return 'en';
  }

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,ar;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, q = 'q=1'] = lang.trim().split(';');
      const quality = parseFloat(q.replace('q=', ''));
      return { code: code.split('-')[0].toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);

  // Return the highest quality language code, defaulting to 'en'
  return languages[0]?.code || 'en';
};

/**
 * Middleware to add language to request object
 */
export const languageMiddleware = (
  req: Request & { language?: string },
  res: Response,
  next: NextFunction
): void => {
  req.language = extractLanguage(req);
  next();
};



