# wowkeyb-fe

Frontend application for wowkeyb - a World of Warcraft keybinding management tool.

## 🎯 Overview

wowkeyb-fe is an Angular-based frontend application that provides a user interface for managing World of Warcraft keybindings. It connects to the wowkeyb-be backend API to provide features like:

- **Keybinding Management**: Create, edit, and organize keybindings for different classes and specializations
- **Class Support**: Support for all WoW classes with their specializations and hero talents
- **Version Management**: Handle different game versions and ability changes
- **User Authentication**: Secure user accounts and keybinding storage
- **Public Sharing**: Share keybindings with the community

## 🚀 Technology Stack

- **Framework**: Angular 17+
- **UI Library**: Fuse Admin Template
- **Styling**: Tailwind CSS + SCSS
- **State Management**: Angular Services
- **HTTP Client**: Angular HttpClient
- **Build Tool**: Angular CLI
- **Deployment**: GitHub Actions → AWS S3 + CloudFront

## 📁 Project Structure

```
wowkeyb-fe/
├── src/
│   ├── app/                    # Main application code
│   │   ├── core/              # Core services and guards
│   │   ├── layout/            # Layout components
│   │   ├── modules/           # Feature modules
│   │   └── shared/            # Shared components and services
│   ├── @fuse/                 # Fuse template components
│   ├── environments/          # Environment configurations
│   └── styles/               # Global styles
├── public/                    # Static assets
│   ├── images/               # Images and icons
│   ├── fonts/                # Custom fonts
│   └── i18n/                 # Internationalization files
├── .github/workflows/         # GitHub Actions workflows
└── docs/                     # Documentation
```

## 🛠️ Development

### Prerequisites

- Node.js 22+
- npm or yarn
- Angular CLI

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wowkeyb-fe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   ng serve
   ```

4. **Open in browser**
   Navigate to `http://localhost:4200/`

### Environment Configuration

The application uses different environment configurations:

- **Development**: `src/environments/environment.develop.ts`
- **Staging**: `src/environments/environment.staging.ts`
- **Production**: `src/environments/environment.production.ts`

Each environment file contains:
- API endpoints
- Feature flags
- Build configurations

## 🚀 Deployment

The application uses GitHub Actions for automated deployment to AWS S3 and CloudFront.

### Deployment Process

1. **Automatic Deployment**: Pushes to `master`, `develop`, or `staging` branches trigger deployments
2. **Manual Deployment**: Use GitHub Actions workflow dispatch for manual deployments
3. **Multi-Environment**: Separate deployments for develop, staging, and production

### Environment URLs

- **Develop**: `https://develop.wowkeyb.gg`
- **Staging**: `https://staging.wowkeyb.gg`
- **Production**: `https://wowkeyb.gg`

## 🔧 Build Commands

```bash
# Development build
ng build --configuration=develop

# Staging build
ng build --configuration=staging

# Production build
ng build --configuration=production

# Run tests
ng test

# Run linting
ng lint
```

## 📚 API Integration

The frontend communicates with the wowkeyb-be backend API:

### Key Endpoints

- **Authentication**: `/api/auth/*`
- **Keybindings**: `/api/keybindings/*`
- **Abilities**: `/api/abilities/*`
- **Versions**: `/api/versions/*`
- **Users**: `/api/user/*`

### API Configuration

API endpoints are configured in environment files and automatically switch based on the deployment environment.

## 🔄 Addon Interop (WK1 Codes)

wowkeyb-fe supports importing/exporting addon share codes in `WK1:...` format.

### Web -> Addon

1. Build or edit a keybinding in wowkeyb-fe.
2. Use **Export for Addon** to copy a `WK1:...` code.
3. In WoW addon, import the code and **Apply Profile**.
4. Addon applies keybindings and creates/reuses macros in game.

### Addon -> Web

1. In WoW addon, export a profile to a `WK1:...` code.
2. In wowkeyb-fe, open **Import from Addon** and paste the code.
3. Choose whether to update an existing keybinding with the same name or create a copy.

## 🎨 UI Components

The application uses the Fuse admin template with custom components:

- **Navigation**: Responsive sidebar navigation
- **Forms**: Keybinding creation and editing forms
- **Tables**: Keybinding listings and management
- **Modals**: Confirmation dialogs and forms
- **Cards**: Keybinding display cards

## 🌐 Internationalization

The application supports multiple languages:

- **English** (default)
- **Turkish**

Language files are located in `public/i18n/` and can be extended for additional languages.

## 🧪 Testing

```bash
# Unit tests
ng test

# End-to-end tests
ng e2e

# Test coverage
ng test --code-coverage
```

## 📖 Documentation

- **`docs/DEPLOYMENT.md`** - Detailed deployment guide
- **`CREDITS`** - Credits and acknowledgments
- **`LICENSE.md`** - License information

## 🔗 Related Projects

- **Backend**: [wowkeyb-be](../wowkeyb-be) - Node.js/Express API
- **Documentation**: See backend README for API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
