import { POST_API } from "@/lib/constants";
import { setPosts } from "@/redux/postSlice";
import axios from "axios";
import { useEffect } from "react"
import { useDispatch } from "react-redux";

const useGetAllPost = () => {

    const dispatch = useDispatch()

    useEffect(() => {
        const fetchAllPost = async () => {
            try {
                const res = await axios.get(`${POST_API}/all`, {withCredentials: true});

                if(res?.data?.success){
                    // console.log(res?.data)
                    dispatch(setPosts(res?.data?.posts));
                }
            } catch (error) {
                console.log("use get all post error", error);
            }
        }
        fetchAllPost();
    }, []);
}

export default useGetAllPost
