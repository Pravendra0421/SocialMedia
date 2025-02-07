import {USER_API} from "@/lib/constants";
import { setSuggestedUsers } from "@/redux/authSlice";
import axios from "axios";
import { useEffect } from "react"
import { useDispatch } from "react-redux";

const useGetSuggestedUsers = () => {

    const dispatch = useDispatch()

    useEffect(() => {
        const fetchSuggestedUsers = async () => {
            try {
                const res = await axios.get(`${USER_API}/suggested`, {withCredentials: true});

                if(res?.data?.success){
                    // console.log(res?.data)
                    dispatch(setSuggestedUsers(res?.data?.users));
                }
            } catch (error) {
                console.log("error in getting suggested users", error);
            }
        }
        fetchSuggestedUsers();
    }, []);
}

export default useGetSuggestedUsers;
