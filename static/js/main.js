// Main JavaScript for LegalEase application

document.addEventListener('DOMContentLoaded', function() {
    // File upload name display
    const fileInput = document.getElementById('file-input');
    const fileLabel = document.querySelector('.file-label');
    
    if (fileInput && fileLabel) {
        fileInput.addEventListener('change', function() {
            if (fileInput.files.length > 0) {
                fileLabel.textContent = fileInput.files[0].name;
            } else {
                fileLabel.textContent = 'Choose a file';
            }
        });
    }
    
    // Document analysis page functionality
    const simplifyBtn = document.getElementById('simplify-tab');
    const summaryBtn = document.getElementById('summary-tab');
    const risksBtn = document.getElementById('risks-tab');
    const qaBtn = document.getElementById('qa-tab');
    
    const simplifyContent = document.getElementById('simplify-content');
    const summaryContent = document.getElementById('summary-content');
    const risksContent = document.getElementById('risks-content');
    const qaContent = document.getElementById('qa-content');
    
    const loadingSpinner = document.getElementById('loading-spinner');
    const questionInput = document.getElementById('question-input');
    const askButton = document.getElementById('ask-button');
    const answerContainer = document.getElementById('answer-container');
    
    // Tab switching functionality
    function switchTab(activeTab, activeContent) {
        // Hide all content sections
        [simplifyContent, summaryContent, risksContent, qaContent].forEach(content => {
            if (content) content.classList.add('hidden');
        });
        
        // Remove active class from all tabs
        [simplifyBtn, summaryBtn, risksBtn, qaBtn].forEach(tab => {
            if (tab) tab.classList.remove('active');
        });
        
        // Show active content and set active tab
        if (activeContent) activeContent.classList.remove('hidden');
        if (activeTab) activeTab.classList.add('active');
    }
    
    // Add event listeners to tabs if they exist
    if (simplifyBtn && simplifyContent) {
        simplifyBtn.addEventListener('click', function() {
            switchTab(simplifyBtn, simplifyContent);
            if (simplifyContent.innerHTML.trim() === '') {
                loadContent('simplify');
            }
        });
    }
    
    if (summaryBtn && summaryContent) {
        summaryBtn.addEventListener('click', function() {
            switchTab(summaryBtn, summaryContent);
            if (summaryContent.innerHTML.trim() === '') {
                loadContent('summarize');
            }
        });
    }
    
    if (risksBtn && risksContent) {
        risksBtn.addEventListener('click', function() {
            switchTab(risksBtn, risksContent);
            if (risksContent.innerHTML.trim() === '') {
                loadContent('explain_risks');
            }
        });
    }
    
    if (qaBtn && qaContent) {
        qaBtn.addEventListener('click', function() {
            switchTab(qaBtn, qaContent);
        });
    }
    
    // Function to load content from API
    function loadContent(promptType) {
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        
        fetch('/api/simplify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt_type: promptType })
        })
        .then(response => response.json())
        .then(data => {
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            
            // Format the response with markdown-like syntax
            let formattedText = data.result;
            
            // Replace ** with <strong> tags for bold text
            formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Replace * with <em> tags for italic text
            formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            // Replace newlines with <br> tags
            formattedText = formattedText.replace(/\n/g, '<br>');
            
            // Add the formatted text to the appropriate content section
            if (promptType === 'simplify' && simplifyContent) {
                simplifyContent.innerHTML = formattedText;
            } else if (promptType === 'summarize' && summaryContent) {
                summaryContent.innerHTML = formattedText;
            } else if (promptType === 'explain_risks' && risksContent) {
                risksContent.innerHTML = formattedText;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            
            // Show error message in the appropriate content section
            const errorMessage = '<div class="error-message">An error occurred while processing your document. Please try again.</div>';
            
            if (promptType === 'simplify' && simplifyContent) {
                simplifyContent.innerHTML = errorMessage;
            } else if (promptType === 'summarize' && summaryContent) {
                summaryContent.innerHTML = errorMessage;
            } else if (promptType === 'explain_risks' && risksContent) {
                risksContent.innerHTML = errorMessage;
            }
        });
    }
    
    // Q&A functionality
    if (askButton && questionInput && answerContainer) {
        askButton.addEventListener('click', function() {
            const question = questionInput.value.trim();
            if (!question) return;
            
            // Show loading spinner
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');
            
            // Create a new question element
            const questionElement = document.createElement('div');
            questionElement.className = 'qa-question';
            questionElement.innerHTML = `<strong>Q:</strong> ${question}`;
            answerContainer.appendChild(questionElement);
            
            // Clear the input field
            questionInput.value = '';
            
            // Send the question to the API
            fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: question })
            })
            .then(response => response.json())
            .then(data => {
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                
                // Create a new answer element
                const answerElement = document.createElement('div');
                answerElement.className = 'qa-answer';
                
                // Format the answer with markdown-like syntax
                let formattedAnswer = data.answer || 'Sorry, I could not generate an answer.';
                
                // Replace ** with <strong> tags for bold text
                formattedAnswer = formattedAnswer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                
                // Replace * with <em> tags for italic text
                formattedAnswer = formattedAnswer.replace(/\*(.*?)\*/g, '<em>$1</em>');
                
                // Replace newlines with <br> tags
                formattedAnswer = formattedAnswer.replace(/\n/g, '<br>');
                
                answerElement.innerHTML = `<strong>A:</strong> ${formattedAnswer}`;
                answerContainer.appendChild(answerElement);
                
                // Scroll to the bottom of the answer container
                answerContainer.scrollTop = answerContainer.scrollHeight;
            })
            .catch(error => {
                console.error('Error:', error);
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                
                // Create a new error element
                const errorElement = document.createElement('div');
                errorElement.className = 'qa-error';
                errorElement.innerHTML = '<strong>Error:</strong> An error occurred while processing your question. Please try again.';
                answerContainer.appendChild(errorElement);
            });
        });
        
        // Allow pressing Enter to submit the question
        questionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                askButton.click();
            }
        });
    }
    
    // If we're on the document page, load the simplified content by default
    if (window.location.pathname.includes('/document') && simplifyBtn && simplifyContent) {
        simplifyBtn.click();
    }
});