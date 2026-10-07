import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './glass-theme.css';

// 1. 파이어베이스 DB 불러오기
import { db } from './firebase.js'; 
import { collection, addDoc } from "firebase/firestore";

// 2. 접속 시 자동으로 데이터를 저장하는 함수
async function autoSaveData() {
  try {
    const docRef = await addDoc(collection(db, "testLogs"), {
      message: "접속 시 자동 저장 테스트 완료",
      time: new Date()
    });
    console.log("✅ 자동 저장 성공! ID:", docRef.id);
  } catch (error) {
    console.error("❌ 자동 저장 실패:", error);
  }
}

// 3. 함수 즉시 실행
autoSaveData();

// 4. 화면 렌더링 (파일 맨 아래에 딱 한 번만 있어야 합니다)
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);