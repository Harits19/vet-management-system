const getEnv = (key: string) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Environment variable "${key}" is not configured.`);
  }

  return value;
};

export const getMongoUri = () => {
  return (
    process.env.MONGODB_URI ||
    (process.env.NODE_ENV === "production"
      ? getEnv("MONGO_URL")
      : getEnv("LOCAL_URL"))
  );
};

export const getApiPort = () => Number(process.env.API_PORT || 4000);
