"use client"

const Banner = () => {
  return (
    <div className="absolute w-full -top-[56px]">
      <div className="relative h-[530px] md:h-[738px] overflow-hidden opacity-[0.02]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute left-0 w-full h-full object-cover"
        >
          <source
            src="/static/video/shutterstock_1096503017.mov"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  )
}

export default Banner
