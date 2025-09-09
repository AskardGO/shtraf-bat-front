# Shtraf-Bat

<div align="center">
  <img src="/public/tauri.svg" alt="Shtraf-Bat Logo" width="200"/>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Tauri](https://img.shields.io/badge/Tauri-1.4.0-FFC131?style=flat&logo=tauri&logoColor=white)](https://tauri.app/)
</div>

## 📋 Project Overview

Shtraf-Bat is a modern desktop chat template built with Tauri, React, and TypeScript. It provides a seamless user experience for real-time messaging with a focus on performance and security.

## ✨ Features

- 🚀 Cross-platform desktop application
- 💬 Real-time chat functionality
- 🔐 Secure authentication
- 🎨 Modern and responsive UI
- ⚡ High performance
- 🔄 Real-time presence tracking
- 📱 Mobile-friendly interface

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Material-UI (MUI)
- **State Management**: Zustand
- **Desktop**: Tauri
- **Styling**: CSS Modules, SCSS
- **Linting/Formatting**: ESLint, Prettier
- **Package Manager**: Yarn

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- Yarn (v1.22 or later)
- Rust (for Tauri development)
- System dependencies for Tauri: https://tauri.app/v1/guides/getting-started/prerequisites

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/shtraf-bat.git
   cd shtraf-bat
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Update the .env file with your configuration
   ```

### Development

Start the development server:
```bash
yarn dev
```

### Building for Production

Create a production build:
```bash
yarn build
```

## 📁 Project Structure

```
src/
├── app/                  # Application configuration and routing
├── entities/             # Core business entities
├── features/             # Feature-based modules
│   ├── auth/            # Authentication feature
│   ├── chat/            # Chat functionality
│   └── layout/          # Layout components
├── shared/              # Shared components and utilities
│   ├── api/             # API clients and services
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # State management
│   └── ui/              # Reusable UI components
└── widgets/             # Feature-specific components
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) for the amazing desktop app framework
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for the frontend tooling
- All contributors who have helped shape this project

---

<div align="center">
  Made with ❤️ by Vitalii Trebko
</div>
