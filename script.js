
        // Application State
        let cards = [];
        let currentCardIndex = 0;
        let isFlipped = false;
        let currentStudyCards = [];
        let currentCategory = 'all';
        let currentTheme = 'light';
        let editingCardId = null;

        // Quiz State
        let quizActive = false;
        let quizTimer = null;
        let quizTimeLeft = 300; // 5 minutes
        let quizStats = { correct: 0, wrong: 0 };
        let quizCards = [];
        let currentQuizIndex = 0;

        // Default cards
        const defaultCards = [
            {
                id: Date.now() + Math.random(),
                question: "What is the capital of France?",
                answer: "Paris",
                category: "Geography",
                correctCount: 0,
                masteredAt: null
            },
            {
                id: Date.now() + Math.random() + 1,
                question: "What is 2 + 2?",
                answer: "4",
                category: "Math",
                correctCount: 0,
                masteredAt: null
            },
            {
                id: Date.now() + Math.random() + 2,
                question: "Who wrote Romeo and Juliet?",
                answer: "William Shakespeare",
                category: "Literature",
                correctCount: 0,
                masteredAt: null
            }
        ];

        // Initialize app
        function initApp() {
            loadCards();
            loadTheme();
            updateCategorySelectors();
            updateStudyCards();
            showCurrentCard();
            updateProgress();
            updateStreakCount();

            // Update stats
            setTimeout(() => {
                updateOverallStats();
                updateCategoryStats();
            }, 100);
        }

        // Theme Management
        function toggleTheme() {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            const themeToggle = document.querySelector('.theme-toggle');

            if (currentTheme === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
                themeToggle.innerHTML = '☀️ Light Mode';
            } else {
                document.body.removeAttribute('data-theme');
                themeToggle.innerHTML = '🌙 Dark Mode';
            }

            localStorage.setItem('studyCardsTheme', currentTheme);
        }

        function loadTheme() {
            const savedTheme = localStorage.getItem('studyCardsTheme');
            if (savedTheme) {
                currentTheme = savedTheme;
                if (currentTheme === 'dark') {
                    document.body.setAttribute('data-theme', 'dark');
                    document.querySelector('.theme-toggle').innerHTML = '☀️ Light Mode';
                }
            }
        }

        // Tab Management
        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
            event.target.classList.add('active');

            // Update content sections
            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');

            // Tab-specific updates
            if (tabName === 'manage') {
                updateCardList();
            } else if (tabName === 'progress') {
                updateOverallStats();
                updateCategoryStats();
            } else if (tabName === 'study') {
                updateStudyCards();
                showCurrentCard();
            }
        }

        // Card Management
        function loadCards() {
            const savedCards = localStorage.getItem('studyCards');
            if (savedCards) {
                cards = JSON.parse(savedCards);
            } else {
                cards = [...defaultCards];
                saveCards();
            }
        }

        function saveCards() {
            localStorage.setItem('studyCards', JSON.stringify(cards));
        }

        function createCard() {
            const question = document.getElementById('cardQuestion').value.trim();
            const answer = document.getElementById('cardAnswer').value.trim();
            const category = document.getElementById('cardCategory').value.trim() || 'General';

            if (!question || !answer) {
                showMessage('create', 'Please fill in both question and answer!', 'error');
                return;
            }

            const newCard = {
                id: Date.now() + Math.random(),
                question,
                answer,
                category,
                correctCount: 0,
                masteredAt: null
            };

            cards.push(newCard);
            saveCards();
            clearForm();
            updateCategorySelectors();
            showMessage('create', 'Card created successfully! 🎉', 'success');

            // Animate the form
            document.querySelector('.card-form').classList.add('animate-bounce');
            setTimeout(() => {
                document.querySelector('.card-form').classList.remove('animate-bounce');
            }, 1000);
        }

        function clearForm() {
            document.getElementById('cardQuestion').value = '';
            document.getElementById('cardAnswer').value = '';
            document.getElementById('cardCategory').value = '';
        }

        function deleteCard(cardId) {
            if (confirm('Are you sure you want to delete this card?')) {
                cards = cards.filter(card => card.id !== cardId);
                saveCards();
                updateCardList();
                updateCategorySelectors();
                updateStudyCards();
                showMessage('manage', 'Card deleted! 🗑️', 'success');
            }
        }

        function editCard(cardId) {
            const card = cards.find(c => c.id === cardId);
            if (card) {
                editingCardId = cardId;
                document.getElementById('editQuestion').value = card.question;
                document.getElementById('editAnswer').value = card.answer;
                document.getElementById('editCategory').value = card.category;
                document.getElementById('editModal').style.display = 'block';
            }
        }

        function saveEdit() {
            const question = document.getElementById('editQuestion').value.trim();
            const answer = document.getElementById('editAnswer').value.trim();
            const category = document.getElementById('editCategory').value.trim() || 'General';

            if (!question || !answer) {
                alert('Please fill in both question and answer!');
                return;
            }

            const cardIndex = cards.findIndex(c => c.id === editingCardId);
            if (cardIndex !== -1) {
                cards[cardIndex].question = question;
                cards[cardIndex].answer = answer;
                cards[cardIndex].category = category;
                saveCards();
                updateCardList();
                updateCategorySelectors();
                closeEditModal();
                showMessage('manage', 'Card updated! ✏️', 'success');
            }
        }

        function closeEditModal() {
            document.getElementById('editModal').style.display = 'none';
            editingCardId = null;
        }

        // Category Management
        function updateCategorySelectors() {
            const categories = ['all', ...new Set(cards.map(card => card.category))];
            const selectors = ['studyCategorySelector', 'manageCategorySelector', 'quizCategorySelector'];

            selectors.forEach(selectorId => {
                const selector = document.getElementById(selectorId);
                if (selector) {
                    selector.innerHTML = '';
                    categories.forEach(category => {
                        const btn = document.createElement('div');
                        btn.className = 'category-btn';
                        btn.textContent = category === 'all' ? 'All Cards' : category;
                        btn.dataset.category = category;
                        if (category === currentCategory) btn.classList.add('active');

                        btn.onclick = () => {
                            // Update active state
                            selector.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            currentCategory = category;

                            // Update relevant content
                            if (selectorId === 'studyCategorySelector') {
                                updateStudyCards();
                                showCurrentCard();
                            } else if (selectorId === 'manageCategorySelector') {
                                updateCardList();
                            }
                        };

                        selector.appendChild(btn);
                    });
                }
            });
        }

        // Study Mode
        function updateStudyCards() {
            currentStudyCards = cards.filter(card => {
                const notMastered = card.correctCount < 3;
                const matchesCategory = currentCategory === 'all' || card.category === currentCategory;
                return notMastered && matchesCategory;
            });

            if (currentCardIndex >= currentStudyCards.length) {
                currentCardIndex = 0;
            }

            updateProgress();
        }

        function showCurrentCard() {
            const questionEl = document.getElementById('questionText');
            const answerEl = document.getElementById('answerText');

            if (currentStudyCards.length === 0) {
                questionEl.textContent = currentCategory === 'all' 
                    ? "🎉 Congratulations! You've mastered all cards!" 
                    : `🎉 You've mastered all cards in ${currentCategory}!`;
                answerEl.textContent = "Create more cards or try a different category to continue studying.";
                return;
            }

            const card = currentStudyCards[currentCardIndex];
            questionEl.textContent = card.question;
            answerEl.textContent = card.answer;

            // Reset flip state
            isFlipped = false;
            document.getElementById('flashcard').classList.remove('flipped');

            // Add animation
            document.getElementById('flashcard').classList.add('animate-fadeInUp');
            setTimeout(() => {
                document.getElementById('flashcard').classList.remove('animate-fadeInUp');
            }, 600);
        }

        function flipCard() {
            const flashcard = document.getElementById('flashcard');
            flashcard.classList.toggle('flipped');
            isFlipped = !isFlipped;
        }

        function nextCard() {
            if (currentStudyCards.length === 0) return;

            currentCardIndex = (currentCardIndex + 1) % currentStudyCards.length;
            showCurrentCard();
        }

        function markCorrect() {
            if (currentStudyCards.length === 0) return;

            const card = currentStudyCards[currentCardIndex];
            const cardInMain = cards.find(c => c.id === card.id);

            cardInMain.correctCount++;

            if (cardInMain.correctCount >= 3) {
                cardInMain.masteredAt = new Date().toISOString();
                showMessage('study', `🎉 Card mastered! "${card.question}"`, 'success');
            } else {
                showMessage('study', `✅ Correct! (${cardInMain.correctCount}/3)`, 'success');
            }

            saveCards();
            updateCardsStudiedToday();
            updateStudyCards();

            setTimeout(() => {
                nextCard();
            }, 1500);
        }

        function markWrong() {
            if (currentStudyCards.length === 0) return;

            const card = currentStudyCards[currentCardIndex];
            const cardInMain = cards.find(c => c.id === card.id);

            cardInMain.correctCount = Math.max(0, cardInMain.correctCount - 1);

            showMessage('study', '❌ Keep practicing!', 'error');
            saveCards();
            updateCardsStudiedToday();

            setTimeout(() => {
                nextCard();
            }, 1500);
        }

        function shuffleCards() {
            for (let i = currentStudyCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [currentStudyCards[i], currentStudyCards[j]] = [currentStudyCards[j], currentStudyCards[i]];
            }
            currentCardIndex = 0;
            showCurrentCard();
            showMessage('study', '🔀 Cards shuffled!', 'success');
        }

        function resetProgress() {
            if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                cards.forEach(card => {
                    card.correctCount = 0;
                    card.masteredAt = null;
                });
                saveCards();
                updateStudyCards();
                showCurrentCard();
                updateProgress();
                showMessage('study', '🔄 Progress reset!', 'success');
            }
        }

        // Progress Tracking
        function updateProgress() {
            const totalCards = cards.filter(card => 
                currentCategory === 'all' || card.category === currentCategory
            ).length;

            const masteredCards = cards.filter(card => 
                card.correctCount >= 3 && 
                (currentCategory === 'all' || card.category === currentCategory)
            ).length;

            const progressPercent = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;

            document.getElementById('progressFill').style.width = progressPercent + '%';
            document.getElementById('progressText').textContent = 
                `${masteredCards} of ${totalCards} cards mastered`;
        }

        // Quiz Mode
        function startQuiz() {
            quizCards = cards.filter(card => 
                currentCategory === 'all' || card.category === currentCategory
            );

            if (quizCards.length === 0) {
                alert('No cards available for quiz!');
                return;
            }

            // Shuffle quiz cards
            for (let i = quizCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [quizCards[i], quizCards[j]] = [quizCards[j], quizCards[i]];
            }

            quizActive = true;
            quizTimeLeft = 300; // 5 minutes
            quizStats = { correct: 0, wrong: 0 };
            currentQuizIndex = 0;

            // Update UI
            document.getElementById('quizStartBtn').style.display = 'none';
            document.getElementById('quizWrongBtn').style.display = 'inline-block';
            document.getElementById('quizRightBtn').style.display = 'inline-block';
            document.getElementById('quizStopBtn').style.display = 'inline-block';
            document.getElementById('quizResults').style.display = 'none';

            showQuizCard();
            startQuizTimer();
        }

        function startQuizTimer() {
            quizTimer = setInterval(() => {
                quizTimeLeft--;
                const minutes = Math.floor(quizTimeLeft / 60);
                const seconds = quizTimeLeft % 60;
                document.getElementById('timer').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                if (quizTimeLeft <= 0) {
                    stopQuiz();
                }
            }, 1000);
        }

        function showQuizCard() {
            if (currentQuizIndex >= quizCards.length) {
                stopQuiz();
                return;
            }

            const card = quizCards[currentQuizIndex];
            document.getElementById('quizQuestion').textContent = card.question;
            document.getElementById('quizAnswer').textContent = card.answer;

            // Reset flip state
            document.getElementById('quizCard').classList.remove('flipped');
        }

        function flipQuizCard() {
            if (!quizActive) return;
            document.getElementById('quizCard').classList.toggle('flipped');
        }

        function quizMarkCorrect() {
            if (!quizActive) return;
            quizStats.correct++;
            nextQuizCard();
        }

        function quizMarkWrong() {
            if (!quizActive) return;
            quizStats.wrong++;
            nextQuizCard();
        }

        function nextQuizCard() {
            currentQuizIndex++;
            showQuizCard();
        }

        function stopQuiz() {
            quizActive = false;
            clearInterval(quizTimer);

            // Update UI
            document.getElementById('quizStartBtn').style.display = 'inline-block';
            document.getElementById('quizWrongBtn').style.display = 'none';
            document.getElementById('quizRightBtn').style.display = 'none';
            document.getElementById('quizStopBtn').style.display = 'none';

            // Show results
            const total = quizStats.correct + quizStats.wrong;
            const scorePercent = total > 0 ? Math.round((quizStats.correct / total) * 100) : 0;

            document.getElementById('quizCorrect').textContent = quizStats.correct;
            document.getElementById('quizWrong').textContent = quizStats.wrong;
            document.getElementById('quizScore').textContent = scorePercent + '%';
            document.getElementById('quizResults').style.display = 'block';

            // Reset timer display
            document.getElementById('timer').textContent = '05:00';

            // Reset quiz card
            document.getElementById('quizQuestion').textContent = 'Click "Start Quiz" to begin!';
            document.getElementById('quizAnswer').textContent = 'Good luck! 🍀';
        }

        // Card List Management
        function updateCardList() {
            const cardList = document.getElementById('cardList');
            const filteredCards = currentCategory === 'all' 
                ? cards 
                : cards.filter(card => card.category === currentCategory);

            if (filteredCards.length === 0) {
                cardList.innerHTML = '<p>No cards found in this category.</p>';
                return;
            }

            cardList.innerHTML = filteredCards.map(card => `
                <div class="card-item">
                    <div class="card-content">
                        <div class="card-question">${card.question}</div>
                        <div class="card-answer">${card.answer}</div>
                        <small>Category: ${card.category} | Progress: ${card.correctCount}/3 ${card.correctCount >= 3 ? '✅' : ''}</small>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-small btn-primary" onclick="editCard(${card.id})">✏️ Edit</button>
                        <button class="btn btn-small btn-error" onclick="deleteCard(${card.id})">🗑️ Delete</button>
                    </div>
                </div>
            `).join('');
        }

        // Import/Export
        function exportCards() {
            const dataStr = JSON.stringify(cards, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'studycards-export.json';
            link.click();

            URL.revokeObjectURL(url);
            showMessage('manage', 'Cards exported! 📤', 'success');
        }

        function importCards() {
            document.getElementById('importFile').click();
        }

        function handleImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedCards = JSON.parse(e.target.result);
                    if (Array.isArray(importedCards)) {
                        // Add unique IDs to imported cards
                        importedCards.forEach(card => {
                            if (!card.id) card.id = Date.now() + Math.random();
                            if (typeof card.correctCount !== 'number') card.correctCount = 0;
                            if (!card.masteredAt) card.masteredAt = null;
                        });

                        cards.push(...importedCards);
                        saveCards();
                        updateCategorySelectors();
                        updateCardList();
                        showMessage('manage', `${importedCards.length} cards imported! 📥`, 'success');
                    } else {
                        throw new Error('Invalid format');
                    }
                } catch (error) {
                    showMessage('manage', 'Error importing cards. Please check the file format.', 'error');
                }
            };
            reader.readAsText(file);

            // Reset file input
            event.target.value = '';
        }

        // Statistics
        function updateOverallStats() {
            const totalCards = cards.length;
            const masteredCards = cards.filter(card => card.correctCount >= 3).length;
            const progressPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

            document.getElementById('totalCards').textContent = totalCards;
            document.getElementById('masteredCards').textContent = masteredCards;
            document.getElementById('overallProgressFill').style.width = progressPercent + '%';
            document.getElementById('overallProgressText').textContent = progressPercent + '% Complete';

            // Update cards studied today
            const today = new Date().toDateString();
            const studiedToday = localStorage.getItem('cardsStudiedToday');
            const studiedData = studiedToday ? JSON.parse(studiedToday) : {};
            document.getElementById('cardsStudied').textContent = studiedData[today] || 0;
        }

        function updateCategoryStats() {
            const categoryProgress = document.getElementById('categoryProgress');
            const categories = [...new Set(cards.map(card => card.category))];

            if (categories.length === 0) {
                categoryProgress.innerHTML = '<p>Study some cards to see category statistics!</p>';
                return;
            }

            const categoryStats = categories.map(category => {
                const categoryCards = cards.filter(card => card.category === category);
                const masteredCards = categoryCards.filter(card => card.correctCount >= 3);
                const progressPercent = categoryCards.length > 0 ? 
                    Math.round((masteredCards.length / categoryCards.length) * 100) : 0;

                return {
                    name: category,
                    total: categoryCards.length,
                    mastered: masteredCards.length,
                    percent: progressPercent
                };
            });

            categoryProgress.innerHTML = categoryStats.map(stat => `
                <div class="stat-item" style="margin-bottom: 15px;">
                    <h4>${stat.name}</h4>
                    <div class="progress-bar" style="margin: 10px 0;">
                        <div class="progress-fill" style="width: ${stat.percent}%"></div>
                    </div>
                    <p>${stat.mastered}/${stat.total} cards (${stat.percent}%)</p>
                </div>
            `).join('');
        }

        function updateCardsStudiedToday() {
            const today = new Date().toDateString();
            const studiedToday = localStorage.getItem('cardsStudiedToday');
            const studiedData = studiedToday ? JSON.parse(studiedToday) : {};

            studiedData[today] = (studiedData[today] || 0) + 1;
            localStorage.setItem('cardsStudiedToday', JSON.stringify(studiedData));

            updateStreakCount();
        }

        function updateStreakCount() {
            const studiedToday = localStorage.getItem('cardsStudiedToday');
            if (!studiedToday) {
                document.getElementById('studyStreak').textContent = '0';
                return;
            }

            const studiedData = JSON.parse(studiedToday);
            let streak = 0;
            const today = new Date();

            for (let i = 0; i < 30; i++) { // Check last 30 days
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                const dateStr = checkDate.toDateString();

                if (studiedData[dateStr] && studiedData[dateStr] > 0) {
                    streak++;
                } else {
                    break;
                }
            }

            document.getElementById('studyStreak').textContent = streak;
        }

        // Utility Functions
        function showMessage(section, message, type) {
            const messageEl = document.getElementById(section + 'Message') || 
                            document.querySelector(`#${section} .message`) ||
                            document.createElement('div');

            messageEl.className = `message message-${type}`;
            messageEl.textContent = message;
            messageEl.style.display = 'block';

            // If message element doesn't exist, create and append it
            if (!messageEl.parentNode) {
                messageEl.id = section + 'Message';
                document.getElementById(section).appendChild(messageEl);
            }

            // Auto-hide after 3 seconds
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }

        // Initialize app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                closeEditModal();
            }
        }