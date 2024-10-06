console.log("chatbot.js script running");

const url = new URL(window.location.href);
const urlLink = url.href;
const websiteText = document.body.innerText;
const websiteEntireHTML = document.body.innerHTML;

let conversationHistory = [];
let credibilityResult = ""; // This will hold the full credibility analysis
let sensitiveWarningDisplayed = false; // Track if the sensitive information warning has been displayed
let credibilityMessageDisplayed = false; // Track if the credibility message has been displayed
let credibilityEvaluationShown = false; // Track if the credibility evaluation has been shown

function updateConversation(role, content) {
    conversationHistory.push({ "role": role, "content": content });
}

function setCredibilityIndicator(credibilityLevel) {
    const chatbotContainer = document.getElementById('chatbot-container');
    chatbotContainer.className = ''; // Clear all previous classes
    chatbotContainer.classList.add(`${credibilityLevel}-credibility`);
}

function displayCredibilityMessage(credibilityLevel) {
    if (credibilityMessageDisplayed) return; // Exit the function if the message has already been displayed

    const messages = document.getElementById('messages');

    let credibilityMessage = "";
    switch (credibilityLevel) {
        case 'low':
            credibilityMessage = "Warning: Low credibility detected.";
            break;
        case 'medium':
            credibilityMessage = "Notice: Medium credibility detected.";
            break;
        case 'high':
            credibilityMessage = "I evaluated the credibility of this website. Would you like to see the results?";
            break;
        default:
            credibilityMessage = "Credibility analysis underway.";
            break;
    }

    // Create a container for the credibility message and button
    const messageContainer = document.createElement("div");
    messageContainer.className = `${credibilityLevel}-message message-container`;
    messageContainer.innerHTML = credibilityMessage;

    // Add the message container to the messages div
    messages.appendChild(messageContainer);

    // Create the "See More" button if it doesn't already exist
    let seeMoreButton = document.getElementById('seeMoreButton');
    if (!seeMoreButton) {
        seeMoreButton = document.createElement("button");
        seeMoreButton.id = "seeMoreButton";
        seeMoreButton.textContent = "See More";
        seeMoreButton.onclick = function () {
            displayFullCredibilityMessage();
            seeMoreButton.remove();
        };

        // Append the button to the message container
        messageContainer.appendChild(seeMoreButton);
    }

    credibilityMessageDisplayed = true;
}

function displayFullCredibilityMessage() {
    if (credibilityEvaluationShown) return; // Prevent displaying the evaluation multiple times

    const messages = document.getElementById('messages');
    const fullMessageDiv = document.createElement("div");
    fullMessageDiv.className = "bot-message credibility-result";

    // Change to add paragraph breaks
    fullMessageDiv.innerHTML = credibilityResult.replace(/\n/g, "<br>");

    messages.appendChild(fullMessageDiv);

    credibilityEvaluationShown = true; // Mark that the evaluation has been shown
}

function checkForMedicalInformation(textContent) {
    const medicalKeywords = ["vaccine", "medical", "vaccinated", "vaccines"];
    const lowerCaseText = textContent.toLowerCase();

    let medicalTermCount = 0;
    medicalKeywords.forEach(keyword => {
        medicalTermCount += (lowerCaseText.match(new RegExp(keyword, 'g')) || []).length;
    });

    console.log("Medical keyword count: " + medicalTermCount);
    return medicalTermCount > 10;
}

function displaySensitiveInformationWarning() {
    if (sensitiveWarningDisplayed) return; // Exit if the warning has already been displayed

    const messages = document.getElementById('messages');
    const warningDiv = document.createElement("div");
    warningDiv.className = "sensitive-info-warning";
    warningDiv.textContent = "Sensitive Information Warning: This website may contain information about health. Always consult with a healthcare professional.";
    messages.prepend(warningDiv);

    sensitiveWarningDisplayed = true;
    console.log("in displaySensitiveInformation function");
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function initChatbot() {
    // Create and append the chatbot container to the page
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'chatbot-container';
    document.body.appendChild(chatbotContainer);

    // Add the HTML for the chatbot interface
    chatbotContainer.innerHTML = `
    <div id="messages" style="max-height: 500px; overflow-y: auto; margin-bottom: 10px;"></div>
    <div id="input-area" class="clearfix">
        <input type="text" id="userInput" placeholder="Type a message..." style="width: 80%; float: left;" />
        <button id="sendButton" style="float: right;">Send</button>
    </div>
    `;

    const userInput = document.getElementById('userInput');
    const messages = document.getElementById('messages');
    const sendButton = document.getElementById('sendButton');

    // Add event listener for the send button
    sendButton.addEventListener('click', () => {
        const query = userInput.value.trim();
        if (query === '') return; // Do nothing if the input is empty
        userInput.value = ''; // Clear input field after sending

        // Display the user's message in the chatbot interface
        const userMessageDiv = document.createElement("div");
        userMessageDiv.className = "user-message"; // CSS class for styling
        userMessageDiv.textContent = query;
        messages.appendChild(userMessageDiv); // Append the user's message to the message container

        scrollToBottom(); // Scroll to the latest message
        updateConversation("user", query); // Update conversation history

        // Call the API only if there is a valid query
        if (query) {
            makeAPIFetch();
        } else {
            console.log("No search query found.");
        }
    });

    // Add "Enter" key support for sending messages
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButton.click(); // Trigger the click event on Enter key press
        }
    });

    makeAPIFetch(); // Fetch the initial credibility assessment
}

function makeAPIFetch() {
    const messages = document.getElementById('messages');
    const apiKey = "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";
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            "model": "gpt-4-turbo",
            "messages": conversationHistory.length === 0 ? [
                {
                    "role": "system",
                    "content": "You are a professional assistant meant to help users determine the credibility of the website " +
                    "they are currently on. Evaluate the credibility of the website passed to you, as well as any questions the user has in less " +
                    "than 10 sentences. The credibility of the website should be evaluated in 5 clearly-labeled and numbered criteria: disclosure of authorship, disclosure of " +
                    "ownership, ad volume, volume of promoted content, and type of organization (nonprofit, government, for-profit etc)." +

                    "Lower ad volume and lower volume of promoted content should indicate higher credibility. " +

                    "In your first sentence, clearly state whether " +
                    "this website has high, medium, or low credibility." +

                    "Then, display your credibility message in these 5 criteria, clearly numbered and labeled. " +
                    "Then, evaluate if there is potential bias in the website's text passed to you. Ask the user if it would like to learn more " +
                    "about the results and answer any questions the user might have. Keep every response to ten sentences."},
                
                {
                    "role": "user",
                    "content": urlLink
                },
                {
                    "role": "user",
                    "content": websiteText
                },
            ] : conversationHistory
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("API Response:", data);
        if (data.choices && data.choices.length > 0) {
            const ans = data.choices[0].message.content;
            credibilityResult = ans; // Save the full message
            updateConversation("assistant", ans);

            // Display the credibility message only once
            if (!credibilityMessageDisplayed) {
                let credibilityLevel = "high"; // Default
                if (ans.toLowerCase().includes('low credibility')) {
                    credibilityLevel = 'low';
                } else if (ans.toLowerCase().includes('medium credibility')) {
                    credibilityLevel = 'medium';
                }
                setCredibilityIndicator(credibilityLevel);
                displayCredibilityMessage(credibilityLevel);
            }

            // Append the assistant's response to the chat interface if user interaction occurred
            if (conversationHistory.length > 1) {
                const botMessageDiv = document.createElement("div");
                botMessageDiv.className = "bot-message";
                botMessageDiv.innerHTML = ans.replace(/\n/g, "<br>"); // Preserve paragraph breaks
                messages.appendChild(botMessageDiv);

                scrollToBottom(); // Ensure the latest message is visible    
            }
        } else {
            messages.innerHTML += '<div class="bot-message">Error: Unable to evaluate website credibility at this time.</div>';
        }

        if (checkForMedicalInformation(websiteText)) {
            displaySensitiveInformationWarning();
        }

    })
    .catch(error => {
        messages.innerHTML += `<div class="bot-message">Error: ${error.message}</div>`;
    });
}

function checkAndInitChatbot() {
    const currentUrl = window.location.href;
    const excludedUrlsPatterns = [
        /https:\/\/www\.google\..*\/search/,
        /https:\/\/mail\.google\.com\//,
        /https:\/\/www\.figma\.com\//,
        /https:\/\/docs\.google\.com\//,
        /https:\/\/slides\.google\.com\//,
        /https:\/\/chat\.openai\.com\//,
        /https:\/\/chatgpt\.com\//,
        ///https:\/\/.pdf\//
    ];

    const isExcludedUrl = excludedUrlsPatterns.some(pattern => pattern.test(currentUrl));

    if (!isExcludedUrl) {
        initChatbot();
    } else {
        console.log("Chatbot will not load on this site.");
    }
}

if (document.readyState === 'complete') {
    checkAndInitChatbot();
} else {
    window.addEventListener('load', checkAndInitChatbot);
}
