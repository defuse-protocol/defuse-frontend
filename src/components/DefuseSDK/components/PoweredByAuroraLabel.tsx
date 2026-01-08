import TooltipNew from "./TooltipNew"

export const PoweredByAuroraLabel = () => (
  <TooltipNew>
    <TooltipNew.Trigger>
      <button
        type="button"
        className="relative z-20 flex items-center justify-center size-6 rounded-full bg-[#101820]"
        aria-label="Powered by Aurora"
      >
        <svg
          fill="none"
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="size-3.5 -mt-px shrink-0"
        >
          <path
            fill="#5deb5a"
            stroke="#5deb5a"
            d="M10 3.293c.67 0 1.274.372 1.574.972l4.947 9.896a1.75 1.75 0 0 1-.076 1.712 1.748 1.748 0 0 1-1.497.834H5.052a1.748 1.748 0 0 1-1.496-.834 1.748 1.748 0 0 1-.078-1.712l4.948-9.896c.3-.6.903-.972 1.574-.972Zm0-1.21a2.969 2.969 0 0 0-2.655 1.641L2.397 13.62a2.969 2.969 0 0 0 2.655 4.297h9.896a2.969 2.969 0 0 0 2.655-4.297l-4.948-9.896A2.968 2.968 0 0 0 10 2.084Z"
          />
        </svg>
      </button>
    </TooltipNew.Trigger>
    <TooltipNew.Content side="left">Powered by Aurora</TooltipNew.Content>
  </TooltipNew>
)
