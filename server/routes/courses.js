import express from "express";
import pool from "../db/pool.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import argon2 from "argon2";

const router = express.Router();
router.use(express.json());
router.use(cookieParser());

router.get("/courses", async(req, res)=>{
    try{
        const conn = await pool.getConnection();
        const rows = await conn.query(
        "describe curs"
        );
        conn.release();
        
        res.json(rows.map(element => element["Field"].indexOf("id") === -1 ? element["Field"] : ""));

    }catch(err){

    }
})


export default router