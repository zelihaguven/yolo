# YOLO – Your Erasmus Life Online

**▶ Try the working prototype: [zelihaguven.github.io/yolo](https://zelihaguven.github.io/yolo/)**

> A platform for Erasmus and expat students to discover what to do, see, and experience in their new city — curated by people who've actually lived there.

---

## 🚀 Working Prototype

A small web app that really works, built with plain HTML, CSS and JavaScript (no build step). The code is in [`docs/`](docs/).

| What you can do | How it works |
|---|---|
| Browse 48 spots in Heilbronn, Stuttgart and Frankfurt | Hand-entered data in [`docs/data/spots.json`](docs/data/spots.json) |
| Search by name | Ignores case and accents (`gruneburg` finds *Grüneburgpark*) |
| Filter by category, price and "student-friendly" | Student-friendly means free entry or a student discount |
| Save spots to a personal list | Stored in the browser (`localStorage`) |
| Leave a rating and a review that is still there after a reload | Stored in the browser (`localStorage`) |
| See the filtered spots on a map and open them from a pin | Leaflet + OpenStreetMap |
| Share a spot with a link that opens it directly | Each spot has its own address, for example `…/yolo/#/spot/ff-palmengarten` |

Run it locally:

```bash
cd docs && python3 -m http.server 8000
```

Then open `http://localhost:8000`.

**Adding data.** Spots, photos and opening hours are edited by hand in one file. [`docs/data/README.md`](docs/data/README.md) explains every field.

**Known limits.** Reviews and saved spots stay in your own browser, so other people cannot see them yet. The next step is a shared database such as Supabase. 10 of the 48 spots have had their price and student discount checked against official sources online; the rest are marked `"verified": false` and show a note. Coordinates are approximate for all spots.

### The problem

A new Erasmus student arrives in a city where they know nobody and have a small budget. Tourist sites and map apps show what is popular with visitors, not what is affordable and worth it for a student who stays for a semester. Finding out which places are free or give a student discount takes weeks of asking around. YOLO puts that answer on one screen on day one.

### The one metric

**Spots saved per new user in their first week.** A save means the student found a place they actually intend to go to, which is the value the product promises. Target for the first test round: at least 3 saved spots per tester.

The prototype does not send any data anywhere, so today this number can only be read during a test session (the "Saved" counter next to the filters). Measuring it for real needs the shared database mentioned above.

### Wireframes vs. what was built

Compared with the Part 2 Figma mock-ups (link in `figma_link.txt`). The prototype follows their visual language: blue YOLO logo, white rounded cards on a light grey canvas, filter pills, coloured price chips, bottom navigation with a purple active tab, and a spot detail sheet with a fixed "Get Directions" bar.

| Wireframe scenario | In the prototype | Difference and reason |
|---|---|---|
| 1. Registration & email verification | Not built | Needs a backend. Reviews ask only for a name. |
| 2. City exploration & spot discovery | Built | Cities are three fixed tabs instead of a free-text city search. Result cards, filter pills and the spot detail sheet follow the mock-up. Spots show a category icon until a photo is added, and the Opening Hours card appears once hours are entered for a spot. The Home screen with "Trending this week" is skipped; the app opens on the results list. |
| 3. Saving a spot | Built | Bookmark button and "Saved to your list ✓" toast as designed. "My Saved Spots" is its own tab in the bottom navigation, since there is no profile page. |
| 4. Writing a review | Built | Tip text, tap-to-rate stars and the "Thanks for sharing!" confirmation as designed. The form sits inside the spot detail instead of on its own screen, and there is no photo upload. |
| 6. Community map | Built | Coloured pins per category that follow the filters, pin popup with a "Details" button. The map centres on the chosen city, not on the user's location. |
| 7. Reading & upvoting reviews | Partly | Reviews are listed with name, stars and a thumbs-up button, sorted by upvotes. Because reviews are stored per browser, an upvote only counts your own vote for now. |
| 5, 8, 9, 10. Weekend trips, events, trip reports, profile | Not built | Out of scope for the first working version. |

The biggest change from the mock-ups: on a wide screen the list and the map sit side by side, while the mock-ups are mobile only. On a phone the prototype uses the bottom navigation (Explore, Map, Saved) like the mock-ups.

### User feedback

**No real testers yet.** Instead, the prototype was walked through from the point of view of three personas taken from the user groups in the Part 1 backlog. These are **hypotheses about what real users will say, not user quotes**. Each one is tied to something that can be checked in the live prototype.

| Persona (invented) | Task | Expected to work | Expected friction |
|---|---|---|---|
| **New arrival.** Second week in Heilbronn, small budget, does not know the city. | Find something free for Saturday afternoon and save it. | "Student-friendly" plus "Free only" narrows 14 spots to a short list in two taps. Saving shows a clear confirmation. | Search matches names only, so typing "coffee" or "park" finds nothing and the category pills have to be discovered instead. Most spots have no photo or opening hours yet, so it is hard to choose between two parks. |
| **Returning Erasmus student.** Spent last year in Stuttgart and wants to help the next group. | Leave a tip for a place they know well. | Rating and review take under a minute and need no account. | The review is stored in their own browser, so nobody else will ever see it. Their favourite place is probably not among the 16 Stuttgart spots and there is no way to add one. |
| **Long-term international student.** Third semester in Frankfurt, plans weekends with friends. | Send a spot to a group chat. | The share button gives a link that opens the spot directly. | The saved list does not follow them from laptop to phone. "Get Directions" opens OpenStreetMap, where many would expect their usual maps app. The note "not checked yet" on most spots lowers trust in the prices. |

**Hypotheses to test with real users, most important first:**

1. People search by what they want ("coffee", "free") more than by name. If true, search should also match category and tip text.
2. Photos and opening hours matter more for choosing a spot than ratings do.
3. A review nobody else can see is not worth writing. If true, a shared database comes before any other feature.

**Next step.** Give 3 to 5 Erasmus students the link and one task ("find a free place to spend Saturday afternoon and save it"), then ask what they saved, what was confusing and what was missing.

---

## 📚 About This Repository

This repository contains all deliverables for the **GSE1 (Fundamentals of Software Engineering)** course project at **Hochschule Heilbronn**, completed in the Summer Semester 2026.

The project was developed in three parts:

| Part | Topic |
|------|-------|
| Part 1 | Product Backlog & Scope Statement 
| Part 2 | Wireframes & Mock-ups 
| Part 3 | AI Implementation & Comparison 
---

## 💡 App Concept

YOLO is a mobile-first platform designed for Erasmus and long-term expat students who want to discover their new city — not through tourist blogs, but through recommendations from fellow students who have actually lived there.

**Core Features:**
- 🔍 **Explore Your City** — Search by city name, filter by category (cafe, park, bar, museum) and tags (budget-friendly, free entry, student discount)
- 🗺️ **Weekend Trips** — Discover short getaways within 1–3 hours with cost estimates, transport info, and accommodation suggestions
- ⭐ **Student Reviews & Tips** — Verified via university email; upvote system for the most helpful content
- 📍 **Community Map** — Interactive map with category filters and community-submitted spots
- 📅 **Seasonal Highlights** — Monthly event overviews, festival listings, and countdowns

---

## 📁 Repository Structure

```
yolo
├── docs/                                   # Working web prototype (served by GitHub Pages)
│   ├── index.html, style.css, app.js
│   ├── data/spots.json                     # Hand-entered spots for 3 cities
│   ├── data/README.md                      # How to add spots, photos and hours
│   ├── photos/                             # Spot photos
│   └── vendor/leaflet/                     # Map library
├── src/                                    # Part 3: AI-generated Java code
├── Product Backlog Of The App YOLO.pdf     # Part 1
├── YOLO - PART2 - Mockups.docx             # Part 2: 10 scenario descriptions
├── figma_link.txt                          # Part 2: Figma wireframes link
├── YOLO_Part3_Wiki.pdf                     # Part 3: full Wiki document
├── lovable_link.txt                        # Part 3: Lovable prototype link
└── README.md
```

---

## 🤖 Part 3 – AI Implementation

We implemented two core features using three different AI approaches and documented the results critically.

### Selected Features
1. **City Search** — Search and filter local spots by city, category, and tags
2. **Review Submission** — Submit, validate, browse, and upvote student reviews

### Approach 1 — LLM-Based Java Code Generation

| | Claude (Anthropic) | Gemini (Google) |
|---|---|---|
| City Search | ✅ First attempt | ❌ Syntax error → ✅ Second attempt |
| Review Submission | ✅ First attempt | ✅ First attempt |
| Email validation | European-aware (hs-, uni-) | Only .edu / .uni |
| Test data | YOLO-specific (Frankfurt, Heilbronn) | Generic (Madrid, Berlin) |

### Approach 2 — No-Code Prototyping (Lovable)

A live prototype was built using [Lovable](https://lovable.dev) — a no-code AI platform that generates full-stack React/TypeScript apps from natural language prompts.

🔗 **Live App:** [https://yolo-erasmus-guide.lovable.app](https://yolo-erasmus-guide.lovable.app)

**What worked:** Full mobile UI, city search with filters, review submission form, 20 pre-populated spots across 5 European cities.

**What didn't work:** Submitted reviews were not persisted to the list — a state management issue common in no-code generated apps.

### Approach 3 — AI Code Review (ChatGPT)

The Claude-generated `CitySearch.java` was reviewed by ChatGPT (GPT-4o).

**Rating:** 7.5 / 10

**Key findings:**
- ⚠️ NullPointerException risk when `null` is passed to `searchByCity()`
- ⚠️ No constructor validation on the `Spot` class
- ⚠️ Magic strings for categories — should use an `enum`
- ⚠️ Repeated `searchByCity()` calls — inefficient for large datasets
- ℹ️ `.collect(Collectors.toList())` should be replaced with `.toList()` (Java 16+)

---

## 🗂️ Part 1 – Product Backlog

The product backlog contains **97 PBIs** across:
- 6 Themes
- 14 Epics
- 77 User Stories

Each PBI includes: ID, type, description (As a… I want… so that…), complexity (1/2/3), MoSCoW priority, and acceptance criteria.

A **User Story Map** is also included, organising stories along the user journey:
Register → Explore City → Save → Plan Trip → Reviews → Map → Events → Share

---

## 🎨 Part 2 – Wireframes & Mock-ups

Mock-ups were created in **Figma** (mobile view, 390×844px).

10 scenarios were designed:
1. Registration & Email Verification
2. City Exploration & Spot Discovery
3. Saving a Spot
4. Writing a Review
5. Weekend Trip Search & Discovery
6. Community Map Exploration
7. Reading & Upvoting Reviews
8. Seasonal Events & Festival Discovery
9. Submitting a Community Trip Report
10. Profile Management

🔗 **Figma File:** *(see part2/figma_link.txt)*

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Web prototype | HTML, CSS, JavaScript, Leaflet, OpenStreetMap, GitHub Pages |
| Java (LLM demo) | Java 17, VS Code |
| No-code prototype | React, TypeScript, Lovable |
| Wireframes | Figma |
| Documentation | Microsoft Word |

---



## 📝 AI Usage Disclosure

This project used AI tools as part of the assignment requirements:
- **Claude (Anthropic)** — Java code generation (Task 1)
- **Gemini (Google)** — Java code generation for comparison (Task 1)
- **Lovable** — No-code prototype generation (Task 2)
- **ChatGPT / GPT-4o (OpenAI)** — AI code review (Task 3)
- **Claude** — Assisted with documentation structuring and grammar correction
- **Claude Code** — Built the web prototype in `docs/` and entered the seed data

All AI usage is documented and critically evaluated in the Part 3 Wiki.

