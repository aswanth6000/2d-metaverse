import crypto from "crypto"

export const generateTokenAndHash = ()=>{
    const token = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(token).digest('hex')
    return {token, hash}
}

export const hashToken = (token: string)=>{
    return crypto.createHash('sha256').update(token).digest('hex')
}