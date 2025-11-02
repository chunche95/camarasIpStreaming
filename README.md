# IP Camera Monitoring System

Modular system for monitoring and managing IP cameras, developed as part of the final degree project (TFG) **"Video Monitoring System for a Living Lab."**

## Features

* Automatic discovery of cameras on the network
* Real-time video streaming from multiple cameras
* Responsive web interface
* Centralized camera management
* Developer mode for advanced diagnostics

## Requirements

* Node.js >= 16.x
* FFmpeg
* Docker and Docker Compose (optional)

## Project Structure

The project follows a modular architecture with a clear separation between the backend and frontend:

```
/
+-- backend/                 # API and streaming services (Node.js/Express)
+-- frontend/                # User interface (React)
+-- docker-compose.yml       # Development configuration
+-- docker-compose.prod.yml  # Production configuration
```

## Installation and Configuration

### Using Docker (recommended)

1. Clone the repository:

   ```bash
   git clone https://github.com/example/camera-monitoring-system.git
   cd camera-monitoring-system
   ```

2. Configure environment variables:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Edit the `.env` files to set:

   * IP range for network scanning
   * Default credentials for RTSP cameras
   * System ports and configuration

4. Start the system with Docker Compose:

   ```bash
   docker-compose up -d
   ```

5. Access the application:

   * Frontend: [http://localhost:3000](http://localhost:3000)
   * Backend API: [http://localhost:3033](http://localhost:3033)

---

### Manual Installation

#### Backend

1. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

#### Frontend

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

---

## Production Deployment

1. Configure production environment variables:

   ```bash
   cp backend/.env.example backend/.env.prod
   # Modify the variables according to your production environment
   ```

2. Build and deploy with Docker Compose:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## Developer Mode

The system includes a hidden developer mode for diagnostics and advanced management:

1. Access the web interface
2. Go to **"Configure Cameras"**
3. Press the **"D"** key five times in a row
4. The developer panel will appear with advanced options:

   * Full CRUD management for cameras
   * Connection diagnostics
   * Stream restart tools
   * System logs

---

## REST API

The API includes the following endpoints:

* `GET /api/cameras` – Get active cameras
* `GET /api/cameras/all` – Get all cameras
* `POST /api/cameras/scan` – Start network scan
* `PUT /api/cameras/:id` – Update camera status
* `PUT /api/cameras/:id/display-name` – Update display name
* `POST /api/cameras/add` – Add a camera manually
* `DELETE /api/cameras/:id` – Delete a camera
* `POST /api/cameras/restart-streams` – Restart all streams

---

## Architecture

### Backend

Modular structure based on **SOLID** principles and **Clean Architecture**:

* **Controllers** – Handle HTTP requests
* **Models** – Data abstraction
* **Services** – Business logic
* **Utilities** – Helper functions

### Frontend

Component-based architecture using React:

* **Context API** – Centralized state management
* **Custom Hooks** – Reusable logic
* **Atomic Components** – Modular, reusable UI elements

---

## License

This project is private and intended exclusively for use as part of the TFG **"Video Monitoring System for a Living Lab."**

## Author

**Paulino Esteban Bermúdez Rodríguez**