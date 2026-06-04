const express = require('express');

const app = express();
const PORT = 3333;

app.use(express.json())

app.get("/",(req, res) => {
    res.send("Hello Jinwoo");
});

app.post("/", (req, res) => {
  res.json({
    msg: "어머 POST도 가능하네요",
  });
});

app.post("/chat",(req,res) => {
    const { msg } = req.body;
    res.json({
        reply: `${msg}랍니다.`,
    });
});

app.listen(PORT, () => {
    console.log(`${PORT}에서 서버 실행 중`);
});