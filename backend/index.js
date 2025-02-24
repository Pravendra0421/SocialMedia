import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDb from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js";
import {app, server} from "./socket/socket.js";
import path from "path";

dotenv.config({});

const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true
}

const PORT = process.env.PORT || 8000;

connectDb();
const _dirname=path.resolve();

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({extended: true}));
app.use(cors(corsOptions));



// api
app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messageRoute);

app.use(express.static(path.join(_dirname,"/frontend/dist")));
app.get('*',(_,res)=>{
    res.sendFile(path.resolve(_dirname,"frontend","dist","index.html"));
});

server.listen(PORT, () => {
    console.log(`server started at port ${PORT}`)
})
