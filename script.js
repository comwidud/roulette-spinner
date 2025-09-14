// 상점/벌점 항목들을 모드별로 분리해서 관리
const rewardItems = [
    '과자 1개',
    '박수 받기',
    '청소 면제'
];

const penaltyItems = [
    '노래부르기',
    '춤추기',
    '애교 10번',
    '스쿼드 30개'
];

// 전역 변수들
let isSpinning = false; // 현재 회전 중인지 확인
let currentRotation = 0; // 현재 회전 각도
let spinAnimation; // 애니메이션 참조
let currentMode = 'reward'; // 현재 모드: 'reward' 또는 'penalty'
let audioContext; // 오디오 컨텍스트
let tickSound = null; // 틱 소리
let resultSound = null; // 결과 소리

// DOM 요소들
const spinner = document.getElementById('spinner');
const spinButton = document.getElementById('spinButton');
const resultDisplay = document.getElementById('result');
const rewardModeBtn = document.getElementById('rewardModeBtn');
const penaltyModeBtn = document.getElementById('penaltyModeBtn');
const currentModeTitle = document.getElementById('currentModeTitle');
const newItemInput = document.getElementById('newItemInput');
const addItemBtn = document.getElementById('addItemBtn');
const itemsList = document.getElementById('itemsList');
const itemsListTitle = document.getElementById('itemsListTitle');
const toggleManagementBtn = document.getElementById('toggleManagementBtn');
const itemManagement = document.getElementById('itemManagement');

/**
 * 오디오 컨텍스트 초기화 함수
 */
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API를 지원하지 않는 브라우저입니다.');
    }
}

/**
 * 틱 소리를 생성하는 함수 (Web Audio API 사용)
 */
function playTickSound() {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

/**
 * 결과 발표 소리를 생성하는 함수
 */
function playResultSound() {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

/**
 * 페이지 로드 시 실행되는 초기화 함수
 * 룰렛의 부채꼴 조각들을 생성하고 이벤트 리스너를 설정
 */
function init() {
    createSpinnerSegments();
    updateItemsList();
    initAudio();

    // 이벤트 리스너 설정
    spinButton.addEventListener('click', handleSpinButtonClick);
    rewardModeBtn.addEventListener('click', () => switchMode('reward'));
    penaltyModeBtn.addEventListener('click', () => switchMode('penalty'));
    addItemBtn.addEventListener('click', addNewItem);
    toggleManagementBtn.addEventListener('click', toggleItemManagement);
    newItemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewItem();
    });

    // 사용자 상호작용 후 오디오 컨텍스트 활성화
    document.addEventListener('click', () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
}

/**
 * 현재 모드에 따라 사용할 항목 배열을 반환하는 함수
 * @returns {Array} 현재 모드에 해당하는 항목 배열
 */
function getCurrentItems() {
    return currentMode === 'reward' ? rewardItems : penaltyItems;
}

/**
 * 모드를 전환하는 함수
 * @param {string} mode - 전환할 모드 ('reward' 또는 'penalty')
 */
function switchMode(mode) {
    // 회전 중이면 모드 변경 불가
    if (isSpinning) return;

    currentMode = mode;

    // 버튼 활성화 상태 변경
    rewardModeBtn.classList.toggle('active', mode === 'reward');
    penaltyModeBtn.classList.toggle('active', mode === 'penalty');

    // 모드 제목 업데이트
    currentModeTitle.textContent = mode === 'reward' ? '상점 모드' : '벌점 모드';

    // 룰렛과 항목 목록 업데이트
    createSpinnerSegments();
    updateItemsList();

    // 결과 초기화
    resultDisplay.textContent = '룰렛을 돌려보세요!';
    resultDisplay.style.backgroundColor = '#f9f9f9';
    resultDisplay.style.borderColor = '#ddd';
    resultDisplay.style.color = '#333';
}

/**
 * 룰렛의 부채꼴 조각들을 동적으로 생성하는 함수
 * 현재 모드의 항목들에 대해 부채꼴 조각을 만들고 적절한 각도로 배치
 */
function createSpinnerSegments() {
    // 기존 조각들 제거
    spinner.innerHTML = '';

    const items = getCurrentItems();
    const totalItems = items.length;
    const anglePerSegment = 360 / totalItems; // 각 조각이 차지할 각도

    items.forEach((itemText, index) => {
        // 부채꼴 조각 div 생성
        const segment = document.createElement('div');
        // 모드에 따라 다른 색상 클래스 적용
        segment.className = `segment ${currentMode === 'reward' ? 'positive' : 'negative'}`;

        // 각 조각의 회전 각도 계산 (12시 방향부터 시계방향)
        const rotation = index * anglePerSegment;
        const skewY = 90 - anglePerSegment;

        // CSS transform을 사용하여 조각을 적절한 위치에 배치
        segment.style.transform = `rotate(${rotation}deg) skewY(${skewY}deg)`;

        // 조각 내부의 텍스트 컨테이너 생성
        const segmentText = document.createElement('div');
        segmentText.className = 'segment-text';
        segmentText.textContent = itemText;

        // 텍스트를 바르게 보이도록 역변환
        segmentText.style.transform = `skewY(${-skewY}deg) rotate(${anglePerSegment / 2}deg)`;

        segment.appendChild(segmentText);
        spinner.appendChild(segment);
    });
}

/**
 * '돌리기'/'멈추기' 버튼 클릭 이벤트 처리 함수
 * 현재 상태에 따라 룰렛을 시작하거나 멈춤
 */
function handleSpinButtonClick() {
    if (!isSpinning) {
        startSpinning();
    } else {
        stopSpinning();
    }
}

/**
 * 룰렛 회전을 시작하는 함수
 * 빠른 회전 애니메이션을 시작하고 버튼 텍스트를 변경
 */
function startSpinning() {
    isSpinning = true;
    spinButton.textContent = '멈추기';
    resultDisplay.textContent = '회전 중...';

    // CSS 애니메이션 클래스 추가로 빠른 회전 시작
    spinner.classList.add('spinning');

    // 틱 소리를 위한 변수
    let lastTickRotation = 0;
    const items = getCurrentItems();
    const anglePerSegment = 360 / items.length;

    // 회전 각도를 지속적으로 업데이트하는 애니메이션 루프
    function animateRotation() {
        if (isSpinning) {
            currentRotation += 15; // 매 프레임마다 15도씩 회전
            currentRotation %= 360; // 360도를 넘으면 0부터 다시 시작

            // 부채꼴 경계를 지날 때마다 틱 소리 재생
            const currentSegment = Math.floor(currentRotation / anglePerSegment);
            const lastSegment = Math.floor(lastTickRotation / anglePerSegment);

            if (currentSegment !== lastSegment) {
                playTickSound();
            }

            lastTickRotation = currentRotation;
            spinAnimation = requestAnimationFrame(animateRotation);
        }
    }

    spinAnimation = requestAnimationFrame(animateRotation);
}

/**
 * 룰렛 회전을 멈추는 함수
 * 자연스러운 감속 효과를 주며 최종 결과를 선택
 */
function stopSpinning() {
    if (!isSpinning) return;

    isSpinning = false;
    spinButton.textContent = '돌리기';

    // CSS 애니메이션 클래스 제거
    spinner.classList.remove('spinning');

    // 애니메이션 루프 중단
    if (spinAnimation) {
        cancelAnimationFrame(spinAnimation);
    }

    // 자연스러운 감속 효과를 위한 추가 회전
    const additionalSpins = Math.random() * 5 + 5; // 5-10번 추가 회전
    const finalRotation = currentRotation + (additionalSpins * 360);

    // 부드러운 감속 애니메이션 적용 (2초로 단축)
    const animationDuration = 2000; // 2초
    spinner.style.transition = `transform ${animationDuration / 1000}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    spinner.style.transform = `rotate(${finalRotation}deg)`;

    // 최종 결과 미리 계산하여 즉시 표시
    currentRotation = finalRotation % 360;
    const selectedItem = getSelectedItem(currentRotation);

    // 결과를 즉시 표시하되 "선택 중..." 표시
    resultDisplay.textContent = `선택 중... → ${selectedItem}`;
    resultDisplay.style.backgroundColor = '#fff3cd';
    resultDisplay.style.borderColor = '#ffc107';
    resultDisplay.style.color = '#856404';

    // 애니메이션 완료 후 최종 결과 확정
    setTimeout(() => {
        displayResult(selectedItem);
        playResultSound(); // 결과 발표 소리

        // 다음 회전을 위해 transition 제거
        spinner.style.transition = '';
    }, animationDuration);
}

/**
 * 현재 회전 각도를 기준으로 선택된 항목을 계산하는 함수
 * @param {number} rotation - 현재 회전 각도 (0-360도)
 * @returns {string} 선택된 항목 텍스트
 */
function getSelectedItem(rotation) {
    const items = getCurrentItems();
    const totalItems = items.length;
    const anglePerSegment = 360 / totalItems;

    // 포인터는 12시 방향(0도)을 가리킴
    // 룰렛이 시계방향으로 회전하므로 음의 방향으로 계산
    // 회전각도를 정규화하고 첫 번째 항목이 12시 방향에 시작하도록 보정
    const normalizedRotation = (360 - (rotation % 360)) % 360;

    // 어떤 조각이 선택되었는지 계산 (포인터가 가리키는 부채꼴)
    const selectedIndex = Math.floor(normalizedRotation / anglePerSegment) % totalItems;

    return items[selectedIndex];
}

/**
 * 선택된 결과를 화면에 표시하는 함수
 * @param {string} itemText - 선택된 항목 텍스트
 */
function displayResult(itemText) {
    resultDisplay.textContent = itemText;

    // 상점/벌점에 따라 결과 영역 스타일 변경
    if (currentMode === 'reward') {
        resultDisplay.style.backgroundColor = '#e8f5e8';
        resultDisplay.style.borderColor = '#4CAF50';
        resultDisplay.style.color = '#2e7d32';
    } else {
        resultDisplay.style.backgroundColor = '#ffe8e8';
        resultDisplay.style.borderColor = '#f44336';
        resultDisplay.style.color = '#c62828';
    }
}

/**
 * 항목 관리 영역을 토글하는 함수
 */
function toggleItemManagement() {
    const isHidden = itemManagement.style.display === 'none';

    if (isHidden) {
        itemManagement.style.display = 'block';
        toggleManagementBtn.classList.add('active');
        toggleManagementBtn.textContent = '항목 관리 닫기';
    } else {
        itemManagement.style.display = 'none';
        toggleManagementBtn.classList.remove('active');
        toggleManagementBtn.textContent = '항목 관리';
    }
}

/**
 * 항목 목록을 업데이트하는 함수
 * 현재 모드에 따라 상점 또는 벌점 항목들을 표시
 */
function updateItemsList() {
    const items = getCurrentItems();

    // 제목 업데이트
    itemsListTitle.textContent = currentMode === 'reward' ? '상점 항목들' : '벌점 항목들';

    // 기존 목록 제거
    itemsList.innerHTML = '';

    // 각 항목에 대해 리스트 아이템 생성
    items.forEach((itemText, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'item-entry';

        // 항목 텍스트
        const textSpan = document.createElement('span');
        textSpan.className = 'item-text';
        textSpan.textContent = itemText;

        // 삭제 버튼
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-button';
        deleteBtn.textContent = '삭제';
        deleteBtn.onclick = () => deleteItem(index);

        listItem.appendChild(textSpan);
        listItem.appendChild(deleteBtn);
        itemsList.appendChild(listItem);
    });
}

/**
 * 새로운 항목을 추가하는 함수
 * 입력창의 값을 현재 모드의 항목 배열에 추가
 */
function addNewItem() {
    const newItemText = newItemInput.value.trim();

    // 입력값 검증
    if (!newItemText) {
        alert('항목을 입력해주세요!');
        return;
    }

    if (newItemText.length > 20) {
        alert('항목은 20자 이내로 입력해주세요!');
        return;
    }

    // 현재 모드에 따라 해당 배열에 추가
    const items = getCurrentItems();

    // 중복 검사
    if (items.includes(newItemText)) {
        alert('이미 존재하는 항목입니다!');
        return;
    }

    // 항목 추가
    items.push(newItemText);

    // UI 업데이트
    createSpinnerSegments();
    updateItemsList();

    // 입력창 초기화
    newItemInput.value = '';
}

/**
 * 기존 항목을 삭제하는 함수
 * @param {number} index - 삭제할 항목의 인덱스
 */
function deleteItem(index) {
    const items = getCurrentItems();

    // 최소 1개 항목은 남겨둬야 함
    if (items.length <= 1) {
        alert('최소 1개의 항목은 남겨둬야 합니다!');
        return;
    }

    // 확인 메시지
    if (confirm(`"${items[index]}" 항목을 삭제하시겠습니까?`)) {
        // 항목 삭제
        items.splice(index, 1);

        // UI 업데이트
        createSpinnerSegments();
        updateItemsList();
    }
}


// 페이지 로드 완료 시 초기화 실행
document.addEventListener('DOMContentLoaded', init);