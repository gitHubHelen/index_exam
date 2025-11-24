const host = 'http://121.43.26.102:3000';
// 题目存储器
let examData = []
// 存储错题信息
let wrongQuestions = [];


// 下载数据到本地
function downloadData(exportData) {
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.download = `错题记录_${studentName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// 导出错题为JSON文件
function exportwrongQuestions() {
    if (wrongQuestions.length === 0) {
        alert('还得是你👍🏻，满分选手哦💐💐💐');
        return;
    }

    const studentName = document.getElementById('student-name').value.trim();

    const exportData = {
        studentName,
        examId: 'CIESCR1202409',
        wrongList: wrongQuestions.map(item => item.id),
        exportTime: new Date().toLocaleString('zh-CN'),
        timeUsed: timerElement.textContent
    };

    sendToServer(exportData)
}

// 模拟发送到服务器的函数
function sendToServer(data) {
    // 在实际应用中，这里应该使用fetch或XMLHttpRequest将数据发送到服务器
    // 在实际应用中，这里应该使用fetch或XMLHttpRequest将数据发送到服务器
    fetch(`${host}/api/error-questions/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log('提交成功:', data);
        })
        .catch((error) => {
            console.error('提交错误:', error);
        });
}

async function fetchData() {
    return fetch(`${host}/api/questions/CIESCR1202409`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // 解析JSON数据
        })
        .then(data => {
            console.log(data); // 使用数据
            return data
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            return error
        });
}

// 初始化考试
document.addEventListener('DOMContentLoaded', async function () {
    try {
        let { data, examId } = await fetchData()
        examData = data
        // 设置题目总数
        document.getElementById('total-titles').textContent = examData.length;
        document.getElementById('total-score').textContent = examData.length * 2;
        document.getElementById('total-time').textContent = examData.length * 0.5;
        document.getElementById('exam-id').textContent = examId
        rendertquestions();
    } catch (error) {
        console.error(error)
    }


    document.getElementById('submit-btn').addEventListener('click', submitExam);
    document.getElementById('reset-btn').addEventListener('click', resetExam);
});

// 渲染题目
function rendertquestions() {
    const container = document.getElementById('titles-container');
    container.innerHTML = '';

    examData.forEach(item => {
        const titleEl = document.createElement('div');
        titleEl.className = 'title';
        titleEl.id = `title-${item.id}`;

        let itemHTML = `
                    <div class="title-title">
                        ${item.id}. ${item.question_text}
                        <span class="title-type ${item.type === 'single' ? 'single-choice' : 'judgement'}">
                            ${item.type === 'single' ? '单选题' : '判断题'}
                        </span>
                    </div>
                `;

        let imgs = JSON.parse(item.question_images)
        if (imgs.length > 0) {
            itemHTML += `
                        <div class="title-image">
                            <img src="${imgs[0].image}" alt="题目图片">
                    `;
            if (imgs[1]) {
                itemHTML += `<img src="${imgs[1].image}" alt="题目图片">
                        </div>`
            }
        }

        itemHTML += `<div class="options">`;

        JSON.parse(item.options).forEach(option => {
            itemHTML += `
                        <div class="option">
                            <input type="radio" id="q${item.id}_${option.id}" name="${item.id}" value="${option.id}">
                            <label for="q${item.id}_${option.id}">
                                <div class="option-content">
                                    ${option.id}. ${option.text || ''}
                                    ${option.image ? `<img src="${option.image}" alt="选项图片">` : ''}
                                </div>
                            </label>
                        </div>
                    `;
        });

        itemHTML += `</div>`;
        itemHTML += `<div class="title-result" id="result-${item.id}"></div>`;

        titleEl.innerHTML = itemHTML;
        container.appendChild(titleEl);
    });
}

// 提交考试
function submitExam() {
    const studentName = document.getElementById('student-name').value.trim();
    const studentId = document.getElementById('student-id').value.trim();
    const studentClass = document.getElementById('student-class').value.trim();

    // 验证个人信息
    if (!studentName || !studentId || !studentClass) {
        alert('宝儿🤗，姓名，学号，班级，忘了哪个呢？');
        return;
    }

    let score = 0;
    const totalQuestions = examData.length;
    wrongQuestions = []; // 重置错题数组

    examData.forEach(question => {
        const selectedOption = document.querySelector(`input[name="${question.id}"]:checked`);
        const resultEl = document.getElementById(`result-${question.id}`);

        if (selectedOption) {
            if (selectedOption.value === question.correct_answer) {
                score += 2;
                resultEl.innerHTML = `
                            <div class="correct">
                                <span class="answer-status correct-answer">✓ 回答正确</span>
                                <div class="explanation">${question.explanation}</div>
                            </div>
                        `;
            } else {
                resultEl.innerHTML = `
                            <div class="incorrect">
                                <span class="answer-status incorrect-answer">✗ 回答错误</span>
                                <div>正确答案: <span class="correct-answer">${question.correct_answer}</span></div>
                                <div class="explanation">${question.explanation}</div>
                            </div>
                        `;

                // 添加到错题数组
                wrongQuestions.push({
                    id: question.id,
                    questionText: question.question_text,
                    correctAnswer: question.correct_answer,
                    userAnswer: selectedOption.value,
                    explanation: question.explanation
                });
            }
        } else {
            resultEl.innerHTML = `
                        <div class="incorrect">
                            <span class="answer-status incorrect-answer">未作答</span>
                            <div>正确答案: <span class="correct-answer">${question.correct_answer}</span></div>
                            <div class="explanation">${question.explanation}</div>
                        </div>
                    `;

            console.log(question, '111')
            // 添加到错题数组
            wrongQuestions.push({
                id: question.id,
                questionText: question.question_text,
                correctAnswer: question.correct_answer,
                userAnswer: "未作答",
                explanation: question.explanation
            });
        }
    });

    const resultContainer = document.getElementById('result');
    let wrongQuestionsHTML = '';

    if (wrongQuestions.length > 0) {
        wrongQuestionsHTML = `
                    <div class="wrong-titles-summary">
                        <h3>错题汇总 (${wrongQuestions.length}题)</h3>
                        ${wrongQuestions.map(q => `
                            <div class="wrong-title-item">
                                <p><strong>题目${q.id}:</strong> ${q.questionText}</p>
                                <p><strong>你的答案:</strong> ${q.userAnswer}</p>
                                <p><strong>正确答案:</strong> ${q.correctAnswer}</p>
                                <p><strong>解析:</strong> ${q.explanation}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
    }

    resultContainer.innerHTML = `
                <div class="student-info-display">
                    <p><strong>考生信息</strong></p>
                    <p>姓名: ${studentName}</p>
                    <p>学号: ${studentId}</p>
                    <p>班级: ${studentClass}</p>
                </div>
                <div class="score">得分: ${score}/${totalQuestions * 2}</div>
                ${wrongQuestionsHTML}
            `;
    resultContainer.style.display = 'block';

    // 禁用所有选项
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.disabled = true;
    });

    // 禁用个人信息输入
    document.getElementById('student-name').disabled = true;
    document.getElementById('student-id').disabled = true;
    document.getElementById('student-class').disabled = true;

    exportwrongQuestions() // 保存错题到服务器

    // 滚动到结果区域
    resultContainer.scrollIntoView({ behavior: 'smooth' });

    // 停止计时器
    clearInterval(timerInterval);
}

// 重置考试
function resetExam() {
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = false;
        input.disabled = false;
    });

    document.querySelectorAll('.title-result').forEach(el => {
        el.innerHTML = '';
    });

    document.getElementById('result').style.display = 'none';
    document.getElementById('export-btn').style.display = 'none';

    // 启用个人信息输入
    document.getElementById('student-name').disabled = false;
    document.getElementById('student-id').disabled = false;
    document.getElementById('student-class').disabled = false;

    // 清空错题数组
    wrongQuestions = [];
}

// 计时器功能
let totalSeconds = totalQuestions.length * 0.5; // 60分钟
const timerElement = document.getElementById('timer');

function updateTimer() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (totalSeconds <= 0) {
        clearInterval(timerInterval);
        alert('考试时间到！系统将自动提交试卷。');
        submitExam();
    } else {
        totalSeconds--;
    }
}

const timerInterval = setInterval(updateTimer, 1000);
