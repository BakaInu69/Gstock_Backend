import { NextFunction, Request, Response } from "express";
export async function validationResponse(req: Request, res: Response, next: NextFunction) {
    const validationError = await req.getValidationResult();
    if (!validationError.isEmpty()) {
        return res.status(400).json({ message: validationError.array({onlyFirstError: true})[0].msg });
    }
    next();
}