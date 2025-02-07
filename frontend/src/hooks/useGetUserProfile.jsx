import { USER_API } from "@/lib/constants";
import { setUserProfile } from "@/redux/authSlice";
import axios from "axios";
import { useEffect } from "react"
import { useDispatch } from "react-redux";

const useGetUserProfile = (userId) => {

    const dispatch = useDispatch()

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const res = await axios.get(`${USER_API}/${userId}/profile`, {withCredentials: true});

                if(res?.data?.success){
                    // console.log(res?.data)
                    dispatch(setUserProfile(res?.data?.user));
                }
            } catch (error) {
                console.log("use get all post error", error);
            }
        }
        fetchUserProfile();
    }, [userId]);
}

export default useGetUserProfile;
