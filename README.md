# Typing Panda – Online Typing Practice & Learning App 🐼

**Typing Panda** is a browser-based typing practice application created by **Ujjwal Pratap**. It is designed to help learners practise typing, monitor speed and accuracy, and build consistency through timed tests and a friendly interface.

<https://typing-panda.web.app>

## What you can do

- Practise typing in timed sessions
- Choose from 15, 30, 60, and 120-second test presets
- View typing speed (WPM), accuracy, errors, and timer feedback
- Review local typing history and personal-best results
- Use optional Google sign-in through Firebase Authentication
- Explore the leaderboard interface and Firestore result integration

Some online features are still scaffolded. See **Current implementation notes** below before relying on account sync or leaderboard results.

## Technology stack

- React 18
- TypeScript
- Vite
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

## Run locally

Requirements: Node.js and npm.

```bash
git clone https://github.com/Ujjwalpratap001/typing-panda.git
cd typing-panda
npm install
npm run dev
```

Build the production version:

```bash
npm run build
npm run preview
```

## Firebase configuration

1. Create or open the Firebase project used by the app.
2. Configure the Firebase web app values in a local environment file based on `.env.example`.
3. Enable the required Authentication provider.
4. Review and deploy Firestore security rules before enabling online score storage.
5. Keep service-account keys and private credentials out of Git.

The Firebase web configuration is intended for browser apps, but it must be protected by correct Firebase Authentication and Firestore security rules.

## Current implementation notes

- Guest history and personal-best information are stored in the current browser.
- Google sign-in and Firestore result save/load require valid Firebase configuration.
- The leaderboard interface and query scaffolding are present; ranking data needs trusted score validation and suitable backend rules.
- Client-submitted typing scores should not be trusted without server-side validation.
- Guest results are not automatically synchronized to an account after a later sign-in.

## Deployment

The project includes Firebase Hosting configuration and GitHub Actions deployment support. Configure the required Firebase build secrets in the repository settings, review Firestore rules, build the app, and deploy to the intended Firebase project.

## About the Developer

**Ujjwal Pratap** is a B.Tech Computer Science Engineering student at GLA University, Mathura, and CEO of **AP Creative Studio**. He builds web applications and practical digital products while strengthening his skills in programming, problem solving, and product development.

- GitHub: [Ujjwalpratap001](https://github.com/Ujjwalpratap001)
- LinkedIn: [Ujjwal Pratap](https://www.linkedin.com/in/ujjwalpratap624604/)
- Personal portfolio: [ujjwal-portfolio](https://github.com/Ujjwalpratap001/ujjwal-portfolio)

## Feedback

Suggestions and bug reports are welcome through the repository’s GitHub Issues.
