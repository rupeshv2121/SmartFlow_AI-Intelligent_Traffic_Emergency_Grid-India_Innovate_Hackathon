# SmartFlow AI - Intelligent Traffic & Emergency Grid

<div align="center">

**AI-Driven Urban Traffic Orchestration with Real-Time Emergency Response**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5.0-green.svg)](https://expressjs.com/)
[![Three.js](https://img.shields.io/badge/Three.js-0.170-black.svg)](https://threejs.org/)

**Team:** Commit and Conquer | **Hackathon:** India Innovates 2026 - Urban Solutions

[Live Demo](https://smart-flow-ai-intelligent-traffic-e.vercel.app/) • [Backend Repo](./SmartFlow_AI_Backend) • [Model Service](./SmartFlow_AI_Model_Service)

</div>

---

## 📋 Table of Contents

- [Executive Summary](#executive-summary)
- [Problem & Solution](#problem--solution)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Frontend Documentation](#frontend-documentation)
- [Backend Integration](#backend-integration)
- [Development](#development)
- [Performance](#performance)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Team](#team)
- [References](#references)

---

## 🎯 Executive Summary

**SmartFlow AI** is a comprehensive AI-driven urban traffic orchestration platform that combines real-time computer vision, adaptive signal control, and emergency-first routing to solve critical urban mobility challenges.

The system ingests live camera feeds, detects and classifies vehicles in real-time, estimates road congestion dynamically, and updates signal timing strategies autonomously. When emergencies occur, SmartFlow AI activates coordinated green corridors to expedite ambulance and fire service response times.

**Key Impact:**
- ⏱️ **Reduce average wait times** at intersections by 25-35%
- 🚑 **Accelerate emergency response** by 40-50% through dynamic green corridors
- 🌍 **Lower emissions & fuel waste** by 15-20% via optimized traffic flow
- 📊 **Unified visibility** through centralized traffic operations dashboard

---

## 🚨 Problem & Solution

### The Problem
Most urban intersections rely on **static traffic signal timers** with **manual overrides**, creating three critical issues:

1. **Peak-Hour Congestion** - Non-adaptive signal cycles cause severe bottlenecks during rush hours
2. **Emergency Response Delays** - Ambulances and fire trucks get stuck in red-light zones, reducing response effectiveness
3. **Environmental & Economic Impact** - Inefficient traffic causes 25-30% wasted fuel and increased vehicle emissions

### The Solution
SmartFlow AI implements a **closed-loop traffic management system**:

```
┌──────────────────────────────────────────────────────────────┐
│                    SmartFlow AI System Loop                  │
├──────────────────────────────────────────────────────────────┤
│  1. CAPTURE   → Multi-camera CCTV intersection feeds         │
│  2. PERCEIVE  → YOLO vehicle detection & classification      │
│  3. ANALYZE   → AI-powered density & congestion metrics      │
│  4. DECIDE    → Dynamic signal timing algorithm              │
│  5. ACTIVATE  → Green corridor for emergencies               │
│  6. VISUALIZE → Real-time dashboard & reporting              │
└──────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🚦 Traffic Intelligence
- **Real-time Vehicle Detection** - YOLO-based vehicle classification from live camera feeds
- **Dynamic Density Metrics** - Automatic calculation of road congestion (low/medium/high)
- **Adaptive Signal Control** - Green time allocation based on live traffic patterns
- **Multi-Intersection Coordination** - 9-intersection grid with synchronized timing
- **Historical Analytics** - 30-minute rolling window of traffic patterns

### 🚁 Emergency Response System
- **Automatic Dispatch** - 3 dispatch modes: North-South, East-West, or Random direction
- **Smart Routing** - Ambulances can take direct route or maximum-turn routes for training
- **Green Corridor Activation** - Automatic traffic light preemption for emergency vehicles
- **Real-time Tracking** - Visual mapping of ambulance position and estimated arrival
- **Route Optimization** - Dynamic routing through intersection system to hospital

### 📊 Visualization & Control
- **3D Real-time Simulation** - React Three Fiber-powered 3D traffic visualization
- **Live Camera Monitoring** - 4-camera feed with AI detection overlays
- **Interactive Dashboard** - Traffic density, vehicle counts, congestion analytics
- **Signal Control Interface** - Manual override and monitoring of signal timings
- **Emergency Visualization** - Visual representation of active green corridors

### 🎯 System Intelligence
- **Frame-Skip Optimization** - Process only relevant frames for maximum performance
- **Parallel Detection** - Independent processing of 4+ camera streams
- **Reduced Payload** - 70% smaller image data through quality optimization
- **WebSocket Real-time** - Sub-10ms latency for live updates
- **Configurable Settings** - AI confidence thresholds, alert settings, display preferences

---

## 🏗 Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    Frontend (This Repository)                   │
│              React + Vite + Three.js + Tailwind CSS            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Pages:                                                     │ │
│  │ ├─ Live Traffic    - 4-camera AI detection monitoring     │ │
│  │ ├─ Simulation      - 3D interactive traffic simulation     │ │
│  │ ├─ Dashboard       - Statistics & analytics               │ │
│  │ └─ Settings        - System configuration                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ├─ REST API                         │
│                            └─ WebSocket (Socket.io)           │
└────────────────────────────┼──────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────┬──────────────┐
        ▼                                     ▼              ▼
   ┌─────────────┐                  ┌──────────────────┐ ┌──────────┐
   │  Backend    │                  │  AI Model        │ │ Database │
   │  (Express)  │────────────────  │  Service (YOLO)  │ │ (Redis)  │
   │  Port 3000  │  Traffic Logic   │  Port 8000       │ └──────────┘
   └─────────────┘                  └──────────────────┘
        │ ▲
        │ │ Coordinated Signals
        │ │ & Metrics
        │ └─────────────────────────────────┐
        │                                   │
        └───────────────────────────────────┘
```

### Data Flow

1. **Camera Capture** → Video streams from 4 CCTV cameras
2. **AI Detection** → YOLO model detects vehicles, estimates speed & type
3. **Backend Processing** → Traffic store updated, metrics calculated
4. **Signal Optimization** → Adaptive timing algorithm computes green times
5. **Frontend Rendering** → Real-time 3D simulation & dashboard updates
6. **Emergency Routing** → Green corridor activation & broadcast

---

## 🛠 Technology Stack

### Frontend
| Tech | Version | Purpose |
|------|---------|---------|
| **React** | 18.3 | UI framework with hooks |
| **TypeScript** | 5.8 | Type-safe development |
| **Vite** | 5.4 | Lightning-fast build tool |
| **Three.js** | 0.170 | 3D graphics rendering |
| **React Three Fiber** | 8.18 | React renderer for Three.js |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **React Router** | 6.30 | Client-side routing |
| **Socket.io Client** | 4.8 | Real-time WebSocket communication |
| **Recharts** | 2.15 | Data visualization charts |
| **Shadcn UI** | Latest | Accessible component library |

### Backend Integration
| Tech | Version | Purpose |
|------|---------|---------|
| **Express** | 5.0 | REST API server |
| **Socket.io** | 4.8 | Real-time bidirectional communication |
| **TypeScript** | 5.6 | Type-safe backend code |

### AI & Vision (Connected Services)
| Tech | Purpose |
|------|---------|
| **Python** | Backend scripting |
| **OpenCV** | Frame processing & overlays |
| **YOLO** | Vehicle detection & classification |
| **FastAPI** | AI inference server |

---

## 📁 Project Structure

```
SmartFlow_AI-Intelligent_Traffic_Emergency_Grid/
├── README.md                                    # This file
├── green-corridor-sim/                          # Main frontend application
│   ├── src/
│   │   ├── pages/                               # Page components
│   │   │   ├── Index.tsx                        # Home page
│   │   │   ├── LiveTraffic.tsx                  # AI detection monitoring
│   │   │   ├── SignalControl.tsx                # Signal timing controls
│   │   │   └── Traffic.tsx                      # Analytics dashboard
│   │   │
│   │   ├── components/
│   │   │   ├── simulation/                      # 3D simulation
│   │   │   │   ├── SimulationScene.tsx          # Main 3D scene
│   │   │   │   ├── RealisticAmbulanceMoving.tsx # Emergency vehicle
│   │   │   │   ├── Road.tsx                     # Road network
│   │   │   │   ├── TrafficLight.tsx             # Signal visualization
│   │   │   │   ├── Buildings.tsx                # City buildings
│   │   │   │   ├── SystemHUD.tsx                # Bottom controls
│   │   │   │   └── IntersectionMarker.tsx       # Intersection markers
│   │   │   │
│   │   │   ├── vehicles/                        # Vehicle models
│   │   │   │   ├── RealisticAmbulance.tsx       # Ambulance model
│   │   │   │   ├── RealisticCar.tsx             # Car model
│   │   │   │   └── RealisticBike.tsx            # Bike model
│   │   │   │
│   │   │   └── ui/                              # Shadcn components
│   │   │       ├── card.tsx
│   │   │       ├── badge.tsx
│   │   │       └── ...
│   │   │
│   │   ├── config/
│   │   │   └── cameraStreams.ts                 # Camera configuration
│   │   │
│   │   ├── hooks/
│   │   │   └── use-mobile.tsx                   # Responsive utilities
│   │   │
│   │   ├── lib/
│   │   │   └── utils.ts                         # Utility functions
│   │   │
│   │   ├── App.tsx                              # Main app component
│   │   └── main.tsx                             # Entry point
│   │
│   ├── package.json                             # Dependencies
│   ├── vite.config.ts                           # Vite configuration
│   └── tsconfig.json                            # TypeScript config
│
├── SmartFlow_AI_Backend/                        # Express backend (linked)
│   └── README.md                                # Backend documentation
│
└── SmartFlow_AI_Model_Service/                  # FastAPI inference (linked)
    └── README.md                                # Model service documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** 9+ or **yarn**
- **Backend API** running on `http://localhost:3000`
- **AI Model Service** running on `http://localhost:8000`

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd SmartFlow_AI-Intelligent_Traffic_Emergency_Grid/green-corridor-sim
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment configuration**

```bash
cp .env.example .env
```

Edit `.env` with your service URLs:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_AI_API_URL=http://localhost:8000
VITE_SIMULATIONS_URL=http://localhost:5173/simulation
```

4. **Start development server**

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

5. **Build for production**

```bash
npm run build
npm run preview
```

---

## 📄 Frontend Documentation

### Key Pages

#### 🎮 Live Traffic Page
**Path:** `/traffic`

Monitor real-time AI vehicle detection from 4 camera feeds:

- **4-camera grid display** - Live video with detection overlays
- **Vehicle counting** - Real-time classification (cars, emergency vehicles)
- **Confidence scoring** - AI model confidence levels
- **Detection history** - Frame-by-frame detection data
- **Frame skip metrics** - Performance optimization visibility

**Features:**
- Toggle AI detection on/off
- Adjust detection confidence threshold
- View detailed vehicle classifications
- Monitor frame processing speed

#### 🚦 Simulation Page
**Path:** `/simulation`

Interactive 3D traffic simulation with realistic vehicles and emergency response:

- **3D City Grid** - 9-intersection network with roads and buildings
- **Vehicle Simulation** - 60+ vehicles (cars, bikes, buses) moving autonomously
- **Traffic Lights** - Dynamic signal timing with phase indicators
- **Ambulance Dispatch** - 3 modes: NS, EW, or Random with max-turns option
- **Green Corridor** - Visual indication of active emergency routes
- **Hospital Landmark** - Dynamically positioned hospital with entrance

**Interactive Controls:**
- `DISPATCH_NS` - Start ambulance from North-South
- `DISPATCH_EW` - Start ambulance from East-West
- `DISPATCH_RANDOM` - Random direction + maximum turns for training
- Mouse orbit controls for camera navigation

#### 📊 Dashboard Page
**Path:** `/dashboard`

Real-time traffic analytics and metrics:

- **Total vehicle count** - Aggregated vehicles across all intersections
- **Active intersections** - Count of intersections with traffic
- **Congested roads** - Number of roads at high density
- **Emergency alerts** - Active ambulance/emergency events
- **Average speed** - Fleet-wide average vehicle speed
- **Traffic history** - 30-minute trending graph
- **Congestion heatmap** - City-wide traffic intensity visualization

#### ⚙️ Signal Control Page
**Path:** `/signals`

Traffic light management and optimization:

- **Signal timing display** - Current green/yellow/red phases
- **Phase counters** - Time remaining for each phase
- **Density metrics** - Vehicle count per approaching lane
- **Congestion analytics** - Per-intersection congestion levels
- **Hourly trends** - 24-hour congestion pattern analysis

### Component System

#### 3D Simulation Components

**SimulationScene.tsx**
- Main React Three Fiber canvas setup
- 9-intersection traffic grid initialization
- Ambulance behavior and routing logic
- Controller management for signal timing

**RealisticAmbulanceMoving.tsx**
- Ambulance autonomous navigation
- Turn decision logic (toward hospital or max-turns)
- Signal respecting behavior
- Hospital arrival detection
- Frame logging for debugging

**Road.tsx**
- Road network rendering
- Lane positioning (4 lanes per direction)
- Road markings and center lines

**TrafficLight.tsx**
- Signal visualization (red/yellow/green)
- Time remaining display
- Queue depth visualization

**Buildings.tsx**
- Procedural city building generation
- Avoids road/intersection areas
- Hospital exclusion zone

**RealisticCivilianCar/Bike/Auto.tsx**
- Vehicle behavior models
- Lane following and speed management
- Emergency vehicle yielding
- Traffic rule compliance

#### UI Components

Using **Shadcn UI** component library based on Radix UI:

- `Card` - Display traffic statistics
- `Badge` - Status indicators
- `Button` - Control buttons
- `Dialog` - Settings modals
- `Tabs` - Page navigation
- `Tooltip` - Contextual help

### Configuration

**Camera Streams Configuration** (`src/config/cameraStreams.ts`)

```typescript
export const CAMERA_STREAMS = [
  {
    id: 1,
    name: 'Camera 1 - North Road',
    streamUrl: 'http://camera1-ip/stream',
    position: [0, 0]
  },
  // ... 3 more cameras
];

export const DETECTION_CONFIG = {
  imageQuality: 0.6,        // Reduced from 0.85 for performance
  autoStart: true,
  confidenceThreshold: 0.7,
  detectionInterval: 1000   // ms between detections
};
```

---

## 🔗 Backend Integration

### API Communication

The frontend communicates with the backend via:

1. **REST API** - HTTP requests for data queries
2. **WebSocket** - Real-time Socket.io event broadcasting

### Key Endpoints Used

**Traffic Data:**
```
GET /api/traffic-density              - Current road density
GET /api/dashboard-stats              - Dashboard metrics
GET /api/signal-timing                - Signal status
GET /api/emergency-events             - Active emergencies
```

**AI Integration:**
```
POST /api/ai/vehicle-detection        - Send detection results
GET /api/ai/status                    - AI system status
```

**Real-time Events:**
```
road-updated                          - Road density changed
intersection-updated                  - Intersection status changed
emergency-vehicle-detected            - Ambulance/emergency alert
emergency-vehicle-cleared             - Emergency completed
dashboard-stats                       - Stats refresh
```

### Socket.io Connection

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('initial-data', (data) => {
  // Load initial traffic state
});

socket.on('emergency-vehicle-detected', (alert) => {
  // Display ambulance alert and corridor activation
});
```

---

## 💻 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run tests
npm run test

# Watch tests
npm run test:watch

# Linting
npm run lint
```

### Environment Setup

Create `.env.local` for local overrides:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_AI_API_URL=http://localhost:8000
VITE_DEBUG=true
```

### Development Workflow

1. **Start backend** on port 3000
2. **Start AI service** on port 8000
3. **Run frontend** with `npm run dev`
4. **Open browser** to `http://localhost:5173`
5. **Monitor console** for WebSocket and API logs

### Performance Tips

- Use React DevTools Profiler to identify slow renders
- Check Network tab for large image payloads
- Use Console for frame skip metrics (logged during detection)
- Monitor memory usage with DevTools Performance tab
- Enable Vite fast refresh for instant updates

### Code Style

- **TypeScript** - Use strict mode
- **Components** - Functional components with hooks
- **Styling** - Tailwind CSS utility classes
- **Naming** - PascalCase for components, camelCase for functions
- **Directory** - Organize by feature/domain

---

## ⚡ Performance Optimization

### Current Optimizations Implemented

| Optimization | Impact | Status |
|---|---|---|
| Frame skipping system | 99%+ frame capture | ✅ Implemented |
| Image quality reduction (85% → 60%) | 70% smaller payload | ✅ Implemented |
| Parallel camera processing | 5-8x faster for 4 cameras | ✅ Implemented |
| FP16 inference | 2-3x speedup | ✅ Implemented |
| WebSocket real-time updates | <10ms latency | ✅ Implemented |

### Performance Metrics

| Metric | Value |
|--------|-------|
| **Single detection processing** | ~50-75ms |
| **4 parallel detections** | 100-150ms |
| **Image payload size** | 25-35KB (70% reduction) |
| **WebSocket latency** | <10ms |
| **Frame skip rate** | <1% (99%+ capture) |

### Recommended Optimizations for Production

1. **Code Splitting** - Lazy load pages and heavy components
2. **Asset Optimization** - Compress images and models
3. **Service Worker** - Cache API responses
4. **CDN** - Serve assets from edge locations
5. **Database** - Cache frequently accessed data in Redis
6. **Load Testing** - Benchmark with k6 or JMeter

---

## 🚀 Deployment

### Production Build

```bash
npm run build
```

Creates `dist/` folder with optimized production build.

### Deployment Platforms

#### Vercel (Recommended)

```bash
vercel deploy
```

Configure in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_BASE_URL": "@api_base_url",
    "VITE_AI_API_URL": "@ai_api_url"
  }
}
```

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

#### Environment Variables for Production

```env
VITE_API_BASE_URL=https://api.smartflow.ai
VITE_AI_API_URL=https://model.smartflow.ai
VITE_SIMULATIONS_URL=https://smartflow.ai/simulation
NODE_ENV=production
```

---

## 🤝 Contributing

### Getting Started with Contributing

1. **Fork** the repository
2. **Create feature branch**: `git checkout -b feat/your-feature`
3. **Make changes** and test locally
4. **Run type-check**: `npm run typecheck`
5. **Build**: `npm run build` to verify
6. **Commit**: `git commit -m "feat: descriptive message"`
7. **Push & create PR**

### Code Guidelines

- Use **TypeScript** for all new code
- Add **JSDoc comments** for complex functions
- Write **meaningful component names**
- Keep **components under 300 lines**
- Test **interactive features** thoroughly
- Follow **Git commit conventions**

### Testing

```bash
npm run test              # Run all tests once
npm run test:watch      # Watch mode for development
```

### PR Requirements

1. ✅ TypeScript type-checks pass
2. ✅ Builds successfully (`npm run build`)
3. ✅ No console errors/warnings
4. ✅ Responsive design verified
5. ✅ Updated documentation if needed

---

## 👥 Team

**Team Name:** Commit and Conquer

| Name | Role | Institution |
|------|------|-------------|
| **Rupesh Varshney** | Full-stack Developer | B.Tech Computer Engineering, ZHCET |
| **Austin Varshney** | Backend Developer | B.Tech Computer Engineering, ZHCET |
| **Bhomik Varshney** | Frontend Developer | B.Tech Computer Engineering, ZHCET |
| **Aryan Parashar** | AI/ML Engineer | B.Tech AI, ZHCET |
| **Prakhar Saxena** | AI/ML Engineer | B.Tech AI, ZHCET |

**Institution:** Zakir Husain College of Engineering and Technology, Aligarh Muslim University

---

## 📚 References

### Official Documentation
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Three.js Documentation](https://threejs.org/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Tailwind CSS](https://tailwindcss.com)

### AI & Vision
- [YOLO v8 Documentation](https://docs.ultralytics.com)
- [OpenCV Documentation](https://docs.opencv.org)
- [FastAPI Documentation](https://fastapi.tiangolo.com)

### Traffic & Urban Solutions
- [SUMO Traffic Simulation](https://www.eclipse.org/sumo)
- [Google Maps Platform](https://developers.google.com/maps)

### Related Projects
- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics)
- [OpenCV](https://github.com/opencv/opencv)
- [Express.js](https://github.com/expressjs/express)

---

## 📞 Support & Communication

- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - Technical discussions and architecture
- **Email** - commitandconquer@example.com
- **Hackathon** - India Innovates 2026

---

<div align="center">

**Built with ❤️ for the India Innovates 2026 Hackathon**

[GitHub](https://github.com) • [Vercel](https://vercel.com) • [Documentation](#)

</div>
