import {Users} from "../models";
import createHttpError from "http-errors";
import JWT from "../libs/utils/authenticate";
import {
    validateEmail,
    validateNumber
} from "../libs/utils/regex";

import {hashPasswords,compareHashPassword} from "../libs/utils/bcrypt";
