import { getCurrentUser, loginUser } from "../services/auth.service.js";

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await loginUser(email, password);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Login failed",
    });
  }
}

export async function me(req, res) {
  try {
    const user = await getCurrentUser(req.user.id);

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Unable to fetch user",
    });
  }
}
