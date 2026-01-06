import { Request, Response, NextFunction } from 'express';
import { Translation } from '../models';
import { successResponse, createdResponse } from '../utils/apiResponse';
import AppError from '../utils/AppError';
import { AuthRequest } from '../types/custom';

/**
 * Get all translations for a language
 * GET /api/v1/translations?language=en
 */
export const getTranslations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { language = 'en' } = req.query;

    const translations = await Translation.find({});

    // Format translations as key-value pairs for the requested language
    const formattedTranslations: Record<string, string> = {};
    translations.forEach((translation: any) => {
      const translationText = translation.translations[language as string];
      if (translationText) {
        formattedTranslations[translation.key] = translationText;
      } else {
        // Fallback to English if requested language not available
        formattedTranslations[translation.key] = translation.translations.en;
      }
    });

    successResponse(res, 'Translations retrieved successfully', formattedTranslations);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new translation (Admin)
 * POST /api/v1/translations
 */
export const createTranslation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { key, translations, category } = req.body;

    if (!key || !translations || !category) {
      throw new AppError('Key, translations, and category are required', 400);
    }

    if (!translations.en) {
      throw new AppError('English translation is required', 400);
    }

    // Check if key already exists
    const existing = await Translation.findOne({ key });
    if (existing) {
      throw new AppError('Translation key already exists', 400);
    }

    const translation = await Translation.create({
      key,
      translations,
      category,
    });

    createdResponse(res, 'Translation created successfully', translation);
  } catch (error) {
    next(error);
  }
};

/**
 * Update translation (Admin)
 * PUT /api/v1/translations/:id
 */
export const updateTranslation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { translations, category } = req.body;

    const updateData: Record<string, unknown> = {};
    if (translations) {
      updateData.translations = translations;
    }
    if (category) {
      updateData.category = category;
    }

    const translation = await Translation.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!translation) {
      throw new AppError('Translation not found', 404);
    }

    successResponse(res, 'Translation updated successfully', translation);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete translation (Admin)
 * DELETE /api/v1/translations/:id
 */
export const deleteTranslation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const translation = await Translation.findByIdAndDelete(id);

    if (!translation) {
      throw new AppError('Translation not found', 404);
    }

    successResponse(res, 'Translation deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Export translations for a language (Admin)
 * GET /api/v1/translations/export/:language
 */
export const exportTranslations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { language = 'en' } = req.params;

    const translations = await Translation.find({});

    // Format as JSON object
    const exportData: Record<string, string> = {};
    translations.forEach((translation: any) => {
      const translationText = translation.translations[language];
      if (translationText) {
        exportData[translation.key] = translationText;
      } else {
        exportData[translation.key] = translation.translations.en;
      }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=translations-${language}.json`);
    res.json(exportData);
  } catch (error) {
    next(error);
  }
};

/**
 * Import translations (Admin)
 * POST /api/v1/translations/import
 */
export const importTranslations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { translations, language, category } = req.body;

    if (!translations || !language) {
      throw new AppError('Translations object and language are required', 400);
    }

    let imported = 0;
    let updated = 0;

    for (const [key, value] of Object.entries(translations)) {
      const existing = await Translation.findOne({ key });

      if (existing) {
        // Update existing translation
        existing.translations[language] = value as string;
        await existing.save();
        updated++;
      } else {
        // Create new translation
        await Translation.create({
          key,
          translations: {
            en: language === 'en' ? (value as string) : '',
            [language]: value as string,
          },
          category: category || 'general',
        });
        imported++;
      }
    }

    successResponse(res, 'Translations imported successfully', {
      imported,
      updated,
      total: imported + updated,
    });
  } catch (error) {
    next(error);
  }
};
