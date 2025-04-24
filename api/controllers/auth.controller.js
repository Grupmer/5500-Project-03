import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { errorHandler } from "../utils/error.js";

const prisma = new PrismaClient();

export const signUp = async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ message: "Email already in use. Please use a different email or login." });
        }

        const hashedPassword = bcryptjs.hashSync(password, 10);

        const newUser = await prisma.user.create({
            data: { username, email, password: hashedPassword },
        });

        const token = jwt.sign(
            { id: newUser.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: "7d" }
        );

        res.status(201).json({ 
            message: "User created successfully", 
            token, 
            user: { 
                id: newUser.id, 
                username: newUser.username, 
                email: newUser.email 
            }
        });
    } catch (error) {
        next(error);
    }
};

export const logIn = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const validUser = await prisma.user.findUnique({ where: { email } });
        if (!validUser) return next(errorHandler(404, "User not found"));

        const validPassword = bcryptjs.compareSync(password, validUser.password);
        if (!validPassword) return next(errorHandler(401, "Wrong credentials"));

        const token = jwt.sign({ id: validUser.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        const { password: pass, ...userData } = validUser;

        // 返回 token 和用户信息
        res.status(200).json({ token, user: userData });
    } catch (error) {
        next(error);
    }
};
