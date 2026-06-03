import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Represents a local spot for Erasmus students.
 */
class Spot {
    private String name;
    private String category;
    private String city;
    private boolean isBudgetFriendly;
    private boolean hasFreeEntry;

    public Spot(String name, String category, String city, boolean isBudgetFriendly, boolean hasFreeEntry) {
        this.name = name;
        this.category = category;
        this.city = city;
        this.isBudgetFriendly = isBudgetFriendly;
        this.hasFreeEntry = hasFreeEntry;
    }

    // Getters
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getCity() { return city; }
    public boolean isBudgetFriendly() { return isBudgetFriendly; }
    public boolean hasFreeEntry() { return hasFreeEntry; }

    @Override
    public String toString() {
        return String.format("%s [%s] in %s (Budget-friendly: %b, Free Entry: %b)", 
                name, category, city, isBudgetFriendly, hasFreeEntry);
    }
}

/**
 * Main search and filter engine for the YOLO mobile app.
 */
public class CitySearchGemini {
    private List<Spot> spots;

    public CitySearchGemini() {
        this.spots = new ArrayList<>();
    }

    // Method to add a spot to the list
    public void addSpot(Spot spot) {
        this.spots.add(spot);
    }

    /**
     * Core search and filter method using Java Streams.
     * Pass null or empty values to skip a specific filter.
     */
    public List<Spot> searchSpots(String city, String category, Boolean requireBudgetFriendly, Boolean requireFreeEntry) {
        return spots.stream()
                // 1. Case-insensitive city search (Required)
                .filter(spot -> city == null || city.trim().isEmpty() || 
                        spot.getCity().equalsIgnoreCase(city.trim()))
                
                // 2. Category filter (Optional)
                .filter(spot -> category == null || category.trim().isEmpty() || 
                        spot.getCategory().equalsIgnoreCase(category.trim()))
                
                // 3. Budget-friendly filter (Optional)
                .filter(spot -> requireBudgetFriendly == null || !requireBudgetFriendly || 
                        spot.isBudgetFriendly())
                
                // 4. Free entry filter (Optional)
                .filter(spot -> requireFreeEntry == null || !requireFreeEntry || 
                        spot.hasFreeEntry())
                
                .collect(Collectors.toList());
    }

    /**
     * Main method with example data to test the functionality.
     */
    public static void main(String[] args) {
        CitySearchGemini yoloApp = new CitySearchGemini();

        // Adding mock data for Erasmus hotspots
        yoloApp.addSpot(new Spot("Cafe Bistro", "cafe", "Madrid", true, true));
        yoloApp.addSpot(new Spot("Retiro Park", "park", "Madrid", true, true));
        yoloApp.addSpot(new Spot("The Tapas Place", "bar", "Madrid", true, false));
        yoloApp.addSpot(new Spot("Skyline Cocktail Lounge", "bar", "Madrid", false, false));
        yoloApp.addSpot(new Spot("Prado Museum", "museum", "Madrid", false, true)); 
        yoloApp.addSpot(new Spot("Central Park Cafe", "cafe", "Berlin", true, true));
        yoloApp.addSpot(new Spot("Mauerpark", "park", "Berlin", true, true));

        System.out.println("--- 1. Testing Case-Insensitive City Search (madrid) ---");
        List<Spot> madridSpots = yoloApp.searchSpots("madrid", null, null, null);
        madridSpots.forEach(System.out::println); 

        System.out.println("\n--- 2. Filtering Madrid by Category ('bar') ---");
        List<Spot> madridBars = yoloApp.searchSpots("Madrid", "bar", null, null);
        madridBars.forEach(System.out::println);

        System.out.println("\n--- 3. Filtering Madrid for Budget-Friendly AND Free Entry spots ---");
        List<Spot> cheapFreeMadrid = yoloApp.searchSpots("Madrid", null, true, true);
        cheapFreeMadrid.forEach(System.out::println);

        System.out.println("\n--- 4. Searching Berlin Cafes ---");
        List<Spot> berlinCafes = yoloApp.searchSpots("berlin", "cafe", null, null);
        berlinCafes.forEach(System.out::println);
    }
}