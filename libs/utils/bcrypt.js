import bcrypt from 'bcrypt';

export const hashPassword = (password) =>{

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
}

export const compareHashPassword = (password, hashedPassword)=>
{
    const isPasswordMatch = bcrypt.compareSync(password, hashedPassword);
    return isPasswordMatch;
}