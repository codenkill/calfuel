# Macro Tracker

A modern web application for tracking your daily macro nutrients and meals. Built with Next.js, Firebase, and Tailwind CSS.

## Features

- 🔐 Secure user authentication
- 📊 Track calories, protein, carbs, and fat
- 🍽️ Create and manage your food database
- 📝 Log meals with multiple ingredients
- 📱 Responsive design works on all devices
- 🔄 Real-time updates
- 📈 View your meal history
- ⚡ Fast and reliable performance

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn
- Firebase account

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/macro-tracker.git
cd macro-tracker
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Firebase Setup

1. Create a new Firebase project
2. Enable Authentication (Email/Password and Google)
3. Create a Firestore database
4. Deploy the security rules from `firestore.rules`

## Project Structure

```
macro-tracker/
├── app/                    # Next.js app directory
│   ├── components/        # Reusable components
│   ├── dashboard/        # Dashboard pages
│   └── ...
├── lib/                   # Utilities and contexts
│   ├── context/          # React contexts
│   └── firebase.js       # Firebase configuration
├── public/               # Static files
└── ...
```

## Security

- All database access is protected by Firestore security rules
- Authentication state is managed securely
- Rate limiting is implemented to prevent abuse
- Data validation on both client and server

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@example.com or open an issue in the repository.
