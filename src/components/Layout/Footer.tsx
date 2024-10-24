import Image from "next/image"

const Footer = () => {
  return (
    <footer className="w-full flex justify-center items-center py-7">
      <div className="flex justify-center items-center text-sm text-secondary gap-1.5 bg-white px-3 py-1.5 rounded-full dark:bg-gray-700 dark:text-white">
        <span>Powered by</span>
        <Image
          src="/static/icons/network/near_dark.svg"
          width={16}
          height={16}
          alt="Near logo"
        />
        <span className="text-black-400 dark:text-white">Near</span>
      </div>
    </footer>
  )
}

export default Footer
