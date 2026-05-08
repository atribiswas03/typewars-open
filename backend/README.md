# TypeWars Backend

Node.js + Express + Socket.IO backend for TypeWars.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express
- **Real-time**: Socket.IO
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (Ready for expansion)

## Features
- Room-based matchmaking
- Real-time event broadcasting
- Leaderboard storage
- XP and Leveling system
- Rate limiting and secure socket handling

## Setup
1. `npm install`
2. Create `.env` with `MONGODB_URI` and `JWT_SECRET`
3. `npm start` or `npm run dev` (nodemon)

## Deployment
Optimized for Render or Railway. Configure `CLIENT_URL` for CORS.
