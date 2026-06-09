import { configDotenv } from "dotenv"


configDotenv({ path: process.env.NODE_ENV !== 'production' ? '.env.example' : '.env' })

const envList = ['DEFAULT_USER_PASSWORD', 'DEFAULT_USER_EMAIL',] as const;

type ENKey = typeof envList[number];




function checkENV() {
    const env: Record<string, string> = {}

    for (const key of envList) {
        const value = process.env[key];
        console.log('check env', key, 'value', value);

        if (!value) throw new Error(`ENV ${key} is not defined`)
        env[key] = value;
    }
    const envString = env as Record<ENKey, string>;

    const result = {
        ...envString,
        ENABLE_SEED: process.env.ENABLE_SEED === 'true',
    }

    return result;
}




const ENV = checkENV();

export default ENV;