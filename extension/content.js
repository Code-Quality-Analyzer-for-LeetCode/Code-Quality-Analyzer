(function () {
    console.log("LeetCode AI Sidebar Injected");

    // ✅ Ensure Marked.js is loaded
    if (!window.marked) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/marked/4.0.12/marked.min.js";
        script.onload = () => console.log("✅ Marked.js Loaded!");
        document.head.appendChild(script);
    }

    // Create Sidebar UI
    const sidebar = document.createElement("div");
    sidebar.id = "ai-sidebar";
    Object.assign(sidebar.style, {
        position: "fixed", top: "50px", right: "-320px", width: "300px", height: "100vh",
        backgroundColor: " #fff", borderLeft: "4px solid rgb(230, 104, 7)", boxShadow: "-2px 0 12px rgba(0,0,0,0.2)",
        zIndex: "10000", padding: "15px", overflowY: "auto", transition: "right 0.4s ease-in-out",
        fontFamily: "Arial, sans-serif"
    });
    document.body.appendChild(sidebar);

    // Floating Circular AI Button
    const toggleBtn = document.createElement("button");
    toggleBtn.innerText = "";
    Object.assign(toggleBtn.style, {
        position: "fixed", bottom: "20px", right: "20px", width: "55px", height: "55px",
        backgroundColor: "#282828", color: "white", border: "2px solid #FFA116", cursor: "pointer",
        zIndex: "10001", borderRadius: "50%", fontWeight: "bold", transition: "all 0.3s ease",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
    });

    // Adding the AI logo image inside the button
    const aiImage = document.createElement("img");
    aiImage.src = chrome.runtime.getURL("chatbot.svg"); // Ensure you have chatbot.svg in your extension folder
    aiImage.alt = "AI";
    Object.assign(aiImage.style, {
        width: "85%", height: "85%", objectFit: "contain",
        borderRadius: "50%", objectPosition: "center"
    });

    toggleBtn.appendChild(aiImage);
    toggleBtn.onclick = () => sidebar.style.right = sidebar.style.right === "0px" ? "-320px" : "0px";
    document.body.appendChild(toggleBtn);
 
     // Tooltip Box for Hover Effect
     const tooltip = document.createElement("div");
     tooltip.innerText = "AI Code Analysis";
     Object.assign(tooltip.style, {
         position: "fixed", bottom: "30px", right: "80px",
         backgroundColor: "#282c34", color: "#ffcc00", padding: "8px 12px",
         borderRadius: "5px", fontSize: "12px", display: "none",
         boxShadow: "0 2px 6px rgba(0,0,0,0.2)", fontWeight: "bold"
     });
 
     // Show tooltip on hover
     toggleBtn.onmouseover = () => {
         tooltip.style.display = "block";
     };
 
     // Hide tooltip when not hovering
     toggleBtn.onmouseout = () => {
         tooltip.style.display = "none";
     };
 
     toggleBtn.onclick = () => {
         sidebar.style.right = sidebar.style.right === "0px" ? "-320px" : "0px";
     };
 
     document.body.appendChild(toggleBtn);
     document.body.appendChild(tooltip);
 
    // Sidebar Header
    const header = document.createElement("h2");
    header.innerText = "AI Code Analysis";
    Object.assign(header.style, { textAlign: "center", color: "rgb(230, 104, 7)", marginBottom: "10px" });
    sidebar.appendChild(header);

    // Feature Buttons
    const features = [
        { text: "Plagiarism Check", emoji: "🔍" },
        { text: "Syntax Analysis", emoji: "📑" },
        { text: "Code Quality Score", emoji: "⭐" },
        { text: "AI Hints", emoji: "🤖" },
        { text: "Smart Test Case Analysis", emoji: "🧪" },
        { text: "Optimization Suggestions", emoji: "⚡" },
        { text: "Adaptive Hints", emoji: "🎯" },
        { text: "Performance Insights", emoji: "🚀" },
        { text: "Complexity Analysis", emoji: "📊" },
        { text: "Code Comments", emoji: "📝" },
        { text: "Naming Suggestions", emoji: "🔠" },
        { text: "Similarity Detector", emoji: "🔎" }
    ];
    
    features.forEach(feature => {
        const btn = document.createElement("button");
        btn.innerText = `${feature.emoji} ${feature.text}`;
        Object.assign(btn.style, {
            display: "flex", alignItems: "center", justifyContent: "flex-start",
            width: "100%", margin: "5px 0", padding: "10px",
            backgroundColor: "rgb(46, 48, 50)", color: "white", border: "none",
            cursor: "pointer", fontSize: "14px", borderRadius: "5px",
            fontWeight: "bold", transition: "all 0.3s ease"
        });
    
        btn.onmouseover = () => btn.style.backgroundColor = "rgb(230, 104, 7)";
        btn.onmouseout = () => btn.style.backgroundColor = "rgb(46, 48, 50)";
        btn.onclick = () => analyzeCode(feature.text);
        
        sidebar.appendChild(btn);
    });
    

    // Extract Code from LeetCode Editor with Language Detection
    function extractCode() {
        const editor = document.querySelector(".monaco-editor");
        if (!editor) return { code: "", language: "Unknown" };

        const codeElements = editor.querySelectorAll(".view-lines > div");
        let code = "";
        codeElements.forEach(line => {
            code += line.innerText + "\n";
        });
        code = code.trim();

        // Robust language detection covering all LeetCode languages
        let language = "Auto-detect";
        
        // Look for the active language in LeetCode's DOM (Monaco editor attribute)
        const modeElement = document.querySelector("[data-mode-id]");
        if (modeElement) {
            language = modeElement.getAttribute("data-mode-id");
        } else {
            // Fallback: Look for the language dropdown button text
            const langBtn = document.querySelector('button[id^="headlessui-listbox-button"]');
            if (langBtn) {
                language = langBtn.innerText;
            }
        }
        
        console.log("Detected Language:", language);
        return { code, language };
    }

    // Send Code to Backend for Analysis
    function analyzeCode(feature) {
        const { code, language } = extractCode();
        if (!code) return showModal("Error", "No code found! Write some code before running AI analysis.");

        chrome.runtime.sendMessage({ feature, code, language }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Message error:", chrome.runtime.lastError);
                return showModal("AI Analysis Failed!", "Extension communication error.");
            }
            let result = response?.result || "AI Analysis Failed! Check Console.";

            if (typeof window.marked !== "undefined") {
                result = `<div style="color: black; background-color: white; padding: 10px;">${window.marked.parse(result)}</div>`;
            }

            showModal("AI Analysis Result", `<span style='color: black;'>${result}</span>`);
        });
    }

    // Show AI Analysis Results in Modal
    function showModal(title, content) {
        let modal = document.getElementById("ai-modal");
        
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "ai-modal";
            Object.assign(modal.style, {
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                backgroundColor: "#fff", padding: "20px", borderRadius: "8px",
                boxShadow: "0 0 10px rgba(0,0,0,0.2)", zIndex: "10002", 
                width: "500px", maxHeight: "80vh", overflowY: "auto", textAlign: "left",
                fontSize: "14px", lineHeight: "1.5"
            });
    
            document.body.appendChild(modal);
        }
    
        // **CLEAR ONLY THE CONTENT** (don't remove the close button)
        modal.innerHTML = `<h3 style="color:rgb(230, 104, 7);">${title}</h3><p>${content}</p>`;
    
        // Check if close button exists, if not, create it
        let crossButton = document.getElementById("ai-close-btn");
        if (!crossButton) {
            crossButton = document.createElement("button");
            crossButton.id = "ai-close-btn";
            crossButton.innerHTML = "&times;"; // '×' symbol
            Object.assign(crossButton.style, {
                position: "absolute", top: "10px", right: "10px",
                backgroundColor: "transparent", color: "black",
                border: "none", cursor: "pointer", fontSize: "20px",
                fontWeight: "bold", zIndex: "10003" // Ensures it's always on top
            });
    
            crossButton.onclick = () => modal.style.display = "none";  // Close modal
            modal.appendChild(crossButton); // Append button once
        }
    
        modal.style.display = "block";
    }
    
})();
