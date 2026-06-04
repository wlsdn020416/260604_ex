require("dotenv").config();
const express = require("express");
const {GoogleGenAI} = require("@google/genai");
const GroqAI = require("groq-sdk");
const path = require("path");
const PORT = process.env.PORT;

const app = express();
const google = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
const groq = new GroqAI({apiKey: process.env.GROQ_API_KEY});

app.use(express.json());

app.use(
    express.static(path.join(__dirname,"public")));

app.post("/chat", async (req,res)=>{
    const{
        provider,
        model,
        ask,
    }=req.body;
    
    let result;
    switch(true){
        case provider === "google":
            console.log("google 요청");
            result = await useGoogle(model, ask);
            break;
            case provider === "groq":
                console.log("groq 요청");
                result = await useGroq(model, ask);
            break;
        default:
            console.log("잘못됨");
           return; res.status(404).json({msg: "존재하지 않는 provider"});
    }

    res.json({
        provider,
        model,
        ask,
        answer: result,
    });
});

async function useGoogle(model, ask) {
  const response = await google.models.generateContent({
    model, // 못 쓰는 모델은 예외처리될 예정
    contents: ask,
  });
  return response.text;
}
async function useGroq(model, ask) {
  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: ask }],
    model,
  });
  //   res.json({ msg: "GroqAI" });
  return response.choices[0].message.content;
}

app.listen(PORT, () => {
    console.log(`${PORT}에서 실행`);
});