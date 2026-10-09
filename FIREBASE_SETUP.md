# Firebase 설정과 이메일 공유

이 프로젝트는 Firebase Authentication과 Cloud Firestore만 사용합니다. Cloud Functions나 메일 발송 서버를 배포하지 않으므로 공유 기능에 Blaze 요금제가 필요하지 않습니다. 여행 소유자는 여행 정보에서 공유할 계정의 이메일 주소를 등록합니다. 등록된 이메일로 Firebase에 로그인한 사용자는 여행 일정과 예산을 보고 함께 수정할 수 있고, 여행 기본 정보와 항공·숙소 정보는 소유자만 변경할 수 있습니다.

From the project directory, install the Firebase CLI without a global npm install and deploy only the Firestore rules:

```sh
npx --yes firebase-tools@latest login
npx --yes firebase-tools@latest deploy --only firestore:rules
```

Enable Email/Password sign-in in Firebase Console under Authentication → Sign-in method. The Firestore database must already exist. Free-plan quotas and limits still apply; exceeding them may pause database operations until the quota resets or the project is upgraded.

공유는 이메일 주소를 문서의 허용 목록에 넣는 방식입니다. 앱이 초대 메일을 보내거나 주소 소유를 확인하지는 않습니다. 공유받는 사람은 등록된 주소와 동일한 이메일로 Firebase 계정을 만들고 로그인해야 합니다. 주소를 목록에서 제거하면 해당 계정의 접근이 해제됩니다. 여행마다 최대 20개 이메일을 등록할 수 있습니다. 외부 공개 전에는 이메일 소유 확인이 없다는 점을 고려해 인증 기능을 추가하세요. 공유 및 Google Maps 경로 링크에는 AI 토큰, Cloud Functions, 유료 경로 API가 필요하지 않습니다.

`firestore.rules`를 변경한 뒤 위 명령으로 규칙을 별도 배포해야 합니다. 웹사이트를 배포해도 Firestore 규칙은 자동으로 게시되지 않습니다. Firebase Authentication에서 이메일/비밀번호 로그인을 켜고, Firestore 규칙도 최신 버전인지 확인하세요. 관리자 전체 회원 목록과 접속 기록은 신뢰된 서버 권한이 필요하므로 클라이언트 전용 구성에는 포함되지 않습니다.
