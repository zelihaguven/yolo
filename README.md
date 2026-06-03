# YOLO – Your Erasmus Life Online

> A platform for Erasmus and expat students to discover what to do, see, and experience in their new city — curated by people who've actually lived there.

---

## 📚 About This Repository

This repository contains all deliverables for the **GSE1 (Fundamentals of Software Engineering)** course project at **Hochschule Heilbronn**, completed in the Summer Semester 2026.

The project was developed in three parts:

| Part | Topic | Deadline |
|------|-------|----------|
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
│
├── part1/
│   ├── Product Backlog Of The App YOLO.pdf
│   
│
├── part2/
│   ├── YOLO_Part2_mockups.docx                    # 10 scenario descriptions
│   └── figma_link.txt                            # Figma wireframes link
│
├── part3/
│   ├── YOLO_Part3_Wiki.docx                      # Full Wiki document
│   ├── src/
│   │   ├── CitySearch.java                       # Claude-generated Java code
│   │   └── ReviewSubmission.java                 # Claude-generated Java code
│   └── lovable_link.txt                          # Lovable prototype link
│
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

All AI usage is documented and critically evaluated in the Part 3 Wiki.

