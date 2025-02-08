import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDb from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js";
import {app, server} from "./socket/socket.js";

dotenv.config({});

const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true
}

const PORT = process.env.PORT || 8000;

connectDb();

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({extended: true}));
app.use(cors(corsOptions));

//root
app.get("/",(req,res)=>{
    res.send("welocme to the social media");
});

// api
app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messageRoute);

server.listen(PORT, () => {
    console.log(`server started at port ${PORT}`)
})
