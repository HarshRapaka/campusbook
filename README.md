# CampusBook — Room & Resource Booking System

Live Project LINK: https://campusbook-theta.vercel.app/

A web-based booking system for college shared resources: seminar halls, laboratories, conference rooms, and sports facilities.

---

## Setup Instructions

### No installation required.
This is a pure HTML/CSS/JavaScript application with zero dependencies.

1. Download or clone this repository.
2. Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).
3. The app runs entirely in the browser. Data is persisted using `localStorage`.

That's it. No server, no npm install, no build step.

---

## How to Use

### Student / Faculty View
- Browse available resources filtered by type (Seminar Hall, Lab, Conference, Sports)
- Click any resource card to load its availability calendar
- Navigate dates using the arrow buttons or date picker
- **Green slots** = Available, **Red** = Booked (approved), **Orange** = Pending approval
- Click a green slot to select it, fill in your name, purpose, and attendee count
- Submit your booking request — it goes into pending state for admin review
- Switch to "My Bookings" tab to see your submission history

### Admin Panel
- Click **Admin Panel** in the top navigation to enter admin mode
- **Pending Requests**: See all unreviewed requests with Approve / Reject buttons
  - Approval is blocked if the slot is already approved (double-booking prevention)
- **All Bookings**: Full history with cancel option
- **Manage Resources**: Add new rooms/facilities or remove existing ones
- Stats bar shows live counts of pending, approved, and total requests

---

## Features

- Visual slot grid with color-coded availability per resource per date
- Conflict detection at both submission and approval stages (no double-booking)
- Full booking history with statuses: pending, approved, rejected
- Admin approve/reject workflow
- Dynamic resource management (add/remove rooms)
- Persistent data via localStorage (survives page refresh)
- Responsive layout (works on desktop and mobile)

---

## Project Structure

```
campusbook/
├── index.html      # UI markup and styles
├── app.js          # All application logic
└── README.md       # This file
```

---

## Technology Stack

- HTML5
- CSS3 (no framework)
- Vanilla JavaScript (no libraries)

---

## Assumptions & Design Decisions

- Time slots are fixed hourly blocks from 8:00 to 18:00
- A "pending" booking blocks a slot from being double-booked by other users until it's rejected
- Admin can cancel any approved booking
- User identity is name-based (no authentication for prototype scope)
- Data persists in localStorage; for production, replace with a REST API + database backend

---

## Demo Notes

- The app ships with 9 pre-loaded resources across 4 categories
- Sample bookings are seeded for today's date to demonstrate the availability display
- To reset all data: open browser DevTools → Application → Local Storage → clear `campusbook_state`
