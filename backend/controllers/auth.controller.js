import {
  changePassword as changePasswordService,
  getCurrentUser,
  loginUser,
} from "../services/auth.service.js";

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

export async function changePassword(req, res) {
  try {
    const result = await changePasswordService(req.user.id, req.body);

    return res.status(200).json({
      message: "Password changed successfully",
      user: result.user,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Unable to change password",
    });
  }
}
