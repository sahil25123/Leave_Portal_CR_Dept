import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = "7d";

if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET is not set. Please configure it before starting the server.",
  );
}

export { jwtSecret, jwtExpiresIn };
