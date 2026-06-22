// Set to localhost for testing. Once deployed, change to https://your-backend.onrender.com/api/analyze
const BACKEND_URL = "http://localhost:5000/api/analyze";
// This secret must exactly match the EXTENSION_SECRET in your backend's .env file
const EXTENSION_SECRET = "leetcode_ai_xyz_987654321"; 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received Request:", request);

    if (!request.code) {
        sendResponse({ result: "Error: No code detected!" });
        return true;
    }

    // Forward the request to your secure Node.js backend
    fetch(BACKEND_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-extension-secret": EXTENSION_SECRET
        },
        body: JSON.stringify({
            feature: request.feature,
            code: request.code,
            language: request.language || "Auto-detect"
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Backend Error:", data.error);
                sendResponse({ result: `AI Analysis Failed! Server returned: ${data.error}` });
                return;
            }

            console.log("Full Server Response:", data);
            sendResponse({ result: data.result || "AI Analysis Failed!" });
        })
        .catch(error => {
            console.error("Network Error:", error);
            sendResponse({ result: `AI Analysis Failed! Could not connect to the backend server. Make sure it is running. Error: ${error.message}` });
        });

    return true; // Keeps async response channel open
});
