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

/**
 * 페이지 로드 시 실행되는 초기화 함수
 * 룰렛의 부채꼴 조각들을 생성하고 이벤트 리스너를 설정
 */
function init() {
    createSpinnerSegments();
    updateItemsList();

    // 이벤트 리스너 설정
    spinButton.addEventListener('click', handleSpinButtonClick);
    rewardModeBtn.addEventListener('click', () => switchMode('reward'));
    penaltyModeBtn.addEventListener('click', () => switchMode('penalty'));
    addItemBtn.addEventListener('click', addNewItem);
    newItemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewItem();
    });
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

        // 각 조각의 회전 각도 계산
        const rotation = index * anglePerSegment;

        // CSS transform을 사용하여 조각을 적절한 위치에 배치
        // rotate: 조각을 회전시킴
        // skew: 부채꼴 모양을 만들기 위해 기울임
        segment.style.transform = `rotate(${rotation}deg) skew(${90 - anglePerSegment}deg)`;

        // 조각 내부의 텍스트 컨테이너 생성
        const segmentText = document.createElement('div');
        segmentText.className = 'segment-text';
        segmentText.textContent = itemText;

        // 텍스트를 다시 바르게 보이도록 회전
        const textRotation = anglePerSegment / 2;
        segmentText.style.transform = `rotate(${textRotation}deg) skew(${-(90 - anglePerSegment)}deg)`;

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

    // 회전 각도를 지속적으로 업데이트하는 애니메이션 루프
    function animateRotation() {
        if (isSpinning) {
            currentRotation += 15; // 매 프레임마다 15도씩 회전
            currentRotation %= 360; // 360도를 넘으면 0부터 다시 시작
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

    // 부드러운 감속 애니메이션 적용
    spinner.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    spinner.style.transform = `rotate(${finalRotation}deg)`;

    // 애니메이션 완료 후 결과 표시
    setTimeout(() => {
        currentRotation = finalRotation % 360;
        const selectedItem = getSelectedItem(currentRotation);
        displayResult(selectedItem);

        // 다음 회전을 위해 transition 제거
        spinner.style.transition = '';
    }, 3000); // 3초 감속 애니메이션 시간
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

    // 포인터는 12시 방향(0도)을 가리키므로, 회전 각도를 보정
    // 룰렛이 시계방향으로 회전하므로 각도를 뒤집어서 계산
    const adjustedAngle = (360 - rotation) % 360;

    // 어떤 조각이 선택되었는지 계산
    const selectedIndex = Math.floor(adjustedAngle / anglePerSegment);

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