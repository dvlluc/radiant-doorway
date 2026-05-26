import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface RatingBreakdownProps {
  reviews: Array<{ rating: number }>;
  onRatingFilter?: (rating: number | null) => void;
  selectedRating?: number | null;
}

export function RatingBreakdown({ reviews, onRatingFilter, selectedRating }: RatingBreakdownProps) {
  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 stars
  reviews.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++;
    }
  });

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;

  // Calculate percentages for each rating
  const ratingPercentages = ratingCounts.map(count => 
    totalReviews > 0 ? (count / totalReviews) * 100 : 0
  );

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Top: Average Rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-black text-black'
                      : 'text-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Bottom: Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingCounts[rating - 1];
              const percentage = ratingPercentages[rating - 1];
              
              const isSelected = selectedRating === rating;
              
              return (
                <div 
                  key={rating} 
                  className={`flex items-center gap-3 ${onRatingFilter ? 'cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors' : ''}`}
                  onClick={() => onRatingFilter && onRatingFilter(isSelected ? null : rating)}
                >
                  <span className={`text-sm font-medium w-12 ${isSelected ? 'font-bold' : ''}`}>
                    {rating}-star
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${isSelected ? 'bg-foreground' : 'bg-foreground/70'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={`text-sm text-muted-foreground w-16 text-right ${isSelected ? 'font-bold' : ''}`}>
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
