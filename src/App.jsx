import React, { useState, useEffect } from 'react';
import { 
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
  Navigation
} from 'lucide-react';

const tripData = {
  title: "나트랑 우정 여행 🌴",
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
      imageUrl: "/images/stay.svg"
    },
    {
      name: "퓨전 리조트 깜란 (Fusion Resort Cam Ranh)",
      location: "나트랑, 베트남",
      checkIn: "2027.03.05(금)",
      checkOut: "2027.03.08(월)",
      imageUrl: "/images/coast.svg"
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

const tripDays = [
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
    { id: '2-2', time: '10:00', category: 'shopping', title: '담시장 쇼핑 (봄 웜톤 원피스 득템!)', location: '담시장', mapQuery: 'Dam Market Nha Trang' },
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
    { id: '4-1', time: '09:00', category: 'food', title: '늦잠 후 여유로운 조식', location: '프레시 레스토랑', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '4-2', time: '10:30', category: 'rest', title: '피트니스 센터 가벼운 운동 (인클라인 등)', location: '퓨전 리조트 피트니스', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '4-3', time: '12:30', category: 'transport', title: '택시로 깜란 핫플 이동 (점심 및 커피)', location: '깜란 시내', mapQuery: 'Cam Ranh' },
    { id: '4-4', time: '15:30', category: 'rest', title: '리조트 복귀 후 프라이빗 풀 수영', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' },
    { id: '4-5', time: '19:00', category: 'food', title: '배달K 저녁 (반미, 숯불 꼬치구이 등)', location: '퓨전 리조트 깜란', mapQuery: 'Fusion Resort Cam Ranh' }
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
    case 'flight': return { Icon: PlaneTakeoff, color: 'text-[#407FFF]', bg: 'bg-[#407FFF]', lightBg: 'bg-[#407FFF]/10', text: '비행' };
    case 'hotel': return { Icon: BedDouble, color: 'text-[#00CBA8]', bg: 'bg-[#00CBA8]', lightBg: 'bg-[#00CBA8]/10', text: '숙소' };
    case 'food': return { Icon: Utensils, color: 'text-gray-800', bg: 'bg-[#FFEC6B]', lightBg: 'bg-[#FFEC6B]/40', text: '식사' };
    case 'shopping': return { Icon: ShoppingBag, color: 'text-[#FF88E4]', bg: 'bg-[#FF88E4]', lightBg: 'bg-[#FF88E4]/10', text: '쇼핑' };
    case 'sightseeing': return { Icon: Camera, color: 'text-[#00CBA8]', bg: 'bg-[#00CBA8]', lightBg: 'bg-[#00CBA8]/10', text: '관광' };
    case 'rest': return { Icon: Coffee, color: 'text-[#407FFF]', bg: 'bg-[#407FFF]', lightBg: 'bg-[#407FFF]/10', text: '휴식' };
    case 'transport': return { Icon: Car, color: 'text-gray-600', bg: 'bg-gray-200', lightBg: 'bg-gray-100', text: '이동' };
    case 'finish': return { Icon: Flag, color: 'text-[#FF88E4]', bg: 'bg-[#FF88E4]', lightBg: 'bg-[#FF88E4]/10', text: '완료' };
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

const FlightCard = ({ flight }) => {
  const isDeparture = flight.type === "departure";
  
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-full ${isDeparture ? 'bg-[#407FFF]/10 text-[#407FFF]' : 'bg-[#00CBA8]/10 text-[#00CBA8]'}`}>
            {isDeparture ? <PlaneTakeoff size={20} /> : <PlaneLanding size={20} />}
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-500">{isDeparture ? '출국편' : '귀국편'}</span>
            <h4 className="font-semibold text-gray-900 text-sm mt-0.5">{flight.airline} {flight.flightNumber}</h4>
          </div>
        </div>
        <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">
          OK
        </span>
      </div>

      <div className="flex justify-between items-center relative">
        <div className="text-center w-[30%]">
          <p className="text-2xl font-bold text-gray-900">{flight.departure.time}</p>
          <p className="text-sm font-semibold text-gray-600 mt-1">{flight.departure.airport}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{flight.departure.date}</p>
        </div>

        <div className="w-[40%] flex flex-col items-center justify-center px-2">
          <p className="text-[10px] text-gray-400 mb-1">{flight.duration}</p>
          <div className="w-full flex items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
            <div className="flex-1 h-[2px] bg-gray-200 border-t-2 border-dashed border-gray-300"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-[#00CBA8]"></div>
          </div>
        </div>

        <div className="text-center w-[30%]">
          <p className="text-2xl font-bold text-gray-900">{flight.arrival.time}</p>
          <p className="text-sm font-semibold text-gray-600 mt-1">{flight.arrival.airport}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{flight.arrival.date}</p>
        </div>
      </div>
    </div>
  );
};

const HotelCard = ({ hotel }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div 
        className="h-44 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${hotel.imageUrl})` }}
      ></div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[10px] font-bold text-[#00CBA8] bg-[#00CBA8]/10 px-2 py-1 rounded-full">숙소</span>
            <h3 className="font-bold text-gray-900 mt-2.5 text-lg">{hotel.name}</h3>
          </div>
        </div>
        
        <div className="flex items-start space-x-1.5 text-gray-500 text-xs mb-5 mt-1">
          <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
          <p>{hotel.location}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-3.5 flex justify-between items-center border border-gray-100">
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-gray-400 mb-1">체크인</p>
            <p className="text-sm font-bold text-gray-800">{hotel.checkIn}</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 mx-2" />
          <div className="flex-1 text-right">
            <p className="text-[10px] font-semibold text-gray-400 mb-1">체크아웃</p>
            <p className="text-sm font-bold text-gray-800">{hotel.checkOut}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ItineraryView = ({ itinerary, setItinerary, massageSchedule }) => {
  const [selectedDay, setSelectedDay] = useState('day2');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ time: '12:00', title: '', category: 'food', location: '' });

  const handleMapOpen = (query) => {
    if(!query) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  const handleAddSubmit = () => {
    if (!newSchedule.title.trim() || !newSchedule.time) return;
    
    const newItem = {
      id: Date.now().toString(),
      time: newSchedule.time,
      title: newSchedule.title.trim(),
      category: newSchedule.category,
      location: newSchedule.location,
      mapQuery: newSchedule.location,
    };

    const currentDayItems = itinerary[selectedDay] || [];
    const updatedDay = [...currentDayItems, newItem].sort((a, b) => a.time.localeCompare(b.time));

    setItinerary(prev => ({
      ...prev,
      [selectedDay]: updatedDay
    }));
    
    setIsAddModalOpen(false);
    setNewSchedule({ time: '12:00', title: '', category: 'food', location: '' });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="px-5 pt-2 pb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">상세 일정표</h2>
        <p className="text-[11px] font-medium text-gray-500 mb-4">아이콘을 누르면 구글 지도로 연결됩니다</p>
        
        {/* Day Selector - Match UI Guide Chips */}
        <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-2">
          {tripDays.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                selectedDay === day.id
                  ? 'bg-[#00CBA8] text-white shadow-md shadow-[#00CBA8]/20'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {day.day}
              <span className="block text-[10px] font-medium opacity-80 mt-0.5">{day.date}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl border-t border-gray-100 p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] overflow-y-auto pb-safe-area">
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[64px] top-4 bottom-4 w-[2px] bg-gray-100 z-0"></div>

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
                    <span className="text-sm font-bold text-gray-900">{item.title}</span>
                    <span className="text-[11px] font-bold text-[#FF88E4] mt-1.5 bg-[#FF88E4]/10 px-2 py-1 rounded-lg w-fit border border-[#FF88E4]/20">
                      민영: {minName || '미정'} / 다미: {damiName || '미정'}
                    </span>
                  </div>
                );
              } else {
                displayTitle = (
                  <div className="flex flex-col mt-0.5">
                    <span className="text-sm font-bold text-gray-900">{item.title}</span>
                    <span className="text-[11px] font-medium text-gray-400 mt-1">스파 예약 탭에서 마사지를 선택해주세요</span>
                  </div>
                );
              }
            } else {
              displayTitle = <span className="text-sm font-bold text-gray-900 leading-snug">{item.title}</span>;
            }

            return (
              <div key={item.id} className="relative z-10 mb-2">
                <div className="flex items-start">
                  <div className="w-[42px] shrink-0 pt-2.5 text-right">
                    <span className="text-[11px] font-bold text-gray-800 tracking-tighter">{item.time}</span>
                  </div>

                  <div className="flex flex-col items-center mx-3 relative z-10 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lightBg} shadow-sm border-2 border-white ring-1 ring-gray-100`}>
                      <Icon size={14} className={color} />
                    </div>
                  </div>

                  <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl p-3 hover:border-[#00CBA8]/30 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center w-max mb-1.5 ${lightBg} ${color}`}>
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
                    </div>
                    
                    {item.location && (
                      <div className="flex items-center text-gray-500 mt-2 text-[11px] font-medium">
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
                      <span className="text-[9px] font-semibold text-gray-500">{travelTime}</span>
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
            onClick={() => setIsAddModalOpen(true)}
            className="w-full border border-dashed border-gray-300 rounded-2xl py-3 flex items-center justify-center text-gray-400 hover:border-[#00CBA8] hover:text-[#00CBA8] hover:bg-[#00CBA8]/5 transition-all font-bold text-xs"
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
              일정 추가
            </h3>
            
            {/* Input Fields matching UI guide (focus border) */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 mb-1.5 block">시간</label>
                <input 
                  type="time" 
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00CBA8] focus:ring-1 focus:ring-[#00CBA8] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-500 mb-1.5 block">카테고리</label>
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
                      className={`flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                        newSchedule.category === cat.id 
                        ? 'bg-[#00CBA8] text-white shadow-md shadow-[#00CBA8]/20' 
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
                <label className="text-[10px] font-semibold text-gray-500 mb-1.5 block">일정명 (필수)</label>
                <input 
                  type="text" 
                  placeholder="예: 해산물 식당에서 저녁"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#00CBA8] focus:ring-1 focus:ring-[#00CBA8] transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-500 mb-1.5 block">장소 (선택, 구글맵 연동)</label>
                <input 
                  type="text" 
                  placeholder="예: 빈산 해산물"
                  value={newSchedule.location}
                  onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#00CBA8] focus:ring-1 focus:ring-[#00CBA8] transition-all"
                />
              </div>
            </div>

            {/* Modal Actions matching UI Guide */}
            <div className="flex space-x-2 mt-6">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleAddSubmit}
                disabled={!newSchedule.title.trim() || !newSchedule.time}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-black disabled:bg-gray-300 transition-colors"
              >
                추가하기
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

  const spaDays = tripDays
    .map((day, index) => ({ ...day, originalIndex: index }))
    .filter(day => ['금', '토', '월'].some(d => day.date.includes(d)));

  return (
    <div className="p-5 animate-in fade-in duration-300 relative h-full">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
            <Sparkles size={22} className="mr-2 text-[#00CBA8]" /> 
            스파 예약 (총 3회)
          </h2>
          <p className="text-[11px] text-gray-500 font-medium">2회 차감 프로그램 유의, 일자별 선택</p>
        </div>
        <button 
          onClick={openBrowseModal}
          className="flex items-center text-[11px] font-bold text-[#407FFF] bg-[#407FFF]/10 px-3 py-1.5 rounded-full hover:bg-[#407FFF]/20 transition-colors shadow-sm"
        >
          <BookOpen size={14} className="mr-1" /> 전체 메뉴
        </button>
      </div>

      <div className="flex gap-4 mb-5">
        {persons.map(person => (
          <div key={person} className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-900">{person}</span>
              <span className={`text-xs font-bold ${selectedCredits[person] >= maxCredits ? 'text-[#00CBA8]' : 'text-gray-400'}`}>
                {selectedCredits[person]}/{maxCredits}회
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 flex overflow-hidden gap-0.5">
              {[...Array(maxCredits)].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-full transition-all duration-300 ${i < selectedCredits[person] ? 'bg-[#00CBA8]' : 'bg-transparent'}`}
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
              <span className="font-bold text-gray-900 text-sm">{tripDay.day} <span className="text-[11px] font-medium text-gray-400 ml-1">{tripDay.date}</span></span>
            </div>
            
            <div className="flex gap-3">
              {persons.map(person => {
                const selectedId = schedule[tripDay.originalIndex]?.[person];
                const selectedMassage = selectedId ? getMassageById(selectedId) : null;
                const isMaxReached = selectedCredits[person] >= maxCredits;
                
                return (
                  <div key={person} className="flex-1">
                    <span className="text-[10px] font-semibold text-gray-400 mb-1.5 block">{person}</span>
                    
                    <div 
                      onClick={() => (!selectedId && isMaxReached) ? null : openSelectModal(tripDay.originalIndex, person)}
                      className={`h-[72px] rounded-2xl p-2.5 flex flex-col justify-center relative transition-all ${
                        selectedMassage 
                          ? 'bg-[#00CBA8]/5 border border-[#00CBA8]/30 cursor-pointer shadow-sm' 
                          : isMaxReached
                            ? 'bg-gray-50 border border-gray-100 opacity-60 cursor-not-allowed'
                            : 'bg-white border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50'
                      }`}
                    >
                      {selectedMassage ? (
                        <>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[11px] font-bold text-gray-900 leading-tight line-clamp-1 pr-4">{selectedMassage.name}</span>
                          </div>
                          <span className="text-[9px] font-medium text-gray-500 line-clamp-1">
                            {selectedMassage.time} {selectedMassage.pressure && `· ${selectedMassage.pressure}`}
                          </span>
                          {selectedMassage.cost === 2 && (
                            <span className="absolute bottom-2 right-2 text-[8px] font-bold bg-[#FF88E4] text-white px-1.5 py-0.5 rounded shadow-sm">2회 차감</span>
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
                          <Sparkles size={14} className={isMaxReached ? 'text-gray-300' : 'text-[#00CBA8]/40'} />
                          <span className="text-[10px] font-medium">{isMaxReached ? '예약 완료' : '+ 스파 선택'}</span>
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
          <div className="relative bg-white h-[85%] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 mx-auto w-full max-w-[400px]">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  {modalMode === 'browse' ? '전체 스파 메뉴' : '스파 메뉴 선택'}
                </h3>
                {modalMode === 'select' && (
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    <span className="text-[#00CBA8] font-bold">{modalContext.person}</span>의 {spaDays.find(d=>d.originalIndex === modalContext.dayIndex)?.day} 스파를 선택해주세요
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-100 bg-white p-3 space-x-2 shrink-0">
              {spaCategories.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all duration-200 ${
                    activeCategory === cat.id 
                      ? 'bg-[#00CBA8] text-white shadow-md shadow-[#00CBA8]/20' 
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3 pb-safe-area">
              <div className="bg-white rounded-xl p-3.5 flex items-start space-x-2.5 mb-4 border border-gray-100 shadow-sm">
                <Info size={14} className="text-[#00CBA8] flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-600 leading-snug">
                  1회 예약 시 1회권이 차감되며, <b className="text-[#FF88E4]">[2회 차감]</b> 프로그램은 2회권이 차감됩니다. 잔여 횟수를 고려해 선택해주세요.
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
                        ? 'border-[#00CBA8] shadow-md ring-1 ring-[#00CBA8] bg-[#00CBA8]/5'
                        : isDisabled && modalMode === 'select'
                          ? 'border-gray-100 opacity-60'
                          : modalMode === 'select' 
                            ? 'border-gray-200 shadow-sm hover:border-[#00CBA8]/50 cursor-pointer'
                            : 'border-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900 text-sm flex items-center">
                        {item.name}
                        {item.recommendReason && (
                          <span className="ml-2 bg-[#FFEC6B]/40 text-gray-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center">
                            <ThumbsUp size={10} className="mr-1" /> 추천
                          </span>
                        )}
                      </h4>
                      {item.cost === 2 && (
                        <span className="text-[10px] font-bold bg-[#FF88E4]/10 text-[#FF88E4] px-2 py-0.5 rounded-full shrink-0 ml-2">2회 차감</span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        ⏱ {item.time}
                      </span>
                      {item.pressure && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#407FFF]/10 text-[#407FFF]">
                          💪 압력: {item.pressure}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{item.desc}</p>

                    {item.recommendReason && (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3">
                        <div className="flex items-center text-gray-900 font-bold text-[10px] mb-1.5">
                          <span className="bg-[#FFEC6B] text-gray-900 rounded px-1.5 py-0.5 text-[9px] mr-1.5 leading-tight shadow-sm">추천 사유</span>
                        </div>
                        <p className="text-[10px] text-gray-600 font-medium leading-snug">{item.recommendReason}</p>
                      </div>
                    )}
                    
                    {modalMode === 'select' && (
                      <button 
                        disabled={isDisabled}
                        className={`w-full py-3 rounded-xl text-xs font-bold transition-colors mt-2 ${
                          isCurrentlySelectedInThisSlot
                            ? 'bg-[#00CBA8] text-white'
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


function useSavedState(key, initial) {
  const [value, setValue] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) ?? initial; } catch { return initial; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [massageSchedule, setMassageSchedule] = useSavedState('ntr-spa-v1', {});
  const [itinerary, setItinerary] = useSavedState('ntr-itinerary-v1', initialItinerary);
  const tabs = [{id:'home', title:'여행 한눈에', icon:Home}, {id:'itinerary', title:'여행 일정', icon:CalendarDays}, {id:'massage', title:'스파 플래너', icon:Sparkles}];
  const navigation = tabs.map(({id,title,icon:Icon}) => <button key={id} aria-current={activeTab === id ? 'page' : undefined} onClick={() => setActiveTab(id)} className={'nav-button ' + (activeTab === id ? 'selected' : '')}><Icon size={20}/><span>{title}</span>{activeTab === id && <ChevronRight size={16} className="nav-arrow"/>}</button>);
  return <div className="app-shell">
    <aside className="sidebar"><a href="#" className="brand" onClick={() => setActiveTab('home')}><span className="brand-icon"><Navigation size={22}/></span> somewhere<span className="brand-dot">.</span></a><p className="sidebar-label">우리의 다음 여행</p><nav aria-label="주 메뉴">{navigation}</nav><div className="sidebar-note"><Luggage size={26}/><h3>가볍게 떠나, 오래 기억해요.</h3><p>민영 & 다미의 나트랑 여행<br/>2027년 3월 4일 — 9일</p><span>VIETNAM · 2027</span></div><div className="sidebar-footer">Made for your next escape ↗</div></aside>
    <main className="workspace"><header className="topbar"><span>나의 여행 <ChevronRight size={14}/> <strong>나트랑</strong></span><div className="travelers"><span className="avatar">민</span><span className="avatar second">다</span><span>함께하는 여행</span></div></header>
      <section className="page-intro"><div><p className="eyebrow">A LITTLE ESCAPE, A BIG MEMORY</p><h1>{activeTab === 'home' ? '우리, 나트랑으로 떠나요' : activeTab === 'itinerary' ? '하루하루, 우리만의 여행' : '쉼도 여행의 일부니까'}<span className="title-dot">.</span></h1><p>따뜻한 햇살, 느긋한 하루. 민영과 다미의 여행을 한곳에.</p></div><span className="trip-badge"><CalendarDays size={16}/> 2027.03.04 — 03.09</span></section>
      {activeTab === 'home' ? <>
        <section className="hero"><div className="hero-shade"/><div className="hero-content"><span className="hero-label"><MapPin size={14}/> VIETNAM, NHA TRANG</span><h2>바다 가까이,<br/>마음은 더 가볍게.</h2><p>나트랑 우정 여행 · 5박 6일</p><button onClick={() => setActiveTab('itinerary')}>우리의 일정 보기 <ChevronRight size={17}/></button></div><span className="hero-caption">A postcard from our next chapter</span></section>
        <section className="trip-stats"><div><CalendarDays/><span>여행 기간<strong>5박 6일</strong></span></div><div><Luggage/><span>함께하는 사람<strong>민영 · 다미</strong></span></div><div><Building2/><span>머무는 곳<strong>호텔 & 풀빌라</strong></span></div><div><Sparkles/><span>이번 여행의 테마<strong>휴식, 그리고 우리</strong></span></div></section>
        <div className="overview-grid"><section><div className="section-heading"><div><span className="eyebrow">GETTING THERE</span><h2>설레는 출발, 편안한 귀국</h2></div><PlaneTakeoff size={22}/></div>{tripData.flights.map((flight,index) => <FlightCard key={index} flight={flight}/>)}<div className="travel-note"><Info size={17}/><span>항공편의 출발·도착 시간은 각 공항 현지 시간 기준이에요.</span></div></section><section><div className="section-heading"><div><span className="eyebrow">STAY A LITTLE LONGER</span><h2>우리의 쉼이 머무는 곳</h2></div><Building2 size={22}/></div>{tripData.hotels.map((hotel,index) => <HotelCard key={index} hotel={hotel}/>)}</section></div>
        <section className="spa-banner"><div className="spa-banner-icon"><Sparkles size={28}/></div><div><span className="eyebrow">TIME TO SLOW DOWN</span><h3>아무것도 하지 않을 자유, 스파 타임</h3><p>우리에게 맞는 프로그램을 고르고 여행에 쉼을 더해요.</p></div><button onClick={() => setActiveTab('massage')}>스파 계획하기 <ChevronRight size={16}/></button></section>
      </> : <section className="detail-panel">{activeTab === 'itinerary' ? <ItineraryView itinerary={itinerary} setItinerary={setItinerary} massageSchedule={massageSchedule}/> : <MassageView schedule={massageSchedule} setSchedule={setMassageSchedule}/>}</section>}
      <footer className="page-footer"><span>somewhere. · 우리의 여행 기록</span><span>좋은 순간을, 함께.</span></footer>
    </main><nav className="mobile-nav" aria-label="모바일 메뉴">{navigation}</nav>
  </div>;
}
