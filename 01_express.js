const express = require('express');

const app = express();
const PORT = 3333;

app.get("/",(req, res) => {
    res.send("Hello Jinwoo");
});

app.post("/",(req,res) => {
    res.json({
        msg: "post",
    });
});

app.listen(PORT, () => {
    console.log(`${PORT}에서 서버 실행 중`);
});