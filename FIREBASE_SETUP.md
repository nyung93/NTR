# Firebase setup without Cloud Functions

This project uses Firebase Authentication and Cloud Firestore only. It does not deploy Cloud Functions, so the Firebase project can remain on the Spark plan. Trips, itineraries, budget records, and dashboard details are private to the signed-in account.

From the project directory, install the Firebase CLI without a global npm install and deploy only the Firestore rules:

```sh
npx --yes firebase-tools@latest login
npx --yes firebase-tools@latest deploy --only firestore:rules
```

Enable Email/Password sign-in in Firebase Console under Authentication → Sign-in method. The Firestore database must already exist. Free-plan quotas and limits still apply; exceeding them may pause database operations until the quota resets or the project is upgraded.

Trip sharing, invite links, administrator member directories, and login-access reports are unavailable in this no-billing build. Those need a trusted backend with privileged Firebase access.
