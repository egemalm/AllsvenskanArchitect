[![Production Build](https://github.com/egemalm/AllsvenskanArchitect/actions/workflows/ci.yml/badge.svg)](https://github.com/egemalm/AllsvenskanArchitect/actions/workflows/ci.yml)
# Allsvenskan Architect 🏆

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Capacitor](https://img.shields.io/badge/capacitor-%231199EE.svg?style=for-the-badge&logo=capacitor&logoColor=white)


[![Download on the App Store](https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg)](https://apps.apple.com/us/app/allsvenskan-architect/id6758556561)

> **A high-performance fantasy football companion app featuring a custom combinatorial optimization engine for transfer strategy.**

## 📱 Project Overview
Allsvenskan Architect is a mobile-first application built to give fantasy managers a mathematical edge. Unlike standard fantasy apps that just show stats, this application actively **solves** the problem of "who to buy" using a custom-built decision engine.

It is built as a hybrid mobile application using **React** and **Capacitor**, providing a native iOS experience with a single codebase.

---


## ✨ Key Features

### 🧠 The "Scout Engine" (Combinatorial Optimization)
The core differentiator of the app. A custom algorithm that analyzes thousands of possible transfer combinations to find the mathematically optimal move.
* **Recursive Search:** Evaluates transfer chains up to 5 layers deep.
* **Value Curve Analysis:** Visualizes the marginal gain of each additional transfer to help users decide if a "hit" (points deduction) is worth it.
* **Wildcard Mode:** A greedy algorithm variant that rebuilds the entire squad from scratch within budget constraints.

### 📊 Rank Analytics
* **Influence vs. Threat:** Instead of just showing ownership %, the app contextualizes data into "Influence" (players that will boost your rank if they score) vs "Threats" (highly owned players that hurt your rank if you don't own them).

### ⚡ Performance & UX
* **Optimized Threading:** The heavy math logic utilizes asynchronous yielding to ensure the UI remains responsive (60fps) even during complex recursive calculations.
* **Offline First:** Caches bootstrap data to allow roster tinkering even with poor network connectivity.
* **Live Sync:** Real-time integration with the official Allsvenskan Fantasy API.

---

## 🏗️ Architecture & Engineering

This project moves beyond standard "tutorial code" by implementing a strict **Separation of Concerns** using a custom hooks architecture.

### The "Composer" Pattern
The application logic is decoupled into three distinct domains, wired together in the root `App.tsx`:

1.  **`useFantasyData` (Data Layer)**
    * Responsible for fetching, normalizing, and caching external API data.
    * Handles loading states and error boundaries.

2.  **`useSquadManager` (State Layer)**
    * Manages the user's local state (Squad, Bank, Captaincy).
    * Exposes atomic actions (`handlePlayerAction`, `executeTransfer`) to the UI.
    * Enforces game rules (e.g., max 3 players per team, valid formations) to prevent invalid states.

3.  **`useScoutEngine` (Computation Layer)**
    * Pure logic component.
    * Accepts a read-only snapshot of the squad and market data.
    * Returns optimization results without ever mutating the app state directly.

---

## 📸 Screenshots

<table style="width: 100%;">
  <tr>
    <td align="center" width="33%"><b>Squad Management</b></td>
    <td align="center" width="33%"><b>AI Scout Engine</b></td>
    <td align="center" width="33%"><b>Rank Analytics</b></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/39a215b1-3bcc-4577-a478-cf5af15bf639" width="100%" /></td>
    <td><img src="https://github.com/user-attachments/assets/ecb99f0b-bcb5-4757-8ce2-a8a570f5500b" width="100%" /></td>
    <td><img src="https://github.com/user-attachments/assets/cfddcbfa-d332-4f92-8c3d-1e31a00f6965" width="100%" /></td>
  </tr>
  <tr>
    <td align="center"><i>Interactive Pitch View</i></td>
    <td align="center"><i>Transfer Optimization</i></td>
    <td align="center"><i>Risk Assessment</i></td>
  </tr>
</table>

---

## 🛠️ Tech Stack

* **Frontend:** React 18, TypeScript, Vite
* **Styling:** Tailwind CSS, Lucide React (Icons)
* **Mobile:** Capacitor (iOS Build Target)
* **State Management:** React Hooks (Custom Architecture)
* **Data Persistence:** LocalStorage & API Caching

## 🚀 Getting Started

1.  **Clone the repo**
    ```bash
    git clone [https://github.com/yourusername/allsvenskan-architect.git](https://github.com/yourusername/allsvenskan-architect.git)
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for iOS (Requires Xcode)**
    ```bash
    npm run build
    npx cap sync
    npx cap open ios
    ```

---

## 🔮 Future Roadmap
* **Web Workers:** Moving the `useScoutEngine` logic to a dedicated Web Worker to further unblock the main thread on older devices.
* **Unit Testing:** Implementing Jest/Vitest for the optimization logic.
* **Advanced Metrics:** Integrating xG (Expected Goals) data overlay.
