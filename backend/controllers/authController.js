import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, tokenBlacklist } from '../utils/jwt.js';
import bcrypt from 'bcrypt';

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword
      // virtualBalance defaults to 1,000,000
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        virtualBalance: user.virtualBalance
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        virtualBalance: user.virtualBalance,
        accessToken,
        refreshToken
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No token provided' });

    if (tokenBlacklist.has(refreshToken)) {
       return res.status(401).json({ message: 'Refresh token revoked' });
    }

    import('../utils/jwt.js').then(({ verifyRefreshToken, generateAccessToken }) => {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        const accessToken = generateAccessToken(decoded.userId);
        res.status(200).json({ accessToken });
      } catch (err) {
        res.status(401).json({ message: 'Invalid refresh token' });
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      tokenBlacklist.add(refreshToken);
    }
    // Access token is usually dropped on the client-side
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
