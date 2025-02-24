import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import axios from "axios";
import { USER_API } from "@/lib/constants";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";

const Signup = () => {
  const [input, setInput] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {user} = useSelector(store => store?.auth);

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const signupHandler = async (e) => {
    e.preventDefault();
    console.log(input);
    try {
      setLoading(true);
      const res = await axios.post(`${USER_API}/register`, input, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (res?.data?.success) {
        toast.success(res?.data?.message);
        navigate("/login");
        setInput({
          username: "",
          email: "",
          password: "",
        });
      }
    } catch (error) {
      console.log("signup error", error);
      toast.error(error?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    if(user){
        navigate("/");
    }
},[])

  return (
    <div className="flex items-center w-screen h-screen justify-center">
      <form
        onSubmit={signupHandler}
        className="flex flex-col shadow-lg gap-5 p-8"
      >
        <div className="my-4">
          <h1 className="font-bold text-xl text-center">Logo</h1>
          <p className="text-sm text-center my-2">
            Signup to see photos & videos from your friends
          </p>
        </div>

        <div>
          <Label>Username</Label>
          <Input
            type="text"
            name="username"
            className="focus-visible:ring-transparent my-2"
            value={input.username}
            onChange={changeEventHandler}
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input
            type="text"
            name="email"
            className="focus-visible:ring-transparent my-2"
            value={input.email}
            onChange={changeEventHandler}
          />
        </div>

        <div>
          <Label>Password</Label>
          <Input
            type="text"
            name="password"
            className="focus-visible:ring-transparent my-2"
            value={input.password}
            onChange={changeEventHandler}
          />
        </div>
        {loading ? (
          <Button>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
          </Button>
        ) : (
          <Button type="submit">Signup</Button>
        )}

        <span className="text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">
            Login
          </Link>
        </span>
      </form>
    </div>
  );
};

export default Signup;
