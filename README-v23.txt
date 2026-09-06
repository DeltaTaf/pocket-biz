Pocket Biz v23 — Japan Travel Pilot

New:
- travel.html: Japan-first travel hub
- Flights: provider-ready demo, no fake live prices
- Accommodation: Booking.com Demand API connection point
- Transport: deterministic Japan guidance
- Cities, activities, transparent budget, preparation checklist
- Existing v22 pages retained as the base
- Travel added to the main navigation

Booking.com:
Live Demand API access requires partner onboarding, API key and Affiliate ID.
Credentials must be stored server-side in Vercel environment variables.
Do not put credentials in travel.html.

Official docs:
https://developers.booking.com/demand/docs/getting-started/overview
https://developers.booking.com/demand/docs/development-guide/authentication
https://developers.booking.com/demand/docs/accommodations/accommodation-tutorial

This build intentionally does not fake live booking inventory.
