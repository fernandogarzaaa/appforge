import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assetId, rating, title, content } = await req.json();

    if (!assetId || !rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Create review
    const review = await base44.asServiceRole.entities.AssetReview.create({
      asset_id: assetId,
      reviewer_id: user.email,
      rating,
      title: title || `${rating}-star review`,
      content: content || '',
      verified_user: true,
    });

    // Update asset average rating
    const reviews = await base44.asServiceRole.entities.AssetReview.filter({ asset_id: assetId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await base44.asServiceRole.entities.MarketplaceAsset.update(assetId, {
      average_rating: avgRating,
      review_count: reviews.length,
    });

    return Response.json({
      success: true,
      review,
      averageRating: avgRating,
    });
  } catch (error) {
    console.error('Review error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});