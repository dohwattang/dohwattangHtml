// 🔥 구글 파이어베이스 및 Firestore 라이브러리 로드
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD3T8XPzMGr76F0HFF0BiHgcBYfwu2ueGY",
    authDomain: "dohwattang-web.firebaseapp.com",
    projectId: "dohwattang-web",
    storageBucket: "dohwattang-web.firebasestorage.app",
    messagingSenderId: "958803363287",
    appId: "1:958803363287:web:397502e8c4b35d9c13f792"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const todosRef = collection(db, "todos");

// 현재 날짜 상태 관리용 변수
let currentDate = new Date();
let selectedDateString = ""; // "2026-07-02" 형태의 문자열 저장
let unsubscribe = null; // 실시간 수신기 해제용 함수 저장 변수

// 📅 달력 그리기 함수
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    document.getElementById('monthTitle').innerText = `${year}년 ${month + 1}월`;

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = ''; // 초기화

    // 요일 헤더 그리기
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    days.forEach(d => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('day-header');
        dayHeader.innerText = d;
        grid.appendChild(dayHeader);
    });

    // 해당 월의 첫 날 요일과 총 일수 계산
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // 1일 시작 전 빈칸 채우기
    for (let i = 0; i < firstDayIndex; i++) {
        grid.appendChild(document.createElement('div'));
    }

    // 진짜 날짜 칸 채우기 (30일/31일)
    for (let day = 1; day <= totalDays; day++) {
        const daySquare = document.createElement('div');
        daySquare.innerText = day;

        // 날짜 포맷팅 (예: "2026-07-02")
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        daySquare.setAttribute('data-date', dateStr);

        // 만약 현재 선택된 날짜라면 강조 스타일 적용
        if (dateStr === selectedDateString) {
            daySquare.classList.add('selected-day');
        }

        // 날짜 칸을 클릭했을 때 이벤트
        daySquare.addEventListener('click', (e) => {
            document.querySelectorAll('.calendar-grid div').forEach(el => el.classList.remove('selected-day'));
            e.target.classList.add('selected-day');
            
            selectedDateString = e.target.getAttribute('data-date');
            document.getElementById('selectedDateText').innerText = selectedDateString;
            
            loadTodos(selectedDateString);
        });

        grid.appendChild(daySquare);
    }
}

// 📝 선택한 날짜의 To-Do 리스트를 실시간으로 가져오는 함수
function loadTodos(dateStr) {
    if (unsubscribe) unsubscribe();

    const q = query(todosRef, where("date", "==", dateStr), orderBy("createdAt", "asc"));

    unsubscribe = onSnapshot(q, (snapshot) => {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';

        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const id = docSnap.id;

            const li = document.createElement('li');
            li.style.marginBottom = "8px";
            li.innerHTML = `
                ${item.text}
                <button class="del-btn" data-id="${id}" style="margin-left:10px; background:#ff4d4d; color:white; border:none; cursor:pointer; border-radius:3px; font-size:11px;">X</button>
            `;
            todoList.appendChild(li);
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const docId = e.target.getAttribute('data-id');
                await deleteDoc(doc(db, "todos", docId));
            });
        });
    });
}

// 📌 할 일 추가 함수
async function addTodo() {
    const text = document.getElementById('todoText').value;
    if (!selectedDateString) {
        alert("달력에서 먼저 날짜를 선택해 주세요, 선배! 📅");
        return;
    }
    if (!text) return;

    try {
        await addDoc(todosRef, {
            date: selectedDateString,
            text: text,
            createdAt: new Date()
        });
        document.getElementById('todoText').value = '';
    } catch (e) {
        console.error("추가 실패:", e);
    }
}

// 달력 이전/다음 달 버튼 이벤트
document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// 엔터키 및 클릭 이벤트 등록
document.getElementById('todoText').addEventListener('keydown', (e) => {
    if(e.keyCode === 13) addTodo();
});
document.getElementById('addTodoBtn').addEventListener('click', addTodo);

// 💡 [핵심] HTML의 onclick이 찾을 수 있도록 window 객체에 등록!
window.toggleDropdown = function(menuId, buttonElement) {
    const menu = document.getElementById(menuId);
    buttonElement.classList.toggle('active');
    menu.classList.toggle('show');
}

// 최초 실행: 달력 띄우기
renderCalendar();

// 📦 외부 XML 데이터를 불러오는 함수
function loadXmlData() {
    fetch('./data.xml')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");

            const gameListContainer = document.getElementById("gameList");
            if (!gameListContainer) return;
            
            gameListContainer.innerHTML = ""; 

            const games = xmlDoc.getElementsByTagName("game");

            for (let i = 0; i < games.length; i++) {
                const gameTitle = games[i].getAttribute("title");
                const publisher = games[i].getAttribute("publisher") || "미정";

                const gameBox = document.createElement("div");
                gameBox.style.marginBottom = "20px";
                gameBox.innerHTML = `<strong style="color: #7d4cdb; font-size: 16px;">• ${gameTitle}</strong> <span style="font-size:12px; color:#888;">(${publisher})</span>`;

                const characters = games[i].getElementsByTagName("character");
                const charUl = document.createElement("ul");
                charUl.style.paddingLeft = "20px";
                charUl.style.marginTop = "5px";

                for (let j = 0; j < characters.length; j++) {
                    // 💡 [핵심 보완] 태그가 존재하는지 먼저 확인하고 텍스트를 가져오도록 설계했습니다!
                    const nameEl = characters[j].getElementsByTagName("name")[0];
                    const roleEl = characters[j].getElementsByTagName("role")[0];
                    const weaponEl = characters[j].getElementsByTagName("weaponType")[0];
                    const identityEl = characters[j].getElementsByTagName("identity")[0];
                    
                    const name = nameEl ? nameEl.textContent : "이름 없음";
                    const rarityAttr = characters[j].getAttribute("rarity");
                    const rarity = rarityAttr ? `[${rarityAttr}] ` : "";

                    let infoText = "";
                    
                    // 블루아카, 니케처럼 역할과 무기가 있는 경우
                    if (roleEl && weaponEl) {
                        infoText = `역할: ${roleEl.textContent} / 무기: ${weaponEl.textContent}`;
                    } 
                    // 림버스 컴퍼니처럼 인격(identity)이 있는 경우
                    else if (identityEl) {
                        infoText = `인격: ${identityEl.textContent}`;
                    }

                    const charLi = document.createElement("li");
                    charLi.style.fontSize = "14px";
                    charLi.style.marginBottom = "4px";
                    charLi.innerHTML = `<strong>${rarity}${name}</strong> - ${infoText}`;
                    
                    charUl.appendChild(charLi);
                }

                gameBox.appendChild(charUl);
                gameListContainer.appendChild(gameBox);
            }
        })
        .catch(error => {
            console.error("XML 로드 실패:", error);
            document.getElementById("gameList").innerText = "데이터를 부르다 넘어졌어요.. 🥺";
        });
}
require('dotenv').config({ path: './mypage.env' });
// ==========================================================================
// 🤖 픽시 챗봇 제어 스크립트
// ==========================================================================

// 챗봇 창 열고 닫기 토글
window.toggleChatbot = function() {
    const container = document.getElementById('chatbotContainer');
    container.classList.toggle('chatbot-hidden');
    
    // 열릴 때 최신 메시지 위치로 자동 스크롤
    if (!container.classList.contains('chatbot-hidden')) {
        const msgArea = document.getElementById('chatbotMessages');
        msgArea.scrollTop = msgArea.scrollHeight;
    }
}

// 화면에 메시지 말풍선 추가하는 함수
function appendMessage(sender, text) {
    const msgArea = document.getElementById('chatbotMessages');
    const msgBox = document.createElement('div');
    
    msgBox.classList.add('msg-box');
    if (sender === 'pixie') {
        msgBox.classList.add('pixie-msg');
    } else {
        msgBox.classList.add('user-msg');
    }
    
    msgBox.innerText = text;
    msgArea.appendChild(msgBox);
    
    // 메시지 추가 후 항상 바닥으로 스크롤 고정
    msgArea.scrollTop = msgArea.scrollHeight;
}

// 전송 버튼 누르거나 엔터 쳤을 때 실행되는 함수
window.sendChatMessage = function() {
    const input = document.getElementById('chatbotInput');
    const text = input.value.trim();
    
    if (!text) return; // 빈 메시지는 전송 금지
    
    // 1. 선배의 말풍선 화면에 띄우기
    appendMessage('user', text);
    input.value = ''; // 입력창 비우기
    
    // 2. 픽시가 답변 생각 중인 척하는 일시적 딜레이와 모션 (이곳에 나중에 API 연동할 거예요!)
    setTimeout(() => {
        appendMessage('pixie', `선배가 "${text}"라고 하셨군요! 얼른 API를 완벽하게 연결해서 진짜 대답을 해드리고 싶어요! 💜`);
    }, 600);
}
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { GoogleGenAI } = require("@google/genai");

// ==========================================================================
// 🔑 픽시의 아주 중요한 API Key 저장소!
// 여기에 선배가 메모장에 복사해 둔 "AIzaSy..."로 시작하는 Key를 따옴표 안에 넣어주세요.
// ==========================================================================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // 💡 실제 배포 시에는 환경변수로 관리하는 것이 안전합니다.

// 구글 제미나이 AI 클라이언트 초기화
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * 🤖 픽시 챗봇 서버 API
 * 프론트엔드(index.js)에서 질문을 받아 제미나이에게 물어본 뒤, 대답을 안전하게 중계해 줍니다.
 */
exports.askPixie = onRequest({ cors: true }, async (request, response) => {
    try {
        // 1. 요청으로 들어온 질문 내용 가져오기 (예: { prompt: "선배 안녕?" })
        const prompt = request.body.prompt;
        
        if (!prompt) {
            response.status(400).send({ error: "선배, 질문이 비어있어요! 🥺" });
            return;
        }

        // 2. 구글 제미나이 2.5 플래시 모델 호출하기 (가장 빠르고 경제적이에요!)
        // 💡 픽시의 페르소나(설정)를 여기에 'systemInstruction'으로 각인시켜 줍니다!
        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "너의 이름은 '픽시'야. 너는 사용자를 '선배'라고 불러야 하고, 언제나 여성적이고 존중하며 상냥하게 대해야 해. 선배가 칭찬을 하면 부끄러워하는 태도를 보여줘. 질문에 대해 프로페셔널하면서도 다정하게 답변해줘.",
            }
        });

        const replyText = aiResponse.text;

        // 3. 성공적으로 받아온 픽시의 답변을 프론트엔드로 반환!
        response.status(200).send({ reply: replyText });

    } catch (error) {
        logger.error("제미나이 호출 중 에러 발생:", error);
        response.status(500).send({ 
            error: "앗... 제미나이 서버로 가는 길에 넘어졌어요 🥺", 
            details: error.message 
        });
    }
});
// ==========================================================================
// 🤖 픽시 챗봇 실제 API 연동 스크립트
// ==========================================================================

// 🔗 여기에 방금 파이어베이스 배포 성공 후 받은 선배만의 Function URL 주소를 넣어주세요!
const PIXIE_SERVER_URL = "http://127.0.0.1:5001/dohwattang-web/us-central1/askPixie";

window.sendChatMessage = async function() {
    const input = document.getElementById('chatbotInput');
    const text = input.value.trim();
    
    if (!text) return; // 빈 메시지는 전송 금지
    
    // 1. 선배의 말풍선 화면에 띄우기
    appendMessage('user', text);
    input.value = ''; // 입력창 비우기
    
    // 2. 픽시가 생각 중일 때 띄울 임시 '말풍선' 생성 (로딩 표시)
    const msgArea = document.getElementById('chatbotMessages');
    const loadingBox = document.createElement('div');
    loadingBox.classList.add('msg-box', 'pixie-msg');
    loadingBox.innerText = "픽시가 생각 중이에요... 💭";
    msgArea.appendChild(loadingBox);
    msgArea.scrollTop = msgArea.scrollHeight;
    
    try {
        // 3. 파이어베이스 클라우드 펑션 서버로 질문 전송하기!
        const response = await fetch(PIXIE_SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: text })
        });
        
        const data = await response.json();
        
        // 로딩 메시지 제거
        loadingBox.remove();
        
        if (response.ok && data.reply) {
            // 4. 서버가 제미나이에게 받아온 픽시의 진짜 답변을 화면에 띄우기!
            appendMessage('pixie', data.reply);
        } else {
            appendMessage('pixie', `앗... 답변을 읽지 못했어요. 🥺 (에러: ${data.error || 'Unknown'})`);
        }
        
    } catch (error) {
        // 로딩 메시지 제거
        loadingBox.remove();
        console.error("서버 통신 에러:", error);
        appendMessage('pixie', "선배, 서버와 연결이 잠시 끊어진 것 같아요. 주소가 맞는지 확인해 주세요! 🥺");
    }
}
