document.getElementById("analyze").addEventListener("click", () => {
    let feature = document.getElementById("feature").value;
    let codeEditor = document.querySelector(".monaco-editor textarea");

    if (!codeEditor) {
        alert("Error: Unable to find LeetCode's code editor!");
        return;
    }

    let code = codeEditor.value.trim();
    
    chrome.runtime.sendMessage({ code, feature }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Runtime Error:", chrome.runtime.lastError);
            alert("Error: Could not communicate with the extension background script. Try refreshing the page.");
            return;
        }

        if (!response || !response.result) {
            alert("AI Analysis Failed! No response from the backend server. Is it running?");
            return;
        }

        alert(`AI Analysis Result:\n\n${response.result}`);
    });
});
