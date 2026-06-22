require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: false,
})); // Sets secure HTTP headers, disable CORP to allow extension fetch
app.use(cors({
    origin: '*', // Allow all origins
    allowedHeaders: '*' // Allow all headers including custom ones
}));
app.use(express.json()); // Parse JSON bodies

// Rate limiting removed per user request

// Authentication Middleware
// Ensures only requests with your custom Extension Secret are processed
const authenticateExtension = (req, res, next) => {
    const extensionSecret = req.headers["x-extension-secret"];
    if (extensionSecret !== process.env.EXTENSION_SECRET) {
        return res.status(403).json({ error: "Unauthorized request" });
    }
    next();
};

// --- Prompt Generation Logic (Moved from Frontend) ---
function getFeaturePrompt(feature, code, language) {
    switch (feature) {
        case "Plagiarism Check":
            return `Check if the following ${language} code resembles common plagiarized implementations. Discuss conceptually without providing direct code:\n\n${code}`;
        case "Syntax Analysis":
            return `Analyze the syntax of this ${language} code. Point out any errors and explain how to fix them, but DO NOT provide the corrected code block:\n\n${code}`;
        case "Code Quality Score":
            return `Analyze the quality of this ${language} code. Provide a detailed explanation of its strengths and weaknesses, give it a final Code Quality Score out of 10, and suggest concepts for improvement without writing the code:\n\n${code}`;
        case "AI Hints":
            return `Provide hints to solve the problem in this ${language} code without revealing the full solution or direct code:\n\n${code}`;
        case "Smart Test Case Analysis":
            return `Describe edge cases and generate real-world test cases (inputs/outputs) for this ${language} code:\n\n${code}`;
        case "Optimization Suggestions":
            return `Suggest optimization strategies for this ${language} code to improve efficiency. Explain the concepts (e.g., algorithmic changes) WITHOUT writing the optimized code for the user:\n\n${code}`;
        case "Adaptive Hints":
            return `Provide adaptive conceptual hints for improving the approach in this ${language} code based on its current state:\n\n${code}`;
        case "Performance Insights":
            return `Analyze the performance bottlenecks in this ${language} code and suggest structural improvements without writing the solution:\n\n${code}`;
        case "Complexity Analysis":
            return `Determine the time and space complexity of this ${language} code and explain why:\n\n${code}`;
        case "Code Comments":
            return `Explain conceptually what meaningful comments should be added to this ${language} code to enhance readability, rather than rewriting the code itself:\n\n${code}`;
        case "Naming Suggestions":
            return `Suggest better variable and function naming conventions for this ${language} code:\n\n${code}`;
        case "Similarity Detector":
            return `Discuss the similarity of this ${language} code with other common LeetCode patterns conceptually, without providing optimal code snippets:\n\n${code}`;
        default:
            return `Analyze the following ${language} code in detail. Explain how the logic works, suggest conceptual improvements, and provide a Code Quality Score out of 10. DO NOT provide direct code solutions:\n\n${code}`;
    }
}

// --- Main API Route ---
app.post("/api/analyze", authenticateExtension, async (req, res) => {
    const { feature, code, language } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Missing required parameter: code" });
    }

    const prompt = getFeaturePrompt(feature, code, language || "Auto-detect");

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { 
                        role: "system", 
                        content: "You are an expert LeetCode programming assistant. Always identify the programming language first if it's not explicitly provided, and format your response neatly using Markdown. CRITICAL RULE: The main purpose of this tool is to teach. YOU MUST NEVER PROVIDE DIRECT CODE SOLUTIONS OR REWRITE THE COMPLETE CODE. Only give suggestions, hints, logical explanations, and point out specific areas to improve." 
                    },
                    { role: "user", content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API Error:", errorText);
            try {
                const errObj = JSON.parse(errorText);
                if (errObj.error && errObj.error.message) {
                    return res.status(response.status).json({ error: errObj.error.message });
                }
            } catch(e) {}
            return res.status(response.status).json({ error: "Failed to communicate with AI provider." });
        }

        const data = await response.json();
        const resultText = data?.choices?.[0]?.message?.content || "AI Analysis Failed!";
        
        res.json({ result: resultText });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Health check endpoint for Render
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

app.listen(PORT, () => {
    console.log(`Secure AI Backend running on port ${PORT}`);
});
