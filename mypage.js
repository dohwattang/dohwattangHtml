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