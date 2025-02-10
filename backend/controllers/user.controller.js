import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import dotenv from "dotenv";

dotenv.config(); // 🔹 Ensure environment variables are loaded

const SECRET_KEY = process.env.SECRET_KEY || "default_secret"; // 🔹 Ensure SECRET_KEY is defined

// ✅ Register User
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required!",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use. Try another one!",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Registration error",
      success: false,
    });
  }
};

// ✅ Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required!",
        success: false,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    if (!SECRET_KEY) {
      throw new Error("JWT Secret Key is missing!");
    }

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "1d",
    });

    const populatedPosts = await Promise.all(
      user.posts.map(async (postId) => {
        const post = await Post.findById(postId);
        return post?.author.equals(user._id) ? postId : null;
      })
    );

    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: populatedPosts,
    };

    return res
      .cookie("token", token, { httpOnly: true, sameSite: "strict", maxAge: 86400000 }) // 1 day
      .json({
        success: true,
        message: `Welcome back, ${user.username}!`,
        user,
      });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Login error",
      success: false,
    });
  }
};

// ✅ Logout User
export const logout = async (req, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully!",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "Logout error",
      success: false,
    });
  }
};

// ✅ Get User by ID
export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .populate({ path: "posts", options: { sort: { createdAt: -1 } } })
      .populate("bookmarks");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      message: "Get profile error",
      success: false,
    });
  }
};

// ✅ Edit Profile
export const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { bio, gender } = req.body;
    const profilePicture = req.file;
    let cloudResponse;

    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully!",
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({
      message: "Profile update error",
      success: false,
    });
  }
};

// ✅ Get Suggested Users
export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");

    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.error("Get suggested users error:", error);
    return res.status(500).json({
      message: "Get suggested users error",
      success: false,
    });
  }
};

// ✅ Follow / Unfollow User
export const followOrUnfollow = async (req, res) => {
  try {
    const userId = req.id;
    const targetUserId = req.params.id;

    if (userId === targetUserId) {
      return res.status(400).json({
        message: "You cannot follow/unfollow yourself!",
        success: false,
      });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const isFollowing = user.following.includes(targetUserId);

    if (isFollowing) {
      await Promise.all([
        User.findByIdAndUpdate(userId, { $pull: { following: targetUserId } }),
        User.findByIdAndUpdate(targetUserId, { $pull: { followers: userId } }),
      ]);

      return res.status(200).json({
        success: true,
        message: "Unfollowed successfully!",
      });
    } else {
      await Promise.all([
        User.findByIdAndUpdate(userId, { $push: { following: targetUserId } }),
        User.findByIdAndUpdate(targetUserId, { $push: { followers: userId } }),
      ]);

      return res.status(200).json({
        success: true,
        message: "Followed successfully!",
      });
    }
  } catch (error) {
    console.error("Follow/unfollow error:", error);
    return res.status(500).json({
      message: "Follow/unfollow error",
      success: false,
    });
  }
};
