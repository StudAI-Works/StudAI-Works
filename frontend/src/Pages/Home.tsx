import axios from 'axios';
import React, { useRef } from 'react'
import { IoIosArrowRoundUp } from "react-icons/io";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css"
function Home() {
  const BASE_URL: string = "http://localhost:8080"
  const userPromt = useRef<HTMLTextAreaElement | null>(null)
  const HandlePromt = () => {
    // console.log("clicked")
    if (userPromt?.current?.value) {
      axios.post(`${BASE_URL}/userpromt`, { Promt: userPromt.current.value })
        .then(res => {
          console.log(res)
          if (res.data) {
            toast.success("Sent", {autoClose:1500, style:{fontSize:"14px", width:"140px"}})
          }
          else {
            toast.error("Faild",{autoClose:1500})
          }
        })
    }
  }
  return (
    <div className='text-3xl relative w-screen min-h-screen overflow-y-auto'>
      <ToastContainer/>
      <p className='text-lg'> Home part </p>

      <div></div>

      <div className='w-[50%]  absolute bottom-0 transition-all bg-gray-100 rounded-2xl flex items-center justify-evenly pl-10  h-20 '>
        <textarea className='border border-gray-100 placeholder:text-sm left-4 w-[76%] absolute top-5 focus:bg-gray-200 rounded-2xl focus:outline-0 pt-3  bottom-10   placeholder:top-2 md:placeholder:top-3 min-h-11 text-sm pl-4 placeholder:absolute lg:placeholder:top-3 xl:placeholder:top-3' placeholder='Enter your promt here' ref={userPromt} />
        <button className='z-10 absolute right-10 rounded-3xl border border-gray-300 p-1 hover:bg-gray-300 active:scale-110'><IoIosArrowRoundUp className='font-light' onClick={HandlePromt} /></button>

      </div>
    </div>
  )
}

export default Home
