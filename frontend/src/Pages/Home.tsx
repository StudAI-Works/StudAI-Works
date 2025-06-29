import axios from 'axios';
import React, { useRef } from 'react'
import { IoIosArrowRoundUp } from "react-icons/io";

function Home() {
  const BASE_URL: string = "http://localhost:8080"
  const userPromt = useRef<HTMLTextAreaElement | null>(null)
  const HandlePromt = () => {
    if (userPromt?.current?.value) {
      axios.post(`${BASE_URL}/userpromt`, { Promt: userPromt.current.value })
        .then(res => {
          console.log(res)
        })
    }
  }
  return (
    <div className='text-3xl relative w-screen min-h-screen overflow-y-auto'>
      <p className='text-lg'>Home part goes here</p>

      <div></div>

      <div className='w-[50%]  absolute bottom-0 transition-all    flex items-center justify-evenly pl-10  h-20 '>
        <textarea className='border border-gray-100 placeholder:text-sm focus:bg-gray-100 rounded-2xl focus:outline-1 pt-3  bottom-10 w-[70%]  placeholder:top-2 md:placeholder:top-3 min-h-11 text-sm pl-4 placeholder:absolute lg:placeholder:top-3 xl:placeholder:top-3' placeholder='Enter your promt here' ref={userPromt} />
        <button className='border border-gray-200 rounded-3xl  bottom-10 hover:bg-gray-200 transition-all duration-100 right-0 p-1 active:scale-125'><IoIosArrowRoundUp className='font-light' onClick={HandlePromt} /></button>
      </div>
    </div>
  )
}

export default Home
