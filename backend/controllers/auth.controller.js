import {
  changePassword as changePasswordService,
  forgotPassword as forgotPasswordService,
  getCurrentUser,
  loginUser,
  resetPassword as resetPasswordService,
  validateResetToken as validateResetTokenService,
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

export async function forgotPassword(req, res) {
  try {
    const result = await forgotPasswordService(req.body);

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Unable to process password reset request",
    });
  }
}

export async function validateResetToken(req, res) {
  try {
    const token = req.query?.token;
    await validateResetTokenService(token);

    return res.status(200).json({
      valid: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Reset token is invalid or expired",
    });
  }
}

export async function resetPassword(req, res) {
  try {
    const result = await resetPasswordService(req.body);

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Unable to reset password",
    });
  }
}
