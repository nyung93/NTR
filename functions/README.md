# Firebase backend setup

This app uses Firebase Authentication, Firestore, and callable Cloud Functions. Deploy the Firestore rules and Functions before deploying the updated frontend; older rules do not allow the new `/trips` collection.

From the repository root, with the Firebase CLI installed and signed into the `trip-plan-13743` project:

```sh
firebase login
firebase deploy --only firestore:rules,functions
```

Cloud Functions deployment requires the Firebase project to use the Blaze plan and may incur usage charges. The project owner must enable billing in Firebase/Google Cloud before deploying Functions.

To grant the first administrator, use Google Cloud Application Default Credentials for a project administrator account, then run from `functions/`:

```sh
gcloud auth application-default login
npm install
npm run set-admin -- admin@example.com
```

Replace the email with the account that already registered in Firebase Authentication. Sign out and back into the app so Firebase refreshes the account's custom claim. Never put a service-account key in the repository or browser code.

The admin role is a Firebase Auth custom claim. Only an existing project administrator with privileged Google Cloud credentials can grant it. Admin trip detail views are recorded in `adminTripViews`.
