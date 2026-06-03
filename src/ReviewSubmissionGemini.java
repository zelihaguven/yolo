import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Represents a review submitted by an Erasmus student for a specific spot.
 */
class Review {
    private final String id;
    private final String spotName;
    private final String city;
    private final int rating;
    private final String reviewText;
    private final String studentEmail;
    private int upvotes;

    public Review(String spotName, String city, int rating, String reviewText, String studentEmail) {
        this.id = UUID.randomUUID().toString().substring(0, 8); // Generate a short readable ID
        this.spotName = spotName;
        this.city = city;
        this.rating = rating;
        this.reviewText = reviewText;
        this.studentEmail = studentEmail;
        this.upvotes = 0;
    }

    // Getters
    public String getId() { return id; }
    public String getSpotName() { return spotName; }
    public String getCity() { return city; }
    public int getRating() { return rating; }
    public String getReviewText() { return reviewText; }
    public String getStudentEmail() { return studentEmail; }
    public int getUpvotes() { return upvotes; }

    public void incrementUpvotes() {
        this.upvotes++;
    }

    @Override
    public String toString() {
        return String.format("ID: %s | Spot: %s (%s) | Rating: %d★ | Upvotes: %d\n\"%s\" - by %s\n", 
                id, spotName, city, rating, upvotes, reviewText, studentEmail);
    }
}

/**
 * Review validation and management engine for the YOLO mobile app.
 * Class name matches your file: ReviewSubmissionGemini.java
 */
public class ReviewSubmissionGemini {
    private final List<Review> reviews;
    
    // Simple regex pattern to validate basic student/university emails (e.g., .edu, .ac.uk, or containing '.uni')
    private static final Pattern UNIVERSITY_EMAIL_PATTERN = 
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.(edu|ac\\.[a-z]{2}|uni|erasmus)\\.[a-z]{2,}|^[A-Za-z0-9._%+-]+@.*uni.*\\.[a-z]+$", Pattern.CASE_INSENSITIVE);

    public ReviewSubmissionGemini() {
        this.reviews = new ArrayList<>();
    }

    /**
     * Validates and submits a new review.
     * @return true if submission succeeds, false if validations fail.
     */
    public boolean submitReview(String spotName, String city, int rating, String reviewText, String studentEmail) {
        // 1. Validate Spot Name and City
        if (spotName == null || spotName.trim().isEmpty() || city == null || city.trim().isEmpty()) {
            System.err.println("Submission Failed: Spot name and city cannot be empty.");
            return false;
        }

        // 2. Validate Rating (Must be between 1 and 5)
        if (rating < 1 || rating > 5) {
            System.err.println("Submission Failed: Rating must be between 1 and 5 stars.");
            return false;
        }

        // 3. Validate Review Text (Cannot be blank and must be at least 10 characters long for quality control)
        if (reviewText == null || reviewText.trim().length() < 10) {
            System.err.println("Submission Failed: Review text must be at least 10 characters long.");
            return false;
        }

        // 4. Validate University Email
        if (studentEmail == null || !UNIVERSITY_EMAIL_PATTERN.matcher(studentEmail).matches()) {
            System.err.println("Submission Failed: A valid university email (.edu, .uni, etc.) is required for verification.");
            return false;
        }

        // Everything passes, save the review
        Review newReview = new Review(spotName, city, rating, reviewText, studentEmail);
        reviews.add(newReview);
        System.out.println("Success: Review for '" + spotName + "' successfully submitted! (ID: " + newReview.getId() + ")");
        return true;
    }

    /**
     * Browse reviews by spot name or city (Case-insensitive).
     */
    public List<Review> browseReviews(String spotName, String city) {
        return reviews.stream()
                .filter(r -> spotName == null || spotName.trim().isEmpty() || r.getSpotName().equalsIgnoreCase(spotName.trim()))
                .filter(r -> city == null || city.trim().isEmpty() || r.getCity().equalsIgnoreCase(city.trim()))
                .collect(Collectors.toList());
    }

    /**
     * Upvote a review by its short unique ID.
     */
    public boolean upvoteReview(String id) {
        for (Review r : reviews) {
            if (r.getId().equalsIgnoreCase(id)) {
                r.incrementUpvotes();
                System.out.println("Upvoted review ID: " + id + " (Total upvotes: " + r.getUpvotes() + ")");
                return true;
            }
        }
        System.err.println("Upvote Failed: Review ID " + id + " not found.");
        return false;
    }

    /**
     * Returns top rated reviews (4 stars and above).
     */
    public List<Review> getTopRatedReviews() {
        return reviews.stream()
                .filter(r -> r.getRating() >= 4)
                .collect(Collectors.toList());
    }

    /**
     * Main method to demonstrate and test features.
     */
    public static void main(String[] args) {
        ReviewSubmissionGemini yoloReviews = new ReviewSubmissionGemini();

        System.out.println("--- 1. Testing Valid Submissions ---");
        yoloReviews.submitReview("Cafe Bistro", "Madrid", 5, "Best cheap coffee for students!", "john.doe@madrid.edu");
        yoloReviews.submitReview("Cafe Bistro", "Madrid", 4, "Cozy place but always crowded.", "anna@uni-madrid.es");
        yoloReviews.submitReview("Retiro Park", "Madrid", 5, "Amazing place to chill after lectures.", "pier@student.uni.fr");
        yoloReviews.submitReview("Mauerpark", "Berlin", 4, "Great Sunday flea market and karaoke!", "clara@berlin.edu");
        yoloReviews.submitReview("Skyline Bar", "Madrid", 2, "Too expensive for an Erasmus budget.", "marco@tech-uni.it");

        System.out.println("\n--- 2. Testing Validation Failures ---");
        // Invalid email
        yoloReviews.submitReview("Retiro Park", "Madrid", 5, "Amazing place!", "john@gmail.com"); 
        // Invalid rating
        yoloReviews.submitReview("Retiro Park", "Madrid", 6, "Amazing place!", "john@uni.edu"); 
        // Text too short
        yoloReviews.submitReview("Retiro Park", "Madrid", 4, "Cool", "john@uni.edu"); 

        System.out.println("\n--- 3. Browsing Reviews for 'Cafe Bistro' ---");
        List<Review> bistroReviews = yoloReviews.browseReviews("Cafe Bistro", null);
        bistroReviews.forEach(System.out::println);

        System.out.println("--- 4. Testing Upvoting Mechanism ---");
        if (!bistroReviews.isEmpty()) {
            String reviewIdToUpvote = bistroReviews.get(0).getId();
            yoloReviews.upvoteReview(reviewIdToUpvote);
            yoloReviews.upvoteReview(reviewIdToUpvote); // Upvoting twice to verify counter
            
            System.out.println("\nUpdated Review Status:");
            System.out.println(bistroReviews.get(0));
        }

        System.out.println("--- 5. Browsing All Reviews in 'Berlin' ---");
        yoloReviews.browseReviews(null, "Berlin").forEach(System.out::println);

        System.out.println("--- 6. Fetching Top Rated Reviews (>= 4★) ---");
        yoloReviews.getTopRatedReviews().forEach(System.out::println);
    }
}