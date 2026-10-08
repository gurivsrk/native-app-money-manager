# Money Manager (Monthly Budget) 💰📱

A React Native & Expo mobile application designed to help users track personal finances, manage accounts, monitor category-wise spending, view detailed analytics, and stay on top of monthly budgets.

---

## ✨ Features

- 💵 **Transaction Management**: Easily log income, expense, and transfer transactions with date, category, account, and note details.
- 📁 **Category & Account Management**: Organize finances across customized accounts and spending categories.
- 📊 **Analytics & Reports**: Visual insight into monthly budget trends, income vs. expense balance, and category breakdowns.
- 📅 **Interactive Date & Month Pickers**: Filter and view monthly records with intuitive calendar navigation components.
- 💾 **Local & Cloud Storage**: Local persistent storage with Async Storage alongside Firebase integration capabilities.
- 📱 **Cross-Platform**: Support for Android, iOS, and Web via Expo.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 57](https://expo.dev/)
- **Navigation**: React Navigation (Bottom Tabs)
- **State & Storage**: React Context API, `@react-native-async-storage/async-storage`
- **Backend / Sync**: Firebase SDK
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js installed on your machine. You will also need the [Expo Go](https://expo.dev/go) app on your mobile device (or an Android/iOS emulator).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/gurivsrk/native-app-money-manager.git
   cd native-app-money-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Run on target platform**:
   - Press `a` in the terminal for **Android**.
   - Press `i` in the terminal for **iOS**.
   - Press `w` in the terminal for **Web**.
   - Scan the QR code using the **Expo Go** app on your physical mobile device.

---

## 📜 Scripts

| Script | Command | Description |
| --- | --- | --- |
| `npm start` | `expo start` | Starts the Expo development server |
| `npm run android` | `expo start --android` | Launches the app in Android Emulator / device |
| `npm run ios` | `expo start --ios` | Launches the app in iOS Simulator |
| `npm run web` | `expo start --web` | Runs the app in a web browser |
| `npm run lint` | `expo lint` | Lints the project codebase |

---

## 📂 Project Structure

```text
├── assets/                 # App icons, splash screens, and images
├── src/
│   ├── components/         # Reusable UI components & modals
│   ├── config/             # Configuration files (Firebase, etc.)
│   ├── constants/          # App constants & initial data
│   ├── context/            # React Context for global budget state
│   ├── screens/            # Main screen views (Home, Analytics, Accounts, etc.)
│   ├── services/           # Storage and API services
│   └── types/              # TypeScript interface & type definitions
├── App.tsx                 # Root application component
├── app.json                # Expo project configuration
└── package.json            # Dependencies and npm scripts
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
