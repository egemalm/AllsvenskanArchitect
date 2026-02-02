
# Fantasy Allsvenskan Architect 🏗️

![Version](https://img.shields.io/badge/version-3.0.0-green)
![Tech](https://img.shields.io/badge/react-19-blue)
![Style](https://img.shields.io/badge/tailwind-3.4-purple)
![License](https://img.shields.io/badge/license-MIT-gray)

**Fantasy Allsvenskan Architect** is a high-performance, mobile-first companion app for the Swedish Fantasy Football league. Unlike standard fantasy apps, the Architect focuses on **atomic squad optimization**, **real-time data resilience**, and **rank-threat analytics**.

It is built to run as a Progressive Web App (PWA) or wrapped in a native container, providing a "Cyber/Dark Mode" aesthetic optimized for OLED screens.

---

## ⚡ Key Features

### 1. Visual Squad Builder
*   **Interactive Pitch View**: A fully interactive 11-player pitch with a 4-player bench.
*   **Dynamic Validation**: Real-time enforcement of formation rules (1 GK, 3-5 DEF, 2-5 MID, 1-3 FWD) and squad limits (max 3 players per team).
*   **Budget Management**: Live bank calculation with granular budget editing capabilities.

### 2. The "Scout" AI Engine 🧠
The core differentiator of the Architect is its client-side optimization engine found in the `AI Scout` tab. It operates in two modes:

*   **Incremental Optimization (The Curve)**:
    *   Uses a **Recursive Combinatorial Search** to analyze transfer depths from 1 to 5.
    *   Calculates the "Marginal EP Gain" (Expected Points) for every additional transfer to determine if the point hit is worth the potential return.
    *   **Pruning**: Implements intelligent pruning (only analyzing the bottom 5 performers for deep searches) to keep the UI responsive on mobile devices.
    
*   **Wildcard Mode**:
    *   Uses a **Greedy Algorithm** to build the highest EP squad from scratch.
    *   Automatically performs budget balancing by iteratively swapping the lowest value-per-cost asset until the squad fits within the financial cap.

### 3. Data Resilience (The Proxy Swarm) 🐝
To ensure the app works even when the official API has strict CORS policies or minor outages, the data layer implements a **Proxy Swarm**:
*   The app races multiple proxy services (`allorigins`, `corsproxy`, `codetabs`, etc.) simultaneously.
*   It implements a "Fail-Fast" mechanism with a 4.5s timeout.
*   **Atomic Pruning**: Raw API data is stripped of unused fields immediately upon receipt to minimize memory footprint.
*   **Offline Caching**: If all networks fail, the app gracefully degrades to the last known state stored in `localStorage`.

### 4. Advanced Analytics
*   **Influence**: Identifies your "Differentials" (High EP players in your squad with low overall ownership).
*   **Rank Threats**: Identifies "Dangerous" players (High EP players *not* in your squad with high ownership).
*   **Stats Hub**: A live league table and color-coded Fixture Difficulty Rating (FDR) view.

---

## 🛠️ Tech Stack

*   **Core**: React 19 (Hooks, Context, Memoization)
*   **Language**: TypeScript (Strict typing for API interfaces)
*   **Styling**: Tailwind CSS (Utility-first, responsive design)
*   **Icons**: Lucide React
*   **State**: Local State + LocalStorage Persistence (No Redux/Zustand required due to atomic architecture)

---

## 📂 Project Structure

```
/
├── components/          
│   ├── layout/          # AppHeader, AppFooter
│   ├── views/           # SquadView, AiScoutView, StatsHub...
│   ├── modals/          # TransferModal, PlayerInfoModal...
│   └── shared/          # Reusable UI (PlayerSlot)
├── hooks/
│   ├── useFantasyData.ts
│   ├── useSquadManager.ts
│   └── useScoutEngine.ts
├── services/
│   └── api.ts           # The Proxy Swarm and Data Fetching logic
├── types.ts             # TypeScript interfaces for API responses
├── constants.ts         # Configuration (Formation rules, defaults)
├── App.tsx              # Main Controller & State Machine
└── index.tsx            # Entry point
```

---

## 🏗️ Architecture

The application implements a **Domain-Driven Design** approach using React Hooks to separate concerns:

1.  **`useFantasyData` (Data Layer)**
    *   **Responsibility**: Centralized data fetching, caching, and synchronization.
    *   **Features**: Manages the Proxy Swarm, handles "Live" vs "Cached" states, and prunes raw API responses to minimize memory footprint.

2.  **`useSquadManager` (Game State)**
    *   **Responsibility**: Manages the user's specific context.
    *   **Features**: Handles squad slots, bank balance, captaincy logic, and chip usage. Enforces game rules (valid formations, team limits) and persists state to `localStorage`.

3.  **`useScoutEngine` (The Brain)**
    *   **Responsibility**: Pure mathematical optimization.
    *   **Features**: An isolated combinatorial engine that takes "ReadOnly" data and the current "Squad State" to calculate optimal moves. Runs asynchronously to prevent blocking the UI thread.

---

## 🧠 Algorithmic Detail

### The Optimization Loop
The `runScout` function in `App.tsx` performs the following logic:

1.  **Identify Weaknesses**: Sorts current squad by `ep_next` (Expected Points).
2.  **Generate Combinations**: Creates sets of players to remove (Size $k=1$ to $5$).
3.  **Knapsack-style Fill**: For every removed set, it attempts to fill the empty slots with the highest EP players available in the market that:
    *   Fit the budget.
    *   Fit the formation rules.
    *   Do not violate team constraints.
4.  **Result**: Returns a "Transfer Pack" suggesting the exact moves to make.

---

## ⚠️ Disclaimer

This project is a third-party tool and is not affiliated with, endorsed by, or connected to Allsvenskan or the official Fantasy Allsvenskan game. Data is retrieved from public endpoints for personal analysis.

---

Developed with 💚 for the love of the game.
