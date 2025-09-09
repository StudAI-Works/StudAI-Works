import { Request, Response, NextFunction } from "express"

type Requestedfunction = (req: Request, res: Response, next?: NextFunction) => Promise<void> | void

const ApiHandler = (requestedFunction: Requestedfunction) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await requestedFunction(req,res,next)
        } catch (error) {
            next(error)
        }
    }
}

export default ApiHandler
