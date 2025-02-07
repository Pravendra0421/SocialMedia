import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// registeration
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }

        const user = await User.findOne({email});
        if (user) {
            return res.status(401).json({
                message: "Try different email",
                success: false,
            });
        };

        const hashedPassword = await bcrypt.hash(password, 10);
        
        await User.create({
            username,
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: "User created successfully",
        })

    } catch (error) {
        console.log("registeration error", error);
        return res.status(401).json({
            message: "registeration error",
            success: false,
        });
    }
};

// login
export const login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }

        let user = await User.findOne({email});
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
        };

        const token = await jwt.sign({userId: user._id}, process.env.SECRET_KEY, {expiresIn: "1d"});

         // populate each post if in the posts array
         const populatedPosts = await Promise.all(
            user.posts.map( async (postId) => {
                const post = await Post.findById(postId);
                if(post.author.equals(user._id)){
                    return postId;
                }
                return null;
            })
         )

        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: populatedPosts,
        }

        return res.cookie("token", token, {httpOnly: true, sameSite: "strict", maxAge: 1*24*60*60*1000}).json({
            success: true,
            message: `Welcome back ${user.username}`,
            user
        });
    }
     catch (error) {
        console.log("login error", error);
        return res.status(401).json({
            message: "login error",
            success: false,
        });
    }
};

// logout
export const logout = async (req, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0 }).json({
            message: 'Logged out successfully.',
            success: true
        });
    } catch (error) {
        console.log("logout error", error);
        return res.status(401).json({
            message: "logout error",
            success: false,
        });
    }
}

// get user by id
export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        let user = await User.findById(userId).populate({path: "posts", createdAt: -1})
                                              .populate("bookmarks");
        if(!user){
            return res.status(401).json({
                message: "user not exit",
                success: false,
            });
        }
        
        return res.status(200).json({
            success: true,
            user,
        });
    } 
    catch (error) {
        console.log('get profile error', error);
        return res.status(400).json({
            message: "get profile error",
            success: false,
        });
    }
}

// edit profile - update
export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const {bio, gender} = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if(profilePicture){
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
                success: false
            });
        };
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: 'Profile updated.',
            success: true,
            user
        });
    } catch (error) {
        console.log("user updation error", error);
    }
}

// get all user
export const getSuggestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");
        if (!suggestedUsers) {
            return res.status(400).json({
                message: 'Currently do not have any users',
            })
        };
        return res.status(200).json({
            success: true,
            users: suggestedUsers
        })
    } catch (error) {
        console.log(error);
    }
};

// follow or unfollow
export const followOrUnfollow = async (req, res) => {
    try {
        const followKrneWala = req.id; 
        const jiskoFollowKrunga = req.params.id; 

        if (followKrneWala === jiskoFollowKrunga) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself',
                success: false
            });
        }

        const user = await User.findById(followKrneWala);
        const targetUser = await User.findById(jiskoFollowKrunga);

        if (!user || !targetUser) {
            return res.status(400).json({
                success: false,
                message: 'User not found',
            });
        }
         // mein check krunga ki follow krna hai ya unfollow
         const isFollowing = user.following.includes(jiskoFollowKrunga);

         if(isFollowing){
           // unfollow logic
           await Promise.all([
               User.updateOne({_id: followKrneWala}, {$pull: {following: jiskoFollowKrunga}}),
               User.updateOne({_id: jiskoFollowKrunga}, {$pull: {followers: followKrneWala}}),
           ])
           return res.status(200).json({
               success: true,
               message: "Unfollow successfully",
           })
         } else {
           // follow logic
           await Promise.all([
               User.updateOne({_id: followKrneWala}, {$push: {following: jiskoFollowKrunga}}),
               User.updateOne({_id: jiskoFollowKrunga}, {$push: {followers: followKrneWala}}),
           ])
           return res.status(200).json({
               success: true,
               message: "Follow successfully",
           })
         }
    } catch (error) {
        console.log("follow unfollow error", error);
        return res.status(400).json({
            success: false,
            message: "Follow unfollow error",
        })
    }
}