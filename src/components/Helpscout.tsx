import { HELPSCOUT_BEACON_ID } from "@src/utils/environment"
import Script from "next/script"

const Helpscout = () => {
  return (
    <>
      <Script id="helpscout-beacon" strategy="lazyOnload">
        {`!function(e,t,n){function a(){var e=t.getElementsByTagName("script")[0],n=t.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://beacon-v2.helpscout.net",e.parentNode.insertBefore(n,e)}if(e.Beacon=n=function(t,n,a){e.Beacon.readyQueue.push({method:t,options:n,data:a})},n.readyQueue=[],"complete"===t.readyState)return a();e.attachEvent?e.attachEvent("onload",a):e.addEventListener("load",a,!1)}(window,document,window.Beacon||function(){});`}
      </Script>
      <Script id="helpscout-beacon-init" strategy="lazyOnload">
        {`window.Beacon('init', '${HELPSCOUT_BEACON_ID}')`}
      </Script>
    </>
  )
}

export default Helpscout
