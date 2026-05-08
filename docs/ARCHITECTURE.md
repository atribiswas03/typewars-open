# TypeWars Architecture & Working

This document explains the technical inner workings of TypeWars.

## High-Level Overview

TypeWars is a real-time multiplayer typing competition app. It uses a **MERN (MongoDB, Express, React, Node)** stack with **Socket.io** for real-time synchronization.

## System Architecture

### 1. Frontend (React + Vite)
- **Pages**:
  - `LandingPage`: Handles authentication (Login, Register, Guest, OTP).
  - `Lobby`: Matchmaking queue and room selection.
  - `BattlePage`: The core typing interface.
  - `Leaderboard`: Displays global rankings.
  - `Profile`: User stats and progression.
- **Services**:
  - `api.js`: Axios/Fetch wrapper for REST endpoints.
  - `socket.js`: Socket.io client configuration.
- **Typing Engine**: Local logic calculates WPM and accuracy on every keystroke, then broadcasts progress to the server.

### 2. Backend (Node + Express)
- **Authentication**: JWT-based auth with OTP verification via email.
- **REST API**:
  - `/api/auth`: Registration, Login, OTP, Passwords.
  - `/api/users`: User profiles, XP, Levels.
  - `/api/game`: Historical race data and leaderboards.
- **Real-time (Socket.io)**:
  - **Matchmaking**: A global queue that groups players into rooms.
  - **Game State**: Manages the countdown, start time, and player progress updates.
  - **Bots**: If a match isn't full, the server can spawn AI bots to compete against the player.

### 3. Database (MongoDB)
- **User Schema**: Stores credentials, XP, level, total wins, and average WPM.
- **Race Schema**: Stores the results of every completed race for analytics and leaderboards.

## Data Flow (Multiplayer Match)

1.  **Join**: Player clicks "Join Match". Client emits `join_matchmaking` via Socket.
2.  **Matchmaking**: Server adds player to a waiting pool. When enough players (or timeout), it creates a `Room`.
3.  **Start**: Server emits `match_found` with Room ID. All players join the room.
4.  **Countdown**: Server emits `countdown` (3... 2... 1...).
5.  **Race**:
    - As the player types, the client emits `progress_update` with their current WPM and % complete.
    - Server broadcasts this to all other players in the room.
    - Client UI updates live progress bars.
6.  **Finish**: When a player reaches 100%, client emits `finished`. Server records the rank and XP.
7.  **Results**: Once everyone finishes (or time limit), server emits `all_finished`.

## Security Measures

- **Passwords**: Hashed using `bcryptjs`.
- **API Access**: Protected by JWT middleware.
- **Environment Variables**: Secrets are never stored in code; managed via `.env`.
- **CORS**: Restricted to the frontend URL.
