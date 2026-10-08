# Firebase setup without Cloud Functions

This project uses Firebase Authentication and Cloud Firestore only. It does not deploy Cloud Functions, so the Firebase project can remain on the Spark plan. Each trip is visible only to Firebase Authentication UIDs listed on that trip. The owner manages the UID allowlist; listed members can view and collaborate on itinerary, budget, and spa data. Only the owner can change trip settings, dashboard flight/stay details, or delete the trip.

From the project directory, install the Firebase CLI without a global npm install and deploy only the Firestore rules:

```sh
npx --yes firebase-tools@latest login
npx --yes firebase-tools@latest deploy --only firestore:rules
```

Enable Email/Password sign-in in Firebase Console under Authentication → Sign-in method. The Firestore database must already exist. Free-plan quotas and limits still apply; exceeding them may pause database operations until the quota resets or the project is upgraded.

Sharing uses account UIDs rather than public invite links. A person must create an account and send their Firebase UID to the trip owner, who adds it under **여행 정보 → 여행 접근 UID**. The owner can remove a UID to revoke access. Each trip supports up to 20 UIDs. No AI token, Cloud Functions deployment, or paid route API is used for sharing or Google Maps directions.

After changing `firestore.rules`, publish the updated rules with the command above. Deploying the website does not publish Firestore rules automatically. Administrator-wide Auth user directories and login-access reports remain unavailable in this client-only build because they require privileged server access.
