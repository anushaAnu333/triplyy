import { NextResponse } from 'next/server';

type GooglePlaceReview = {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
};

type GooglePlaceDetailsResponse = {
  status: 'OK' | string;
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: GooglePlaceReview[];
  };
  error_message?: string;
};

export async function GET(): Promise<NextResponse> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env.GOOGLE_PLACES_PLACE_ID;

    if (!apiKey || !placeId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Google Places is not configured. Add GOOGLE_PLACES_API_KEY and GOOGLE_PLACES_PLACE_ID.',
        },
        { status: 500 }
      );
    }

    const fields = ['rating', 'user_ratings_total', 'reviews'].join(',');
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=${encodeURIComponent(fields)}&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { method: 'GET' });
    const json = (await res.json()) as GooglePlaceDetailsResponse;

    if (json.status !== 'OK' || !json.result) {
      return NextResponse.json(
        {
          success: false,
          message: json.error_message || 'Google Places returned an error.',
        },
        { status: 400 }
      );
    }

    /** Only surface positive reviews (4–5 stars) with real comment text. */
    const MIN_GOOD_RATING = 4;

    const reviews = (json.result.reviews || [])
      .map((r) => ({
        authorName: r.author_name || 'Google User',
        profilePhotoUrl: r.profile_photo_url || '',
        rating: typeof r.rating === 'number' ? r.rating : 0,
        text: (r.text || '').trim(),
        relativeTimeDescription: r.relative_time_description || '',
      }))
      .filter((r) => r.rating >= MIN_GOOD_RATING && r.text.length > 0);

    const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;

    return NextResponse.json({
      success: true,
      message: 'Google reviews fetched successfully.',
      data: {
        placeId,
        mapsUrl,
        averageRating: json.result.rating ?? 0,
        ratingCount: json.result.user_ratings_total ?? 0,
        reviews,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch Google reviews.',
      },
      { status: 500 }
    );
  }
}

