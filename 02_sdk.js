//nodemon 02_sdk.js
require("dotenv").config();

const express = require("express");

const { GoogleGenAI } = require("@google/genai")
const Groq = require("groq-sdk"); 

const app = express();
const PORT = 3000;
const genAI = new GoogleGenAI(
    {apiKey : process.env.GEMINI_API_KEY});
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY});

app.get("/", async (req, res) =>{
    const modelName = "gemma-4-31b-it";
    const result = await genAI.models.generateContent({
        model: modelName,
        contents: "점심메뉴 추천",
    });
    res.json({
        answer: result.text,
    });
});
app.get("/groq", async (req, res) =>{
    const modelName = "openai/gpt-oss-20b";
    const result = await groq.chat.completions.create({
        messages: [{ role: 'user', content: '점심메뉴 추천' }],
        model: modelName,
    });
    res.json({
       answer: result.choices[0].message.content,
  });
});

app.listen(PORT, () =>{
    console.log(`${PORT}로 작동중`);
});