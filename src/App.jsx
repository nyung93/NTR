import BudgetView from './budget/BudgetView';
import { useSyncedState } from './useSyncedState';
import { useTripDocument } from './useTripDocument';
import { useAccountTrips, createTrip } from './useAccountTrips';
import ShareTripDialog from './ShareTripDialog';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import AdminView from './AdminView';
import { initialLedger } from './budget/model';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet,
  PlaneTakeoff, 
  PlaneLanding, 
  Building2, 
  CalendarDays, 
  MapPin, 
  ChevronRight,
  Menu,
  Home,
  Map,
  Luggage,
  Sparkles,
  Check,
  X,
  BookOpen,
  Info,
  ThumbsUp,
  BedDouble,
  Utensils,
  ShoppingBag,
  Camera,
  Coffee,
  Car,
  Flag,
  Navigation,
  Pencil,
  Trash2,
  Share2,
  Users,
} from 'lucide-react';

export const tripData = {
  title: "나트랑 여행 계획",
  dates: "2027.03.04 - 03.09",
  passengers: "일반석 2석",
  flights: [
    {
      type: "departure",
      airline: "에어부산",
      flightNumber: "BX0103",
      departure: {
        airport: "인천 (ICN)",
        date: "2027.03.04(목)",
        time: "16:50"
      },
      arrival: {
        airport: "나트랑 (CXR)",
        date: "2027.03.04(목)",
        time: "20:40"
      },
      duration: "3시간 50분 소요"
    },
    {
      type: "return",
      airline: "에어부산",
      flightNumber: "BX0104",
      departure: {
        airport: "나트랑 (CXR)",
        date: "2027.03.08(월)",
        time: "21:40"
      },
      arrival: {
        airport: "인천 (ICN)",
        date: "2027.03.09(화)",
        time: "05:05"
      },
      duration: "5시간 25분 소요"
    }
  ],
  hotels: [
    {
      name: "사타 호텔 나트랑 (Sata Hotel)",
      location: "나트랑 시내",
      checkIn: "2027.03.04(목)",
      checkOut: "2027.03.05(금)",
      imageUrl: "/images/sata-hotel.png"
    },
    {
      name: "퓨전 리조트 깜란 (Fusion Resort Cam Ranh)",
      location: "나트랑, 베트남",
      checkIn: "2027.03.05(금)",
      checkOut: "2027.03.08(월)",
      imageUrl: "/images/fusion-resort.png"
    }
  ]
};

const spaCategories = [
  {
    id: 'body',
    name: '바디 리추얼',
    items: [
      { id: 'dt', name: '딥 티슈 마사지', time: '50분', pressure: '중~강', desc: '팔꿈치 기술과 실리콘 컵을 사용해 통증 유발점을 치료하고 혈액 순환을 돕는 근육 이완 테라피', recommendReason: '평소 운동을 즐기거나 결림이 심한 분들께 최적. 압이 확실하고 시원하다는 평이 많습니다.' },
      { id: 'sw', name: '스웨디시 마사지', time: '50분', pressure: '약~강', desc: '혈액 순환을 도와 뭉친 근육과 관절을 부드럽게 하고 심층 근육 회복을 돕습니다' },
      { id: 'tf', name: '타이 퓨전 마사지', time: '50분', pressure: '중~강', desc: '오일을 사용하지 않고 관절을 유연하게 하는 스트레칭 위주의 타이 전통 마사지' },
      { id: 'af', name: '아비앙가 포핸드 마사지', time: '50분', cost: 2, pressure: '약~강', desc: '두 명의 테라피스트(네 손)가 라벤더 오일을 사용하여 피로를 풀고 졸음을 유도합니다' },
      { id: 'ft', name: '퓨전 터치', time: '30분', pressure: '약~강', desc: '일자목으로 인한 경추 통증, 두통, 자세 불균형 개선을 돕는 섬세한 마사지' },
      { id: 'of', name: '오리엔탈 발 마사지', time: '30분', pressure: '중~강', desc: '반사 요법 원리를 기반으로 발 신경의 특징 지점을 자극해 몸의 균형을 회복' },
      { id: 'ts', name: '텐션 수더', time: '30분', pressure: '중~강', desc: '등, 목, 어깨 전용으로 따뜻한 수건과 스웨덴식, 딥티슈 마사지를 결합해 근육통 완화' },
      { id: 'cn', name: '치 네이 짱 복부', time: '30분', pressure: '약~중', desc: '허브 볼을 사용해 소화 기능을 개선하고 면역 체계를 강화하는 복부 마사지' },
    ]
  },
  {
    id: 'wellness',
    name: '웰니스 저니',
    items: [
      { id: 'sb', name: '슬립 밸런스', time: '100분', cost: 2, pressure: '부드러움', desc: '싱잉볼 소리 테라피, 머리/얼굴 반사 마사지, 아로마테라피 결합으로 깊은 수면 유도' }
    ]
  },
  {
    id: 'treatment',
    name: '트리트먼트',
    items: [
      { id: 'bb', name: '블리스풀 뱀부', time: '50분', pressure: '중~강', desc: '따뜻한 대나무 온기를 이용해 독소를 배출하고 체온을 올려 경직된 근육을 녹여주는 테라피', recommendReason: '시그니처 프로그램. 뻐근한 근육이 깊숙이 풀리고 온열감으로 피로가 노곤하게 풀리는 가장 인기 있는 코스입니다.' },
      { id: 'hs', name: '히말라얀 핑크 솔트', time: '50분', pressure: '부드러움', desc: '특별한 미네랄 천연 핑크 솔트 스톤의 온열과 파동으로 에너지 충전 및 중추신경 균형 회복', recommendReason: '자극 없이 따뜻하게 몸을 풀어주어 힐링 위주의 관리를 원하는 분들께 만족도가 매우 높습니다.' },
      { id: 'na', name: '내추럴 리빙 아로마', time: '50분', pressure: '약~중', desc: '유기농 허브 블렌딩 아로마 오일을 사용해 몸과 마음을 평온하게 하는 동서양 결합 테라피' },
      { id: 'vt', name: '베트남 전통 트리트먼트', time: '50분', pressure: '중~강', desc: '정체된 림프 순환을 도와 노폐물과 붓기, 부종을 제거하는 디톡스 마사지' },
    ]
  },
  {
    id: 'facial',
    name: '페이셜',
    items: [
      { id: 'sr', name: '수딩 & 리쥬베네이팅', time: '50분', desc: '알로에 베라를 사용하여 자외선으로 붉고 예민해진 피부를 빠르게 진정시키고 수분 충전' },
      { id: 'ofc', name: '오가닉 페이셜', time: '50분', desc: '요구르트, 알로에, 꿀, 검은깨 등 식용 가능한 천연 혼합물로 피부를 상쾌하게 회복' },
      { id: 'ca', name: '크라이오 안티에이징', time: '50분', desc: '냉각된 유리볼로 즉각적인 쿨링 효과를 주어 얼굴 윤곽을 잡아주고 붓기와 트러블 진정', recommendReason: '수영장이나 해변에서 달아오른 얼굴 열감을 즉각 식혀줍니다. 바디 대신 1회쯤 전환용으로 추천합니다.' },
      { id: 'gf', name: '젠틀맨 페이셜', time: '50분', desc: '남성 전용으로 모공 청소, 묵은 각질 제거 및 강력한 수분을 공급하는 맨 트리트먼트' },
      { id: 'rr', name: '리프레시 & 리차지', time: '30분', desc: '시어버터, 카렌듈라 성분으로 깊은 모공을 청소해 지친 피부에 활력 제공' },
      { id: 'jr', name: '제이드 롤러 페이스 리프트', time: '30분', desc: '천연 옥의 파동으로 늘어난 모공 수축, 노화 피부 잔주름 완화 및 탄력 회복' },
    ]
  },
  {
    id: 'mother',
    name: '임산부',
    items: [
      { id: 'pm', name: '산전 마사지', time: '50분', pressure: '약~중', desc: '태아와 엄마에게 안전한 맞춤 마사지로, 다리 부종과 신체적 부담 완화' },
      { id: 'sf', name: '부드러운 발 마사지', time: '50분', pressure: '약~중', desc: '임산부를 위한 전용 발 마사지로 부드러운 테크닉을 통해 발의 긴장과 부종 이완' },
      { id: 'hns', name: '머리, 목, 어깨 마사지', time: '30분', pressure: '약~중', desc: '임산부의 경직된 상체를 안전하게 이완시키고 순환을 돕는 마사지' },
    ]
  },
  {
    id: 'beauty',
    name: '뷰티/손발',
    items: [
      { id: 'cm', name: '클래식 매니/페디큐어', time: '각 50분', desc: '큐티클 케어, 가벼운 마사지, 발톱/손톱 정돈 및 보습 케어' },
      { id: 'tc', name: '시트러스 바디 스무더', time: '30분', desc: '시트러스와 쌀을 활용한 각질 제거 블렌드로 부드럽고 빛나는 피부결 선사' },
      { id: 'dm', name: '디톡스 머드 랩', time: '30분', desc: '나트랑 천연 머드로 노폐물을 흡착하고 탄력을 회복 (알레르기, 건선 피부 적합)' },
      { id: 'as', name: '알로에 선 수더', time: '30분', desc: '강한 태양에 노출된 피부에 차가운 알로에 젤을 발라 발적 완화 및 빠른 진정' },
    ]
  }
];

const getMassageById = (id) => spaCategories.flatMap(c => c.items).find(i => i.id === id);

const defaultTripDays = [
  { id: 'day1', date: '3.04 (목)', day: '1일차' },
  { id: 'day2', date: '3.05 (금)', day: '2일차' },
  { id: 'day3', date: '3.06 (토)', day: '3일차' },
  { id: 'day4', date: '3.07 (일)', day: '4일차' },
  { id: 'day5', date: '3.08 (월)', day: '5일차' },
  { id: 'day6', date: '3.09 (화)', day: '6일차' }
];

const initialItinerary = {
  day1: [
    { id: '1-1', time: '16:50', category: 'flight', title: '에어부산 BX0103 출국', location: '인천국제공항', mapQuery: '인천국제공항' },
    { id: '1-2', time: '20:40', category: 'flight', title: '나트랑 깜란 공항 도착', location: '깜란 국제공항 (CXR)', mapQuery: 'Cam Ranh International Airport' },
    { id: '1-3', time: '21:30', category: 'hotel', title: '사타 호텔 (Sata Hotel) 체크인', location: '사타 호텔 나트랑', mapQuery: 'Sata Hotel Nha Trang' }
  ],
  day2: [
    { id: '2-1', time: '08:00', category: 'hotel', title: '사타 호텔 조식 및 체크아웃', location: '사타 호텔 나트랑', mapQuery: 'Sata Hotel Nha Trang' },
    { id: '2-2', time: '10:00', category: 'shopping', title: '담시장 쇼핑 (의류 구매)', location: '담시장', mapQuery: 'Dam Market Nha Trang' },
    { id: '2-3', time: '12:00', category: 'food', title: '마담프엉 점심 (반쎄오 등 현지식)', location: '마담프엉 나트랑', mapQuery: 'Madame Phuong Nha Trang' },
    { id: '2-4', time: '13:30', category: 'food', title: '제시 프루츠 앤 카페 (망고빙수, 에그타르트 포장)', location: '제시 프루츠 앤 카페', mapQuery: 'Jessie Fruits and Cafe Nha Trang' },
    { id: '2-5', time: '14:30', category: 'shopping', title: '롯데마트 장보기 (포트/그린 와인, 간식)', location: '롯데마트 나트랑점', mapQuery: 'Lotte Mart Nha Trang' },
    { id: '2-6', time: '15:00', category: 'transport', title: '신토반 과일 구매 후 깜란 이동', location: '나트랑 시내', mapQuery: 'Nha Trang' },
    { id: '2-7', time: '15:40', category: 'hotel', title: '퓨전 리조트 체크인', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '2-8', time: '16:30', category: 'rest', title: '[1회 차 스파]', location: '마이아 스파 (퓨전 리조트 내)', mapQuery: 'Fusion Resort Cam Ranh', isSpa: true },
    { id: '2-9', time: '19:00', category: 'food', title: '프라이빗 풀 와인 세팅 & 배달K 저녁 식사', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' }
  ],
  day3: [
    { id: '3-1', time: '07:30', category: 'rest', title: '요가 파빌리온 아침 요가', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '3-2', time: '08:30', category: 'food', title: '리조트 조식', location: '프레시 레스토랑', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '3-3', time: '11:00', category: 'sightseeing', title: '메인 풀 & 프라이빗 풀 물놀이', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '3-4', time: '16:00', category: 'rest', title: '[2회 차 스파]', location: '마이아 스파', mapQuery: 'Fusion Resort Cam Ranh', isSpa: true },
    { id: '3-5', time: '18:30', category: 'food', title: '레스토랑 야경 보며 저녁 식사', location: '프레시 레스토랑', mapQuery: 'Fusion Resort Cam Ranh' }
  ],
  day4: [
    { id: '4-1', time: '08:30', category: 'food', title: "늦잠 후 '애니웨어 애니타임' 조식 서비스 이용", location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '4-2', time: '10:00', category: 'rest', title: '피트니스 센터 가벼운 운동 (인클라인 트레드밀 등)', location: '퓨전 리조트 피트니스 센터', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '4-3', time: '11:30', category: 'transport', title: '환복 후 그랩 또는 대절 차량으로 아이리조트 출발', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '4-4', time: '12:45', category: 'rest', title: '아이리조트 도착 및 머드스파 진행', location: '아이리조트 나트랑', mapQuery: 'I-Resort Nha Trang' },
    { id: '4-5', time: '15:00', category: 'food', title: '세안 후 시내 이동 및 점심 식사 (촌촌킴, 퍼홍 등)', location: '나트랑 시내', mapQuery: 'Nha Trang' },
    { id: '4-6', time: '16:30', category: 'transport', title: '시내에서 차량을 타고 퓨전 리조트로 복귀', location: '나트랑 시내', mapQuery: 'Nha Trang' },
    { id: '4-7', time: '17:45', category: 'rest', title: '프라이빗 풀에서 물놀이하며 휴식 (무료 마사지는 출국 전날 이용)', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '4-8', time: '19:00', category: 'food', title: '배달K 풀사이드 디너 (반미, 숯불 꼬치구이 등)', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' }
  ],
  day5: [
    { id: '5-1', time: '08:30', category: 'rest', title: '조식 및 프라이빗 풀 마지막 수영', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '5-2', time: '12:30', category: 'food', title: '배달K 또는 룸서비스 점심 식사', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '5-3', time: '16:40', category: 'hotel', title: '짐 정리, 사전 체크아웃 및 캐리어 보관', location: '퓨전 리조트 프론트', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '5-4', time: '17:00', category: 'rest', title: '[3회 차 스파]', location: '마이아 스파', mapQuery: 'Fusion Resort Cam Ranh', isSpa: true },
    { id: '5-5', time: '17:50', category: 'rest', title: '스파 샤워 시설 이용 및 출국용 환복', location: '마이아 스파', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '5-6', time: '18:30', category: 'food', title: '레스토랑에서 여유로운 마지막 저녁', location: '프레시 레스토랑', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '5-7', time: '19:20', category: 'transport', title: '캐리어 수령 후 공항 샌딩 차량 탑승', location: '퓨전 리조트 로비', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '5-8', time: '20:00', category: 'flight', title: '깜란 국제공항 도착 및 수속', location: '깜란 국제공항 (CXR)', mapQuery: 'Cam Ranh International Airport' },
    { id: '5-9', time: '21:40', category: 'flight', title: '에어부산 BX0104 귀국', location: '깜란 국제공항 (CXR)', mapQuery: 'Cam Ranh International Airport' }
  ],
  day6: [
    { id: '6-1', time: '05:05', category: 'flight', title: '인천국제공항 도착', location: '인천국제공항', mapQuery: '인천국제공항' },
    { id: '6-2', time: '06:00', category: 'finish', title: '한국 도착, 즐거운 여행 끝! 👋', location: '', mapQuery: '' }
  ]
};

const getCategoryMeta = (type) => {
  switch(type) {
    case 'flight': return { Icon: PlaneTakeoff, color: 'text-[#326789]', bg: 'bg-[#326789]', lightBg: 'bg-[#326789]/10', text: '비행' };
    case 'hotel': return { Icon: BedDouble, color: 'text-[#6250B5]', bg: 'bg-[#6250B5]', lightBg: 'bg-[#6250B5]/10', text: '숙소' };
    case 'food': return { Icon: Utensils, color: 'text-gray-800', bg: 'bg-[#F4EAC9]', lightBg: 'bg-[#F4EAC9]/40', text: '식사' };
    case 'shopping': return { Icon: ShoppingBag, color: 'text-[#6C5498]', bg: 'bg-[#6C5498]', lightBg: 'bg-[#6C5498]/10', text: '쇼핑' };
    case 'sightseeing': return { Icon: Camera, color: 'text-[#6250B5]', bg: 'bg-[#6250B5]', lightBg: 'bg-[#6250B5]/10', text: '관광' };
    case 'rest': return { Icon: Coffee, color: 'text-[#326789]', bg: 'bg-[#326789]', lightBg: 'bg-[#326789]/10', text: '휴식' };
    case 'transport': return { Icon: Car, color: 'text-gray-600', bg: 'bg-gray-200', lightBg: 'bg-gray-100', text: '이동' };
    case 'finish': return { Icon: Flag, color: 'text-[#6C5498]', bg: 'bg-[#6C5498]', lightBg: 'bg-[#6C5498]/10', text: '완료' };
    default: return { Icon: MapPin, color: 'text-gray-500', bg: 'bg-gray-500', lightBg: 'bg-gray-50', text: '일정' };
  }
};

const getTravelTime = (from, to) => {
  if(!from || !to || from === to) return null;
  
  const isCity = (loc) => ['사타', '담시장', '마담프엉', '제시', '롯데마트', '시내', '빈산'].some(k => loc.includes(k));
  const isResort = (loc) => loc.includes('퓨전');
  const isAirport = (loc) => loc.includes('공항');

  if (isCity(from) && isCity(to)) return '약 5~10분 소요';
  if ((isAirport(from) && isCity(to)) || (isCity(from) && isAirport(to))) return '약 45분 소요';
  if ((isAirport(from) && isResort(to)) || (isResort(from) && isAirport(to))) return '약 10분 소요';
  if ((isCity(from) && isResort(to)) || (isResort(from) && isCity(to))) return '약 35분 소요';
  
  return '약 10~15분 소요'; 
};

const FlightCard = ({ flight, onEdit, onDelete }) => {
  const isDeparture = flight.type === "departure";
  
  return (
    <div className="flight-card bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-full ${isDeparture ? 'bg-[#326789]/10 text-[#326789]' : 'bg-[#6250B5]/10 text-[#6250B5]'}`}>
            {isDeparture ? <PlaneTakeoff size={20} /> : <PlaneLanding size={20} />}
          </div>
          <div>
            <span className="text-[13px] font-bold text-gray-500">{isDeparture ? '출국편' : '귀국편'}</span>
            <h4 className="font-semibold text-gray-900 text-[15px] mt-0.5">{flight.airline} {flight.flightNumber}</h4>
          </div>
        </div>
        <div className="overview-card-actions"><button type="button" onClick={onEdit} aria-label="항공편 수정"><Pencil size={16}/></button><button type="button" onClick={onDelete} aria-label="항공편 삭제"><Trash2 size={16}/></button></div>
      </div>

      <div className="flex justify-between items-center relative">
        <div className="text-center w-[30%]">
          <p className="text-2xl font-bold text-gray-900">{flight.departure.time}</p>
          <p className="text-[15px] font-semibold text-gray-600 mt-1">{flight.departure.airport}</p>
          <p className="text-[13px] text-gray-400 mt-0.5">{flight.departure.date}</p>
        </div>

        <div className="w-[40%] flex flex-col items-center justify-center px-2">
          <p className="text-[13px] text-gray-400 mb-1">{flight.duration}</p>
          <div className="w-full flex items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
            <div className="flex-1 h-[2px] bg-gray-200 border-t-2 border-dashed border-gray-300"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-[#6250B5]"></div>
          </div>
        </div>

        <div className="text-center w-[30%]">
          <p className="text-2xl font-bold text-gray-900">{flight.arrival.time}</p>
          <p className="text-[15px] font-semibold text-gray-600 mt-1">{flight.arrival.airport}</p>
          <p className="text-[13px] text-gray-400 mt-0.5">{flight.arrival.date}</p>
        </div>
      </div>
    </div>
  );
};

const HotelCard = ({ hotel, onEdit, onDelete }) => {
  return (
    <div className="hotel-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <img
        className="hotel-photo"
        src={hotel.imageUrl || '/images/hotel-illustration.webp'}
        alt={`${hotel.name} 숙소 전경`}
        loading="lazy"
        decoding="async"
        onError={event => { event.currentTarget.src = '/images/hotel-illustration.webp'; }}
      />
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[13px] font-bold text-[#6250B5] bg-[#6250B5]/10 px-2 py-1 rounded-full">숙소</span>
            <h3 className="font-bold text-gray-900 mt-2.5 text-lg">{hotel.name}</h3>
          </div><div className="overview-card-actions"><button type="button" onClick={onEdit} aria-label="숙소 수정"><Pencil size={16}/></button><button type="button" onClick={onDelete} aria-label="숙소 삭제"><Trash2 size={16}/></button></div>
        </div>
        
        <div className="flex items-start space-x-1.5 text-gray-500 text-[15px] mb-5 mt-1">
          <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
          <p>{hotel.location}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-3.5 flex justify-between items-center border border-gray-100">
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-gray-400 mb-1">체크인</p>
            <p className="text-[15px] font-bold text-gray-800">{hotel.checkIn}</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 mx-2" />
          <div className="flex-1 text-right">
            <p className="text-[13px] font-semibold text-gray-400 mb-1">체크아웃</p>
            <p className="text-[15px] font-bold text-gray-800">{hotel.checkOut}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ItineraryView = ({ itinerary, setItinerary, massageSchedule, days: tripDays = defaultTripDays }) => {
  const [selectedDay, setSelectedDay] = useState(tripDays === defaultTripDays ? 'day2' : tripDays[0]?.id);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newSchedule, setNewSchedule] = useState({ time: '12:00', title: '', category: 'food', location: '' });

  const handleMapOpen = (query) => {
    if(!query) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const openAdd = () => {
    setEditingId(null);
    setNewSchedule({ time: '12:00', title: '', category: 'food', location: '' });
    setIsAddModalOpen(true);
  };

  const openEdit = item => {
    setEditingId(item.id);
    setNewSchedule({ time: item.time, title: item.title, category: item.category, location: item.location || '', isSpa: item.isSpa || false });
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = () => {
    if (!newSchedule.title.trim() || !newSchedule.time) return;
    const newItem = {
      id: editingId || crypto.randomUUID(),
      time: newSchedule.time,
      title: newSchedule.title.trim(),
      category: newSchedule.category,
      location: newSchedule.location,
      mapQuery: newSchedule.location,
      ...(newSchedule.isSpa ? { isSpa: true } : {}),
    };
    setItinerary(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []).filter(item => item.id !== editingId), newItem].sort((a, b) => a.time.localeCompare(b.time))
    }));
    setIsAddModalOpen(false);
  };

  const handleDelete = item => {
    if (!window.confirm(`“${item.title}” 일정을 삭제할까요?`)) return;
    setItinerary(prev => ({ ...prev, [selectedDay]: (prev[selectedDay] || []).filter(entry => entry.id !== item.id) }));
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="px-5 pt-2 pb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">상세 일정표</h2>
        <p className="text-[13px] font-medium text-gray-500 mb-4">지도 버튼으로 각 장소를 확인할 수 있습니다.</p>
        
        <div className="day-tabs" role="group" aria-label="여행 날짜">
          {tripDays.map((day) => (
            <button key={day.id} type="button" aria-pressed={selectedDay === day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`day-tab ${selectedDay === day.id ? 'active' : ''}`}>
              <span className="day-tab-number">{day.day}</span>
              <span className="day-tab-date">{day.date}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="itinerary-body flex-1 bg-white rounded-t-3xl border-t border-gray-100 p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] overflow-y-auto pb-safe-area">
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[64px] top-4 bottom-4 w-[2px] bg-gray-100 z-0"></div>

          {!itinerary[selectedDay]?.length && <p className="empty-day">등록된 일정이 없습니다. 아래 버튼으로 일정을 추가하세요.</p>}
          {itinerary[selectedDay]?.map((item, index) => {
            const { Icon, color, bg, lightBg, text } = getCategoryMeta(item.category);
            const nextItem = itinerary[selectedDay][index + 1];
            const travelTime = nextItem ? getTravelTime(item.location, nextItem.location) : null;

            let displayTitle = item.title;
            if (item.isSpa) {
              const dayIndex = tripDays.findIndex(d => d.id === selectedDay);
              const daySchedule = massageSchedule[dayIndex] || {};
              const minName = daySchedule['민영'] ? getMassageById(daySchedule['민영'])?.name : null;
              const damiName = daySchedule['다미'] ? getMassageById(daySchedule['다미'])?.name : null;

              if (minName || damiName) {
                displayTitle = (
                  <div className="flex flex-col mt-0.5">
                    <span className="text-[15px] font-bold text-gray-900">{item.title}</span>
                    <span className="text-[13px] font-bold text-[#6C5498] mt-1.5 bg-[#6C5498]/10 px-2 py-1 rounded-lg w-fit border border-[#6C5498]/20">
                      민영: {minName || '미정'} / 다미: {damiName || '미정'}
                    </span>
                  </div>
                );
              } else {
                displayTitle = (
                  <div className="flex flex-col mt-0.5">
                    <span className="text-[15px] font-bold text-gray-900">{item.title}</span>
                    <span className="text-[13px] font-medium text-gray-400 mt-1">스파 계획에서 프로그램을 선택하세요</span>
                  </div>
                );
              }
            } else {
              displayTitle = <span className="text-[15px] font-bold text-gray-900 leading-snug">{item.title}</span>;
            }

            return (
              <div key={item.id} className="relative z-10 mb-2">
                <div className="flex items-start">
                  <div className="schedule-time w-[42px] shrink-0 pt-2.5 text-right">
                    <span className="text-[13px] font-bold text-gray-800 tracking-tighter">{item.time}</span>
                  </div>

                  <div className="flex flex-col items-center mx-3 relative z-10 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lightBg} shadow-sm border-2 border-white ring-1 ring-gray-100`}>
                      <Icon size={14} className={color} />
                    </div>
                  </div>

                  <div className="schedule-card min-w-0 flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl p-3 hover:border-[#6250B5]/30 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[13px] font-bold px-1.5 py-0.5 rounded flex items-center w-max mb-1.5 ${lightBg} ${color}`}>
                          {text}
                        </span>
                        <div className="pr-2">{displayTitle}</div>
                      </div>
                      
                      {item.mapQuery && (
                        <button 
                          onClick={() => handleMapOpen(item.mapQuery)}
                          className="p-1.5 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
                        >
                          <Navigation size={14} />
                        </button>
                      )}
                      <div className="schedule-actions"><button type="button" aria-label={`${item.title} 수정`} onClick={() => openEdit(item)}><Pencil size={14}/></button><button type="button" aria-label={`${item.title} 삭제`} onClick={() => handleDelete(item)}><Trash2 size={14}/></button></div>
                    </div>
                    
                    {item.location && (
                      <div className="flex items-center text-gray-500 mt-2 text-[13px] font-medium">
                        <MapPin size={11} className="mr-1 text-gray-400" />
                        <span className="line-clamp-1">{item.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {travelTime && (
                  <div className="flex items-center ml-[64px] pl-4 my-1 h-5">
                    <div className="flex items-center bg-gray-50 px-2 py-0.5 rounded-full border border-dashed border-gray-200">
                      <Car size={10} className="text-gray-400 mr-1" />
                      <span className="text-[13px] font-semibold text-gray-500">{travelTime}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Button - Match Design Guide Buttons */}
        <div className="ml-[64px] pl-4 mt-6 mb-4">
          <button 
            onClick={openAdd}
            className="w-full border border-dashed border-gray-300 rounded-2xl py-3 flex items-center justify-center text-gray-400 hover:border-[#6250B5] hover:text-[#6250B5] hover:bg-[#6250B5]/5 transition-all font-bold text-[15px]"
          >
            + 이 시간에 일정 추가
          </button>
        </div>
      </div>

      {/* Add Schedule Modal Popup - Match Popup Guide */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              {editingId ? '일정 수정' : '일정 추가'}
            </h3>
            
            {/* Input Fields matching UI guide (focus border) */}
            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">시간</label>
                <input 
                  type="time" 
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] font-bold text-gray-900 focus:outline-none focus:border-[#6250B5] focus:ring-1 focus:ring-[#6250B5] transition-all"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">카테고리</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {id: 'food', text: '식사', icon: Utensils}, 
                    {id: 'sightseeing', text: '관광', icon: Camera}, 
                    {id: 'rest', text: '휴식', icon: Coffee}, 
                    {id: 'shopping', text: '쇼핑', icon: ShoppingBag},
                    {id: 'transport', text: '이동', icon: Car}
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewSchedule({...newSchedule, category: cat.id})}
                      className={`flex items-center px-3 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                        newSchedule.category === cat.id 
                        ? 'bg-[#6250B5] text-white shadow-md shadow-[#6250B5]/20' 
                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <cat.icon size={12} className="mr-1" />
                      {cat.text}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">일정명 (필수)</label>
                <input 
                  type="text" 
                  placeholder="예: 해산물 식당에서 저녁"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:outline-none focus:border-[#6250B5] focus:ring-1 focus:ring-[#6250B5] transition-all"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">장소 (선택, 구글맵 연동)</label>
                <input 
                  type="text" 
                  placeholder="예: 빈산 해산물"
                  value={newSchedule.location}
                  onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:outline-none focus:border-[#6250B5] focus:ring-1 focus:ring-[#6250B5] transition-all"
                />
              </div>
              <label className="spa-event-toggle"><input type="checkbox" checked={Boolean(newSchedule.isSpa)} onChange={e => setNewSchedule({ ...newSchedule, isSpa: e.target.checked })}/> 스파 일정으로 표시</label>
            </div>

            {/* Modal Actions matching UI Guide */}
            <div className="flex space-x-2 mt-6">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-3 rounded-xl text-[15px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleAddSubmit}
                disabled={!newSchedule.title.trim() || !newSchedule.time}
                className="flex-1 py-3 rounded-xl text-[15px] font-bold text-white bg-gray-900 hover:bg-black disabled:bg-gray-300 transition-colors"
              >
                {editingId ? '수정 저장' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MassageView = ({ schedule, setSchedule }) => {
  const [modalMode, setModalMode] = useState(null);
  const [modalContext, setModalContext] = useState({ dayIndex: null, person: null });
  const [activeCategory, setActiveCategory] = useState(spaCategories[0].id);

  const persons = ['민영', '다미'];
  const maxCredits = 3;
  const selectedCredits = { '민영': 0, '다미': 0 };
  
  Object.keys(schedule).forEach(day => {
    persons.forEach(person => {
      const id = schedule[day]?.[person];
      if (id) {
        const m = getMassageById(id);
        selectedCredits[person] += (m?.cost || 1);
      }
    });
  });

  const openBrowseModal = () => {
    setModalMode('browse');
    setActiveCategory(spaCategories[0].id);
  };

  const openSelectModal = (dayIndex, person) => {
    setModalMode('select');
    setModalContext({ dayIndex, person });
    setActiveCategory(spaCategories[0].id);
  };

  const closeModal = () => setModalMode(null);

  const handleSelect = (massageId) => {
    if (modalMode !== 'select') return;
    
    const { dayIndex, person } = modalContext;
    setSchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [person]: massageId
      }
    }));
    closeModal();
  };

  const handleRemove = (dayIndex, person, e) => {
    e.stopPropagation();
    setSchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [person]: null
      }
    }));
  };

  const spaDays = defaultTripDays
    .map((day, index) => ({ ...day, originalIndex: index }))
    .filter(day => ['금', '토', '월'].some(d => day.date.includes(d)));

  return (
    <div className="p-5 animate-in fade-in duration-300 relative h-full">
      <div className="spa-heading flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
            <Sparkles size={22} className="mr-2 text-[#6250B5]" /> 
            스파 계획 (1인 3회)
          </h2>
          <p className="text-[13px] text-gray-500 font-medium">2회 차감 프로그램 유의, 일자별 선택</p>
        </div>
        <button 
          onClick={openBrowseModal}
          className="flex items-center text-[13px] font-bold text-[#326789] bg-[#326789]/10 px-3 py-1.5 rounded-full hover:bg-[#326789]/20 transition-colors shadow-sm"
        >
          <BookOpen size={18} className="mr-1" /> 전체 메뉴 보기
        </button>
      </div>

      <div className="flex gap-4 mb-5">
        {persons.map(person => (
          <div key={person} className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[15px] font-bold text-gray-900">{person}</span>
              <span className={`text-[15px] font-bold ${selectedCredits[person] >= maxCredits ? 'text-[#6250B5]' : 'text-gray-400'}`}>
                {selectedCredits[person]}/{maxCredits}회
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 flex overflow-hidden gap-0.5">
              {[...Array(maxCredits)].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-full transition-all duration-300 ${i < selectedCredits[person] ? 'bg-[#6250B5]' : 'bg-transparent'}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 pb-10">
        {spaDays.map((tripDay) => (
          <div key={tripDay.originalIndex} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-3">
              <span className="font-bold text-gray-900 text-[15px]">{tripDay.day} <span className="text-[13px] font-medium text-gray-400 ml-1">{tripDay.date}</span></span>
            </div>
            
            <div className="flex gap-3">
              {persons.map(person => {
                const selectedId = schedule[tripDay.originalIndex]?.[person];
                const selectedMassage = selectedId ? getMassageById(selectedId) : null;
                const isMaxReached = selectedCredits[person] >= maxCredits;
                
                return (
                  <div key={person} className="flex-1">
                    <span className="text-[13px] font-semibold text-gray-400 mb-1.5 block">{person}</span>
                    
                    <div 
                      onClick={() => (!selectedId && isMaxReached) ? null : openSelectModal(tripDay.originalIndex, person)}
                      className={`min-h-[96px] rounded-2xl p-2.5 flex flex-col justify-center relative transition-all ${
                        selectedMassage 
                          ? 'bg-[#6250B5]/5 border border-[#6250B5]/30 cursor-pointer shadow-sm' 
                          : isMaxReached
                            ? 'bg-gray-50 border border-gray-100 opacity-60 cursor-not-allowed'
                            : 'bg-white border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50'
                      }`}
                    >
                      {selectedMassage ? (
                        <>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-1 pr-4">{selectedMassage.name}</span>
                          </div>
                          <span className="text-[13px] font-medium text-gray-500 line-clamp-1">
                            {selectedMassage.time} {selectedMassage.pressure && `· ${selectedMassage.pressure}`}
                          </span>
                          {selectedMassage.cost === 2 && (
                            <span className="absolute bottom-2 right-2 text-[13px] font-bold bg-[#6C5498] text-white px-1.5 py-0.5 rounded shadow-sm">2회 차감</span>
                          )}
                          <button 
                            onClick={(e) => handleRemove(tripDay.originalIndex, person, e)}
                            className="absolute -top-1.5 -right-1.5 p-1 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-full shadow-sm z-10"
                          >
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 gap-1">
                          <Sparkles size={14} className={isMaxReached ? 'text-gray-300' : 'text-[#6250B5]/40'} />
                          <span className="text-[13px] font-medium">{isMaxReached ? '예약 완료' : '+ 스파 선택'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal} />
          <div role="dialog" aria-modal="true" aria-label="스파 메뉴" className="spa-dialog relative bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden mx-auto w-full">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  {modalMode === 'browse' ? '전체 스파 메뉴' : '스파 메뉴 선택'}
                </h3>
                {modalMode === 'select' && (
                  <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                    <span className="text-[#6250B5] font-bold">{modalContext.person}</span>의 {spaDays.find(d=>d.originalIndex === modalContext.dayIndex)?.day} 스파를 선택해주세요
                  </p>
                )}
              </div>
              <button aria-label="스파 메뉴 닫기" onClick={closeModal} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="spa-categories" role="group" aria-label="스파 카테고리">
              {spaCategories.map(cat => (
                <button 
                  key={cat.id} 
                  aria-pressed={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 ${
                    activeCategory === cat.id 
                      ? 'bg-[#6250B5] text-white shadow-md shadow-[#6250B5]/20' 
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3 pb-safe-area">
              <div className="bg-white rounded-xl p-3.5 flex items-start space-x-2.5 mb-4 border border-gray-100 shadow-sm">
                <Info size={14} className="text-[#6250B5] flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-gray-600 leading-snug">
                  1회 예약 시 1회권이 차감되며, <b className="text-[#6C5498]">[2회 차감]</b> 프로그램은 2회권이 차감됩니다. 잔여 횟수를 고려해 선택해주세요.
                </p>
              </div>

              {[...(spaCategories.find(c => c.id === activeCategory)?.items || [])]
                .sort((a, b) => (b.recommendReason ? 1 : 0) - (a.recommendReason ? 1 : 0))
                .map(item => {
                let isDisabled = false;
                if (modalMode === 'select') {
                  const currentSlotId = schedule[modalContext.dayIndex]?.[modalContext.person];
                  const currentCost = currentSlotId ? (getMassageById(currentSlotId)?.cost || 1) : 0;
                  const availableCredits = maxCredits - (selectedCredits[modalContext.person] - currentCost);
                  isDisabled = availableCredits < (item.cost || 1);
                }

                const isCurrentlySelectedInThisSlot = modalMode === 'select' && schedule[modalContext.dayIndex]?.[modalContext.person] === item.id;

                return (
                  <div 
                    key={item.id} 
                    onClick={() => !isDisabled && modalMode === 'select' ? handleSelect(item.id) : null}
                    className={`bg-white rounded-2xl p-4 border transition-all ${
                      isCurrentlySelectedInThisSlot
                        ? 'border-[#6250B5] shadow-md ring-1 ring-[#6250B5] bg-[#6250B5]/5'
                        : isDisabled && modalMode === 'select'
                          ? 'border-gray-100 opacity-60'
                          : modalMode === 'select' 
                            ? 'border-gray-200 shadow-sm hover:border-[#6250B5]/50 cursor-pointer'
                            : 'border-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900 text-[15px] flex items-center">
                        {item.name}
                        {item.recommendReason && (
                          <span className="ml-2 bg-[#F4EAC9]/40 text-gray-800 text-[13px] px-2 py-0.5 rounded-full font-bold flex items-center">
                            <ThumbsUp size={10} className="mr-1" /> 추천
                          </span>
                        )}
                      </h4>
                      {item.cost === 2 && (
                        <span className="text-[13px] font-bold bg-[#6C5498]/10 text-[#6C5498] px-2 py-0.5 rounded-full shrink-0 ml-2">2회 차감</span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[13px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        ⏱ {item.time}
                      </span>
                      {item.pressure && (
                        <span className="text-[13px] font-semibold px-2 py-0.5 rounded-full bg-[#326789]/10 text-[#326789]">
                          💪 압력: {item.pressure}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[13px] text-gray-500 leading-relaxed mb-3">{item.desc}</p>

                    {item.recommendReason && (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3">
                        <div className="flex items-center text-gray-900 font-bold text-[13px] mb-1.5">
                          <span className="bg-[#F4EAC9] text-gray-900 rounded px-1.5 py-0.5 text-[13px] mr-1.5 leading-tight shadow-sm">추천 사유</span>
                        </div>
                        <p className="text-[13px] text-gray-600 font-medium leading-snug">{item.recommendReason}</p>
                      </div>
                    )}
                    
                    {modalMode === 'select' && (
                      <button 
                        disabled={isDisabled}
                        className={`w-full py-3 rounded-xl text-[15px] font-bold transition-colors mt-2 ${
                          isCurrentlySelectedInThisSlot
                            ? 'bg-[#6250B5] text-white'
                            : isDisabled 
                              ? 'bg-gray-100 text-gray-400' 
                              : 'bg-gray-900 text-white hover:bg-black'
                        }`}
                      >
                        {isCurrentlySelectedInThisSlot ? '선택됨' : isDisabled ? '잔여 횟수 부족' : '이 메뉴로 선택하기'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


function TripWorkspace({ trip, trips, selectTrip, openAddTrip, uid, user, isAdmin, onTripDelete }) {
  const [activeTab, setActiveTab] = useState('home');
  const isNhaTrang = trip.legacyId === 'nha-trang' || trip.name === '나트랑';
  const [massageSchedule, setMassageSchedule, spaSync, spaError] = useTripDocument({ uid, tripId: trip.id, section: 'spa', initialValue: {}, legacyId: trip.legacyId, legacyKeys: [isNhaTrang ? 'ntr-spa-v1' : `trip-${trip.legacyId || trip.id}-spa-v1`] });
  const [itinerary, setItinerary, itinerarySync, itineraryError] = useTripDocument({ uid, tripId: trip.id, section: 'itinerary', initialValue: isNhaTrang ? initialItinerary : {}, legacyId: trip.legacyId, legacyKeys: [isNhaTrang ? 'ntr-itinerary-v2' : `trip-${trip.legacyId || trip.id}-itinerary-v1`] });
  const [overview, setOverview, overviewSync, overviewError] = useTripDocument({ uid, tripId: trip.id, section: 'overview', initialValue: isNhaTrang ? { flights: tripData.flights.map((item, index) => ({ ...item, id: item.id || `flight-${index}` })), hotels: tripData.hotels.map((item, index) => ({ ...item, id: item.id || `hotel-${index}` })) } : { flights: [], hotels: [] }, legacyId: trip.legacyId });
  const [ledger, setLedger, budgetSync, budgetError] = useTripDocument({ uid, tripId: trip.id, section: 'budget', initialValue: initialLedger(isNhaTrang), legacyId: trip.legacyId, legacyKeys: [`trip-${trip.legacyId || trip.id}-budget-v1`] });
  const [sharing, setSharing] = useState(false);
  const [editingTrip, setEditingTrip] = useState(false);
  const [editingOverview, setEditingOverview] = useState(null);
  const days = isNhaTrang ? defaultTripDays : makeTripDays(trip.start, trip.end);
  const dateLabel = `${trip.start.replaceAll('-', '.')} — ${trip.end.replaceAll('-', '.')}`;
  const duration = `${days.length - 1}박 ${days.length}일`;
  if ([itinerarySync, spaSync, overviewSync, budgetSync].some(status => status !== 'ready')) {
    const syncProblem = itineraryError || spaError || overviewError || budgetError;
    return <main className="auth-screen"><section className="auth-card"><h1>{syncProblem ? '여행 데이터 동기화 오류' : '여행 데이터 불러오는 중…'}</h1><p>{syncProblem || '잠시만 기다려 주세요.'}</p></section></main>;
  }
  const isOwner = trip.ownerUid === uid;
  const tripPicker = <div className="trip-picker"><label>여행지 선택<select value={trip.id} onChange={e => selectTrip(e.target.value)}>{trips.map(t => <option key={t.id} value={t.id}>{t.name}{t.ownerUid === uid ? ' · 내 여행' : ' · 공유됨'}</option>)}</select></label><button type="button" onClick={openAddTrip}>+ 여행 추가</button></div>;
  const tabs = [{id:'home', title:'여행 한눈에', icon:Home}, {id:'itinerary', title:'여행 일정', icon:CalendarDays}, {id:'budget', title:'예산·정산', icon:Wallet}, ...(isNhaTrang ? [{id:'massage', title:'스파 플래너', icon:Sparkles}] : [])];
  const navigation = tabs.map(({id,title,icon:Icon}) => <button key={id} aria-current={activeTab === id ? 'page' : undefined} onClick={() => { setActiveTab(id); window.scrollTo({ top: 0, behavior: 'instant' }); }} className={'nav-button ' + (activeTab === id ? 'selected' : '')}><Icon size={20}/><span>{title}</span>{activeTab === id && <ChevronRight size={16} className="nav-arrow"/>}</button>);
  const updateOverviewItem = (kind, item) => setOverview(previous => ({ ...previous, [kind]: (previous[kind] || []).some(row => row.id === item.id) ? previous[kind].map(row => row.id === item.id ? item : row) : [...(previous[kind] || []), item] }));
  const removeOverviewItem = (kind, item) => { if (window.confirm(`“${item.airline || item.name}” 정보를 삭제할까요?`)) setOverview(previous => ({ ...previous, [kind]: previous[kind].filter(row => row.id !== item.id) })); };
  const saveTrip = async fields => updateDoc(doc(db, 'trips', trip.id), { ...fields, updatedAt: serverTimestamp() });
  const deleteTrip = async () => {
    if (!window.confirm(`${trip.name} 여행과 저장된 일정·예산을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    try { await httpsCallable(functions, 'deleteTrip')({ tripId: trip.id }); await onTripDelete(trip.id); }
    catch { window.alert('여행 삭제에 실패했습니다. Firebase Functions가 배포됐는지 확인해 주세요.'); }
  };
  const commonOverview = <>
    {isNhaTrang ? <section className="hero"><div className="hero-shade"/><div className="hero-content"><span className="hero-label"><MapPin size={14}/> VIETNAM, NHA TRANG</span><h2>{trip.name} · {duration}</h2><p>휴식 · 호캉스</p><button onClick={() => setActiveTab('itinerary')}>일정 보기 <ChevronRight size={17}/></button></div></section> : <section className="new-trip-overview"><MapPin size={32}/><h2>{trip.name}</h2><p>{dateLabel} · {duration}</p><button className="primary-action" onClick={() => setActiveTab('itinerary')}>일정 보기 <ChevronRight size={17}/></button></section>}
    <section className="trip-stats"><div><CalendarDays/><span>여행 기간<strong>{duration}</strong></span></div><div><Luggage/><span>여행 인원<strong>{ledger.people.length}명 · {ledger.people.map(person => person.name).join(', ')}</strong></span></div><div><Building2/><span>숙소<strong>{overview.hotels.length ? overview.hotels.map(hotel => hotel.name).join(' · ') : '숙소를 추가하세요'}</strong></span></div><div><Users/><span>플래너 접근 계정<strong>{trip.memberUids?.length || 1}개 계정</strong></span></div></section>
    <div className="overview-grid"><section><div className="section-heading"><div><span className="eyebrow">FLIGHTS</span><h2>항공편</h2></div><PlaneTakeoff size={22}/></div>{overview.flights.map(flight => <FlightCard key={flight.id} flight={flight} onEdit={() => setEditingOverview({ kind: 'flight', item: flight })} onDelete={() => removeOverviewItem('flights', flight)}/>)}{!overview.flights.length && <p className="overview-empty">항공 정보를 추가해 주세요.</p>}<button className="overview-add-button" onClick={() => setEditingOverview({ kind: 'flight' })}>+ 항공편 추가</button><div className="travel-note"><Info size={17}/><span>출발·도착 시각은 각 공항 현지 시간 기준입니다.</span></div></section><section><div className="section-heading"><div><span className="eyebrow">STAYS</span><h2>숙소</h2></div><Building2 size={22}/></div>{overview.hotels.map(hotel => <HotelCard key={hotel.id} hotel={hotel} onEdit={() => setEditingOverview({ kind: 'hotel', item: hotel })} onDelete={() => removeOverviewItem('hotels', hotel)}/>)}{!overview.hotels.length && <p className="overview-empty">숙소 정보를 추가해 주세요.</p>}<button className="overview-add-button" onClick={() => setEditingOverview({ kind: 'hotel' })}>+ 숙소 추가</button></section></div>
    {isNhaTrang && <section className="spa-banner"><div className="spa-banner-icon"><Sparkles size={28}/></div><div><span className="eyebrow">SPA</span><h3>리조트 스파</h3><p>날짜별 프로그램과 이용 횟수를 확인하세요.</p></div><button onClick={() => setActiveTab('massage')}>스파 계획하기 <ChevronRight size={16}/></button></section>}
  </>;
  return <div className="app-shell">
    <aside className="sidebar"><a href="#" className="brand" onClick={() => setActiveTab('home')}><span className="brand-icon"><Navigation size={22}/></span> somewhere<span className="brand-dot">.</span></a>{tripPicker}<p className="sidebar-label">여행 메뉴</p><nav aria-label="주 메뉴">{navigation}{isAdmin && <button className={'nav-button ' + (activeTab === 'admin' ? 'selected' : '')} onClick={() => setActiveTab('admin')}><Users size={20}/><span>관리자</span></button>}</nav></aside>
    <main className="workspace"><header className="topbar"><span>나의 여행 <ChevronRight size={14}/> <strong>{trip.name}</strong></span><div className="trip-top-actions">{isAdmin && <button onClick={() => setActiveTab('admin')}>관리자</button>}<button onClick={() => setEditingTrip(true)}>여행 정보</button>{isOwner && <button onClick={() => setSharing(true)}><Share2 size={16}/> 공유</button>}</div></header><div className="mobile-trip-picker">{tripPicker}</div>
      {(itineraryError || spaError || overviewError || budgetError) ? <p className="cloud-sync-status error" role="alert">{itineraryError || spaError || overviewError || budgetError}</p> : <p className="cloud-sync-status">Firebase에 저장됨 · {trip.memberUids?.length || 1}명과 공유</p>}
      <section className="page-intro"><div className="page-title"><h1>{activeTab === 'home' ? `${trip.name} 여행 계획` : activeTab === 'itinerary' ? '여행 일정' : activeTab === 'budget' ? '예산·정산' : activeTab === 'admin' ? '관리자' : '스파 계획'}</h1></div><span className="trip-badge"><CalendarDays size={16}/> {dateLabel}</span></section>
      {activeTab === 'home' ? commonOverview : activeTab === 'admin' && isAdmin ? <AdminView uid={uid} onBack={() => setActiveTab('home')}/> : <section className="detail-panel">{activeTab === 'itinerary' ? <ItineraryView days={days} itinerary={itinerary} setItinerary={setItinerary} massageSchedule={massageSchedule}/> : activeTab === 'budget' ? <BudgetView trip={trip} ledger={ledger} setLedger={setLedger} syncStatus={budgetSync} syncError={budgetError}/> : <MassageView schedule={massageSchedule} setSchedule={setMassageSchedule}/>}</section>}
      <footer className="page-footer"><span>{trip.name} 여행 계획</span><span>{dateLabel}</span></footer>
    </main><nav className="mobile-nav" style={{gridTemplateColumns: `repeat(${tabs.length + (isAdmin ? 1 : 0)}, minmax(0, 1fr))`}} aria-label="모바일 메뉴">{navigation}{isAdmin && <button className={'nav-button ' + (activeTab === 'admin' ? 'selected' : '')} onClick={() => setActiveTab('admin')}><Users size={20}/><span>관리자</span></button>}</nav>
    {sharing && <ShareTripDialog trip={trip} uid={uid} close={() => setSharing(false)}/>}
    {editingTrip && <TripSettingsDialog trip={{...trip,currentUid:uid}} onClose={() => setEditingTrip(false)} busy={false} onSave={saveTrip} onDelete={deleteTrip}/>}
    {editingOverview && <DashboardItemEditor type={editingOverview.kind} item={editingOverview.item} onClose={() => setEditingOverview(null)} onSave={item => updateOverviewItem(editingOverview.kind === 'flight' ? 'flights' : 'hotels', item)}/>}
  </div>;
}

function makeTripDays(start, end) {
  const count = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.parse(start) + index * 86400000);
    return { id: `day${index + 1}`, day: `${index + 1}일차`, date: `${date.getUTCMonth() + 1}.${String(date.getUTCDate()).padStart(2, '0')} (${'일월화수목금토'[date.getUTCDay()]})` };
  });
}

function AddTripDialog({ onClose, onAdd }) {
  const dialog = useRef(null);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { dialog.current.showModal(); }, []);
  const submit = event => {
    event.preventDefault();
    if (!name.trim()) return setError('여행지를 입력하세요.');
    const count = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
    if (!Number.isFinite(count) || count < 1 || count > 90) return setError('여행 기간은 출발일부터 1~90일 사이로 선택하세요.');
    onAdd({ id: crypto.randomUUID(), name: name.trim(), start, end });
  };
  return <dialog ref={dialog} className="add-trip-dialog" aria-labelledby="add-trip-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <form onSubmit={submit}>
      <div className="add-trip-heading"><h2 id="add-trip-title">여행 추가</h2><button type="button" aria-label="여행 추가 닫기" onClick={onClose}><X size={22}/></button></div>
      <label>여행지<input autoFocus required maxLength={40} placeholder="예: 도쿄" value={name} onChange={e => setName(e.target.value)}/></label>
      <label>출발일<input required type="date" value={start} onChange={e => setStart(e.target.value)}/></label>
      <label>마지막 날<input required type="date" min={start} value={end} onChange={e => setEnd(e.target.value)}/></label>
      <p className="trip-storage-note">이 여행은 내 계정에 저장되며, 나중에 다른 계정과 공유할 수 있습니다.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <div className="add-trip-actions"><button type="button" onClick={onClose}>취소</button><button className="primary-action" type="submit">여행 만들기</button></div>
    </form>
  </dialog>;
}

export default function App({ user, uid = user?.uid, isAdmin = false }) {
  const { trips, status: tripsStatus, error: tripsError } = useAccountTrips(user || { uid, email: '' });
  const [selectedId, setSelectedId] = useSyncedState('travel-planner-selected-v1', 'nha-trang', uid, 'selected-trip');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [inviteError, setInviteError] = useState('');
  const inviteToken = new URLSearchParams(window.location.search).get('invite');
  const selected = trips.find(trip => trip.id === selectedId) || trips[0] || null;
  useEffect(() => {
    if (!inviteToken || !uid) return;
    httpsCallable(functions, 'acceptTripInviteLink')({ token: inviteToken }).then(result => {
      setSelectedId(result.data.tripId);
      window.history.replaceState({}, '', window.location.pathname);
      setInviteError('여행 초대를 수락했습니다.');
    }).catch(() => {
      setInviteError('초대 링크가 만료되었거나 초대 기능이 아직 배포되지 않았습니다.');
      window.history.replaceState({}, '', window.location.pathname);
    });
  }, [inviteToken, uid]);
  const addTrip = async trip => {
    try {
      const created = await createTrip(user || { uid, email: '' }, trip);
      setSelectedId(created.id);
      setAdding(false);
      setAddError('');
      window.scrollTo(0, 0);
    } catch (error) {
      setAddError(error.code === 'permission-denied' ? '여행을 만들 권한이 없습니다. Firestore 규칙을 확인해 주세요.' : '여행을 만들지 못했습니다. 네트워크를 확인해 주세요.');
    }
  };
  if (tripsError || tripsStatus !== 'ready') return <main className="auth-screen"><section className="auth-card"><h1>{tripsError ? 'Firebase 연결 확인 필요' : '여행 데이터 불러오는 중…'}</h1><p>{tripsError || '잠시만 기다려 주세요.'}</p></section></main>;
  if (!selected) return <main className="auth-screen"><section className="auth-card"><span className="auth-kicker">YOUR TRIPS</span><h1>여행을 시작해 보세요</h1><p>초대받은 여행은 링크를 열고 로그인하면 목록에 나타납니다.</p><button className="auth-submit" onClick={() => setAdding(true)}>여행 추가</button>{adding && <AddTripDialog onClose={() => setAdding(false)} onAdd={addTrip}/>}</section></main>;
  return <><TripWorkspace key={selected.id} trip={selected} trips={trips} uid={uid} user={user} isAdmin={isAdmin} selectTrip={id => { setSelectedId(id); window.scrollTo(0, 0); }} openAddTrip={() => setAdding(true)} onTripDelete={async deletedId => { const nextTrip = trips.find(trip => trip.id !== deletedId); if (nextTrip) setSelectedId(nextTrip.id); }}/>{(addError || inviteError) && <p className="form-error" role="status">{addError || inviteError}</p>}{adding && <AddTripDialog onClose={() => setAdding(false)} onAdd={addTrip}/>}</>;
}
